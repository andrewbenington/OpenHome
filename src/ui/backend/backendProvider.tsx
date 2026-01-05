import { getMonFileIdentifier } from '@openhome-core/pkm/Lookup'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { HomeData } from '@openhome-core/save/HomeData'
import { SAV } from '@openhome-core/save/interfaces'
import { Errorable, R } from '@openhome-core/util/functional'
import { PropsWithChildren } from 'react'
import { BackendContext } from './backendContext'
import BackendInterface from './backendInterface'

export type BackendProviderProps = {
  backend: BackendInterface
} & PropsWithChildren

function addHelpersToBackend(backend: BackendInterface): BackendWithHelpersInterface {
  return {
    ...backend,
    writeAllSaveFiles: async (saveFiles: SAV[]) => writeAllSaveFiles(backend, saveFiles),
    writeAllHomeData: async (homeData: HomeData, mons: OHPKM[]) =>
      writeAllHomeData(backend, homeData, mons),
  }
}

export interface BackendWithHelpersInterface extends BackendInterface {
  /* game saves */
  writeAllSaveFiles: (saveFiles: SAV[]) => Promise<Errorable<null>[]>

  /* home data */
  writeAllHomeData: (homeData: HomeData, mons: OHPKM[]) => Promise<Errorable<null>[]>
}

async function writeAllSaveFiles(
  backend: BackendInterface,
  saveFiles: SAV[]
): Promise<Errorable<null>[]> {
  return Promise.all(
    saveFiles.map((saveFile) => backend.writeSaveFile(saveFile.filePath.raw, saveFile.bytes))
  )
}

async function writeAllHomeData(
  backend: BackendInterface,
  homeData: HomeData,
  mons: OHPKM[]
): Promise<Errorable<null>[]> {
  const banksResult = await backend.writeHomeBanks({
    banks: homeData.banks,
    current_bank: homeData.currentBankIndex,
  })

  if (banksResult.isErr()) {
    return [banksResult, await backend.rollbackTransaction()]
  }

  const results: Errorable<null>[] = []

  for (const mon of mons) {
    try {
      const bytes = new Uint8Array(mon.toBytes())
      const identifier = getMonFileIdentifier(mon)

      if (identifier === undefined) {
        results.push(
          R.Err(`Could not get identifier for mon: ${mon.nickname} (${mon.metadata?.formeName})`)
        )
        continue
      }
      const result = await backend.writeHomeMon(identifier, bytes)

      results.push(result)
    } catch (e) {
      const species = mon.speciesMetadata?.name ?? 'Unknown Species'

      results.push(R.Err(`Error encoding ${mon.nickname} (${species}): ${e}`))
    }
  }
  return results
}

export function BackendProvider({ backend, children }: BackendProviderProps) {
  const backendWithHelpers = addHelpersToBackend(backend)

  return <BackendContext.Provider value={backendWithHelpers}>{children}</BackendContext.Provider>
}
