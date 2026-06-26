import { SaveWriter } from '@openhome-core/save/interfaces'
import { Errorable } from '@openhome-core/util/functional'
import { PropsWithChildren } from 'react'
import { BackendContext, BackendWithHelpersInterface } from './backendContext'
import BackendInterface from './backendInterface'

export type BackendProviderProps = {
  backend: BackendInterface
} & PropsWithChildren

function addHelpersToBackend(backend: BackendInterface): BackendWithHelpersInterface {
  return {
    ...backend,
    writeAllSaveFiles: async (saveWriters: SaveWriter[]) => writeAllSaveFiles(backend, saveWriters),
  }
}

async function writeAllSaveFiles(
  backend: BackendInterface,
  saveWriters: SaveWriter[]
): Promise<Errorable<null>[]> {
  return Promise.all(
    saveWriters.map((saveWriter) => backend.writeSaveFile(saveWriter.filepath, saveWriter.bytes))
  )
}

export function BackendProvider({ backend, children }: BackendProviderProps) {
  const backendWithHelpers = addHelpersToBackend(backend)

  return <BackendContext.Provider value={backendWithHelpers}>{children}</BackendContext.Provider>
}
