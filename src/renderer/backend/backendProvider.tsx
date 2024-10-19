import * as E from 'fp-ts/lib/Either'
import { PokemonData } from 'pokemon-species-data'
import { createContext, PropsWithChildren } from 'react'
import { OHPKM } from 'src/types/pkm/OHPKM'
import { SAV } from 'src/types/SAVTypes'
import { HomeData } from 'src/types/SAVTypes/HomeData'
import { StoredBoxData } from 'src/types/storage'
import { Errorable } from 'src/types/types'
import BackendInterface from '../../types/backendInterface'
import DummyBackend from './dummyBackend'

export type BackendProviderProps = { backend: BackendInterface } & PropsWithChildren

function addHelpersToBackend(backend: BackendInterface): BackendWithHelpersInterface {
  return {
    ...backend,
    writeAllSaveFiles: async (saveFiles: SAV[]) => writeAllSaveFiles(backend, saveFiles),
    writeAllHomeData: async (homeData: HomeData, mons: OHPKM[]) =>
      writeAllHomeData(backend, homeData, mons),
  }
}

export const BackendContext = createContext<BackendWithHelpersInterface>(
  addHelpersToBackend(DummyBackend)
)

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
  saveFiles.forEach((save) => save.prepareBoxesForSaving())
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
      const result = await backend.writeHomeMon(bytes)
      results.push(result)
    } catch (e) {
      const species = mon.dexNum in PokemonData ? PokemonData[mon.dexNum].name : 'Unknown Species'
      results.push(E.left(`Error encoding ${mon.nickname} (${species})`))
    }
  }
  return results
}

export function BackendProvider({ backend, children }: BackendProviderProps) {
  const backendWithHelpers = addHelpersToBackend(backend)

  return <BackendContext.Provider value={backendWithHelpers}>{children}</BackendContext.Provider>
}
