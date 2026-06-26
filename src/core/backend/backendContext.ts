import { SaveWriter } from '@openhome-core/save/interfaces'
import { Errorable, R } from '@openhome-core/util/functional'
import { createContext } from 'react'
import BackendInterface from './backendInterface'
import DummyBackend from './dummyBackend'

function addHelpersToBackend(backend: BackendInterface): BackendWithHelpersInterface {
  return {
    ...backend,
    writeAllSaveFiles: async (_saveWriters: SaveWriter[]) => [R.Err('No backend in use')],
  }
}

export interface BackendWithHelpersInterface extends BackendInterface {
  /* game saves */
  writeAllSaveFiles: (saveWriters: SaveWriter[]) => Promise<Errorable<null>[]>
}

export const BackendContext = createContext<BackendWithHelpersInterface>(
  addHelpersToBackend(DummyBackend)
)
