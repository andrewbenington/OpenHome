import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { HomeData } from '@openhome-core/save/HomeData'
import { SaveWriter } from '@openhome-core/save/interfaces'
import { Errorable } from '@openhome-core/util/functional'
import * as E from 'fp-ts/lib/Either'
import { createContext, PropsWithChildren } from 'react'
import BackendInterface from './backendInterface'
import DummyBackend from './dummyBackend'

export type BackendProviderProps = {
  backend: BackendInterface
} & PropsWithChildren

function addHelpersToBackend(backend: BackendInterface): BackendWithHelpersInterface {
  return {
    ...backend,
    writeAllSaveFiles: async (_saveWriters: SaveWriter[]) => [E.left('No backend in use')],
    writeAllHomeData: async (_homeData: HomeData, _mons: OHPKM[]) => [E.left('No backend in use')],
  }
}

export interface BackendWithHelpersInterface extends BackendInterface {
  /* game saves */
  writeAllSaveFiles: (saveWriters: SaveWriter[]) => Promise<Errorable<null>[]>

  /* home data */
  writeAllHomeData: (homeData: HomeData, mons: OHPKM[]) => Promise<Errorable<null>[]>
}

export const BackendContext = createContext<BackendWithHelpersInterface>(
  addHelpersToBackend(DummyBackend)
)
