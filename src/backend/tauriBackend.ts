import { path } from '@tauri-apps/api'
import { open as fileDialog } from '@tauri-apps/plugin-dialog'
import { platform } from '@tauri-apps/plugin-os'
import { open } from '@tauri-apps/plugin-shell'
import * as E from 'fp-ts/lib/Either'
import { PathData, PossibleSaves } from 'src/types/SAVTypes/path'
import BackendInterface from 'src/types/backendInterface'
import { SaveFolder, StoredBoxData } from 'src/types/storage'
import { OHPKM } from '../types/pkm/OHPKM'
import { Errorable, LoadSaveResponse, LookupMap, SaveRef } from '../types/types'
import { TauriInvoker } from './tauri/tauriInvoker'

export const TauriBackend: BackendInterface = {
  /* past gen identifier lookups */
  loadGen12Lookup: function (): Promise<Errorable<LookupMap>> {
    return TauriInvoker.getStorageFileJSON('gen12_lookup.json') as Promise<Errorable<LookupMap>>
  },
  loadGen345Lookup: function (): Promise<Errorable<LookupMap>> {
    return TauriInvoker.getStorageFileJSON('gen345_lookup.json') as Promise<Errorable<LookupMap>>
  },
  writeGen12Lookup: function (lookup: LookupMap): Promise<Errorable<null>> {
    return TauriInvoker.writeStorageFileJSON('gen12_lookup.json', lookup)
  },
  writeGen345Lookup: function (lookup: LookupMap): Promise<Errorable<null>> {
    return TauriInvoker.writeStorageFileJSON('gen345_lookup.json', lookup)
  },

  // /* OHPKM management */
  loadHomeMonLookup: async function (): Promise<Errorable<Record<string, OHPKM>>> {
    const bytesByFilename = await TauriInvoker.getOHPKMFiles()
    if (E.isLeft(bytesByFilename)) return bytesByFilename
    return E.right(
      Object.fromEntries(
        Object.entries(bytesByFilename.right).map(([filename, bytes]) => [
          filename.slice(0, filename.length - 6),
          new OHPKM(bytes),
        ])
      )
    )
  },

  deleteHomeMons: async function (identifiers: string[]): Promise<Errorable<null>> {
    const deletionResults = await TauriInvoker.deleteStorageFiles(
      identifiers.map((identifier) => `mons/${identifier}.ohpkm`)
    )
    if (E.isLeft(deletionResults)) {
      return deletionResults
    }

    const errors = Object.entries(deletionResults.right).filter(([, fileResult]) =>
      E.isLeft(fileResult)
    ) as [string, E.Left<string>][]
    for (const [file, error] of errors) {
      console.error(`Could not delete ${file}: ${error.left}`)
    }

    return E.right(null)
  },

  writeHomeMon: async (identifier: string, bytes: Uint8Array): Promise<Errorable<null>> => {
    const relativePath = await path.join('mons', `${identifier}.ohpkm`)
    return TauriInvoker.writeStorageFileBytes(relativePath, bytes)
  },

  /* openhome boxes */
  loadHomeBoxes: function (): Promise<Errorable<StoredBoxData[]>> {
    return TauriInvoker.getStorageFileJSON('box-data.json') as Promise<Errorable<StoredBoxData[]>>
  },
  writeHomeBoxes: (boxData: StoredBoxData[]): Promise<Errorable<null>> => {
    return TauriInvoker.writeStorageFileJSON('box-data.json', boxData)
  },

  /* game saves */
  loadSaveFile: async (pathData: PathData): Promise<Errorable<LoadSaveResponse>> => {
    const bytesResult = await TauriInvoker.getFileBytes(pathData.raw)
    if (E.isLeft(bytesResult)) {
      return bytesResult
    }
    const createdUnixResult = await TauriInvoker.getFileCreated(pathData.raw)
    if (E.isLeft(createdUnixResult)) {
      return createdUnixResult
    }
    return E.right({
      path: pathData,
      fileBytes: bytesResult.right,
      createdDate: new Date(createdUnixResult.right),
    })
  },
  writeSaveFile: (path: string, bytes: Uint8Array) => {
    return TauriInvoker.writeFileBytes(path, bytes)
  },

  // /* game save management */
  getRecentSaves: async (): Promise<Errorable<Record<string, SaveRef>>> => {
    return TauriInvoker.getStorageFileJSON('recent_saves.json') as Promise<
      Errorable<Record<string, SaveRef>>
    >
  },
  addRecentSave: async (saveRef: SaveRef): Promise<Errorable<null>> => {
    const recentSavesResult = await (TauriInvoker.getStorageFileJSON(
      'recent_saves.json'
    ) as Promise<Errorable<Record<string, SaveRef>>>)
    if (E.isLeft(recentSavesResult)) {
      return recentSavesResult
    }

    const recentSaves = recentSavesResult.right
    recentSaves[saveRef.filePath.raw] = saveRef
    return TauriInvoker.writeStorageFileJSON('recent_saves.json', recentSaves)
  },
  removeRecentSave: async (filePath: string): Promise<Errorable<null>> => {
    const recentSavesResult = await (TauriInvoker.getStorageFileJSON(
      'recent_saves.json'
    ) as Promise<Errorable<Record<string, SaveRef>>>)
    if (E.isLeft(recentSavesResult)) {
      return recentSavesResult
    }

    const recentSaves = recentSavesResult.right
    delete recentSaves[filePath]
    return TauriInvoker.writeStorageFileJSON('recent_saves.json', recentSaves)
  },
  findSuggestedSaves: async (): Promise<Errorable<PossibleSaves>> => {
    return E.left('Not implemented')
  },
  getSaveFolders: async (): Promise<Errorable<SaveFolder[]>> => {
    return TauriInvoker.getStorageFileJSON('save-folders.json') as Promise<Errorable<SaveFolder[]>>
  },
  removeSaveFolder: async (_path: string): Promise<Errorable<null>> => {
    return E.left('Not implemented')
  },
  upsertSaveFolder: async (_folderPath: string, _label: string): Promise<Errorable<null>> => {
    return E.left('Not implemented')
  },

  /* transactions */
  startTransaction: async (): Promise<Errorable<null>> => {
    return E.left('Not implemented')
  },
  commitTransaction: async (): Promise<Errorable<null>> => {
    return E.left('Not implemented')
  },
  rollbackTransaction: async (): Promise<Errorable<null>> => {
    return E.left('Not implemented')
  },

  /* application */
  setHasChanges: async (_hasChanges: boolean): Promise<void> => {
    console.error('Not implemented')
  },
  pickFolder: (): Promise<Errorable<string | undefined>> => {
    return fileDialog({ directory: true, title: 'Select Folder' }).then((path) =>
      E.right(path ?? undefined)
    )
  },
  getResourcesPath: () => {
    console.log(path.resourceDir())
    return path.resourceDir()
  },
  openDirectory: async (directory: string): Promise<Errorable<null>> => {
    open(directory)
    return E.right(null)
  },
  getPlatform: async () => platform(),
}

// export const ElectronBackendContext = createContext(ElectronBackend);
