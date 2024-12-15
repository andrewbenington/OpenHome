import { path } from '@tauri-apps/api'
import { listen } from '@tauri-apps/api/event'
import { open as fileDialog } from '@tauri-apps/plugin-dialog'
import { platform } from '@tauri-apps/plugin-os'
import { open } from '@tauri-apps/plugin-shell'
import * as E from 'fp-ts/lib/Either'
import BackendInterface from 'src/backend/backendInterface'
import { OHPKM } from 'src/types/pkm/OHPKM'
import { PathData, PossibleSaves } from 'src/types/SAVTypes/path'
import { SaveFolder, StoredBoxData } from 'src/types/storage'
import { Errorable, JSONObject, LoadSaveResponse, LookupMap, SaveRef } from 'src/types/types'
import { Settings } from '../../state/appInfo'
import { TauriInvoker } from './tauriInvoker'

async function pathDataFromRaw(raw: string): Promise<PathData> {
  const filename = await path.basename(raw)
  const dir = await path.dirname(raw)
  const ext = await path.extname(raw)

  const pathData: PathData = {
    raw,
    name: filename,
    separator: path.sep(),
    dir,
    ext,
  }

  return pathData
}

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
    const result = await (TauriInvoker.getStorageFileJSON('recent_saves.json') as Promise<
      Errorable<Record<string, SaveRef>>
    >)

    if (E.isLeft(result)) {
      return result
    }

    const validatedSaves: Record<string, SaveRef> = {}

    for (let [rawPath, saveRef] of Object.entries(result.right)) {
      if (!saveRef.filePath.dir) {
        saveRef.filePath = await pathDataFromRaw(rawPath)
      }

      validatedSaves[rawPath] = saveRef
    }

    return E.right(validatedSaves)
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
    return TauriInvoker.writeStorageFileJSON('recent_saves.json', recentSaves as JSONObject)
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
    return TauriInvoker.writeStorageFileJSON('recent_saves.json', recentSaves as JSONObject)
  },
  findSuggestedSaves: async (): Promise<Errorable<PossibleSaves>> => {
    const saveFolders = (await TauriInvoker.getStorageFileJSON('save-folders.json')) as Errorable<
      SaveFolder[]
    >

    if (E.isLeft(saveFolders)) {
      return saveFolders
    }
    return TauriInvoker.findSuggestedSaves(saveFolders.right.map((sf) => sf.path))
  },
  getSaveFolders: async (): Promise<Errorable<SaveFolder[]>> => {
    return TauriInvoker.getStorageFileJSON('save-folders.json') as Promise<Errorable<SaveFolder[]>>
  },
  removeSaveFolder: async (pathToRemove: string): Promise<Errorable<null>> => {
    const saveFoldersResult = await (TauriInvoker.getStorageFileJSON(
      'save-folders.json'
    ) as Promise<Errorable<SaveFolder[]>>)

    if (E.isLeft(saveFoldersResult)) {
      return saveFoldersResult
    }

    const saveFolders = saveFoldersResult.right.filter((folder) => folder.path !== pathToRemove)

    return TauriInvoker.writeStorageFileJSON('save-folders.json', saveFolders)
  },
  upsertSaveFolder: async (folderPath: string, label: string): Promise<Errorable<null>> => {
    const saveFoldersResult = await (TauriInvoker.getStorageFileJSON(
      'save-folders.json'
    ) as Promise<Errorable<SaveFolder[]>>)

    if (E.isLeft(saveFoldersResult)) {
      return saveFoldersResult
    }

    const saveFolders = saveFoldersResult.right.filter((folder) => folder.path !== folderPath)

    saveFolders.push({ label, path: folderPath })
    return TauriInvoker.writeStorageFileJSON('save-folders.json', saveFolders)
  },

  /* transactions */
  startTransaction: async (): Promise<Errorable<null>> => {
    return TauriInvoker.startTransaction()
  },
  commitTransaction: async (): Promise<Errorable<null>> => {
    return TauriInvoker.commitTransaction()
  },
  rollbackTransaction: async (): Promise<Errorable<null>> => {
    return TauriInvoker.rollbackTransaction()
  },

  /* application */
  pickFile: async (): Promise<Errorable<PathData | undefined>> => {
    const filePath = await fileDialog({ directory: false, title: 'Select File' })

    if (!filePath) return E.right(undefined)
    return E.right(await pathDataFromRaw(filePath))
  },
  pickFolder: async (): Promise<Errorable<string | undefined>> => {
    const path = await fileDialog({ directory: true, title: 'Select Folder' })

    return E.right(path ?? undefined)
  },
  getResourcesPath: () => {
    return path.resourceDir()
  },
  openDirectory: async (directory: string): Promise<Errorable<null>> => {
    open(directory)
    return E.right(null)
  },
  getPlatform: async () => platform(),
  getState: async () => TauriInvoker.getState(),
  getSettings: async () => {
    const promise = TauriInvoker.getStorageFileJSON('settings.json') as Promise<
      Errorable<Partial<Settings>>
    >

    return promise.then(
      E.match(
        (err) => E.left(err),
        (partialSettings) => E.right({ enabledSaveTypes: {}, ...partialSettings })
      )
    )
  },
  updateSettings: async (settings: Settings) => {
    return TauriInvoker.writeStorageFileJSON('settings.json', settings as JSONObject)
  },

  registerListeners: (listeners) => {
    const unlistenPromise = Promise.all([
      listen('save', listeners.onSave),
      listen('reset', listeners.onReset),
    ])

    return () =>
      unlistenPromise.then((unlistenFunctions) => {
        for (const unlistenFunction of unlistenFunctions) {
          unlistenFunction()
        }
      })
  },
}

// export const ElectronBackendContext = createContext(ElectronBackend);
