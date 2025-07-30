import * as E from 'fp-ts/lib/Either'
import { PokemonData } from 'pokemon-species-data'
import { PropsWithChildren } from 'react'
import { OHPKM } from 'src/types/pkm/OHPKM'
import { HomeData } from 'src/types/SAVTypes/HomeData'
import { SAV } from 'src/types/SAVTypes/SAV'
import { StoredBoxData } from 'src/types/storage'
import { Errorable } from 'src/types/types'
import { getMonFileIdentifier } from 'src/util/Lookup'
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
  const allStoredBoxData: StoredBoxData[] = homeData.boxes.map((box, index) => ({
    index,
    name: box.name,
    monIdentifiersByIndex: box.getIdentifierMapping(),
  }))
  const boxesResult = await backend.writeHomeBoxes(allStoredBoxData)

  if (E.isLeft(boxesResult)) {
    return [boxesResult]
  }

  const results: Errorable<null>[] = []

  for (const mon of mons) {
    try {
      const bytes = new Uint8Array(mon.toBytes())
      const identifier = getMonFileIdentifier(mon)

      if (identifier === undefined) {
        results.push(
          E.left(
            `Could not get identifier for mon: ${mon.nickname} (${PokemonData[mon.dexNum].name})`
          )
        )
        continue
      }
      const result = await backend.writeHomeMon(identifier, bytes)

      results.push(result)
    } catch (e) {
      const species = mon.dexNum in PokemonData ? PokemonData[mon.dexNum].name : 'Unknown Species'

      results.push(E.left(`Error encoding ${mon.nickname} (${species}): ${e}`))
    }
  }
  return results
}

export function BackendProvider({ backend, children }: BackendProviderProps) {
  const backendWithHelpers = addHelpersToBackend(backend)

  return <BackendContext.Provider value={backendWithHelpers}>{children}</BackendContext.Provider>
}
