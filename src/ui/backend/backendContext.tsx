import * as E from 'fp-ts/lib/Either'
import { createContext, PropsWithChildren } from 'react'
import { OHPKM } from 'src/core/pkm/OHPKM'
import { HomeData } from 'src/core/SAVTypes/HomeData'
import { SAV } from 'src/core/SAVTypes/SAV'
import { Errorable } from 'src/types/types'
import BackendInterface from './backendInterface'
import DummyBackend from './dummyBackend'

export type BackendProviderProps = {
  backend: BackendInterface
} & PropsWithChildren

function addHelpersToBackend(backend: BackendInterface): BackendWithHelpersInterface {
  return {
    ...backend,
    writeAllSaveFiles: async (_saveFiles: SAV[]) => [E.left('No backend in use')],
    writeAllHomeData: async (_homeData: HomeData, _mons: OHPKM[]) => [E.left('No backend in use')],
  }
}

export interface BackendWithHelpersInterface extends BackendInterface {
  /* game saves */
  writeAllSaveFiles: (saveFiles: SAV[]) => Promise<Errorable<null>[]>

  /* home data */
  writeAllHomeData: (homeData: HomeData, mons: OHPKM[]) => Promise<Errorable<null>[]>
}

export const BackendContext = createContext<BackendWithHelpersInterface>(
  addHelpersToBackend(DummyBackend)
)
