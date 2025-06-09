import { path } from '@tauri-apps/api'
import { Event, listen, UnlistenFn } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { open as fileDialog, save } from '@tauri-apps/plugin-dialog'
import { readFile, stat } from '@tauri-apps/plugin-fs'
import { platform } from '@tauri-apps/plugin-os'
import { open } from '@tauri-apps/plugin-shell'
import dayjs from 'dayjs'
import * as E from 'fp-ts/lib/Either'
import BackendInterface from 'src/backend/backendInterface'
import { OHPKM } from 'src/types/pkm/OHPKM'
import { PathData, PossibleSaves } from 'src/types/SAVTypes/path'
import { SaveFolder, StoredBoxData } from 'src/types/storage'
import { Errorable, JSONObject, LoadSaveResponse, LookupMap, SaveRef } from 'src/types/types'
import { defaultSettings, Settings } from '../../state/appInfo'
import { TauriInvoker } from './tauriInvoker'

async function pathDataFromRaw(raw: string): Promise<PathData> {
  const filename = await path.basename(raw)
  const dir = await path.dirname(raw)
  const ext = '.' in path ? await path.extname(raw) : ''

  const pathData: PathData = {
    raw,
    name: filename,
    separator: path.sep(),
    dir,
    ext,
  }

  return pathData
}

type OnDropEvent = Event<{ position: { x: number; y: number }; paths: string[] }>

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
  loadHomeBoxes: async function (): Promise<Errorable<StoredBoxData[]>> {
    const result = await (TauriInvoker.getStorageFileJSON('box-data.json') as Promise<
      Errorable<StoredBoxData[]>
    >)

    if (E.isLeft(result)) return result

    let boxData = result.right

    if (boxData.length === 0) {
      for (let i = 0; i < 36; i++) {
        boxData.push({ index: i, monIdentifiersByIndex: {}, name: undefined })
      }
      TauriInvoker.writeStorageFileJSON('box-data.json', boxData)
    }

    return E.right(boxData)
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
  saveLocalFile: async (bytes: Uint8Array, suggestedName: string) => {
    const filePath = await save({
      defaultPath: await path.join(await path.downloadDir(), suggestedName),
    })

    if (!filePath) return E.right(null)

    return TauriInvoker.writeFileBytes(filePath, bytes)
  },

  // /* game save management */
  getRecentSaves: async (): Promise<Errorable<Record<string, SaveRef>>> => {
    return TauriInvoker.getRecentSaves()
  },
  addRecentSave: async (saveRef: SaveRef): Promise<Errorable<null>> => {
    const recentSavesResult = await (TauriInvoker.getStorageFileJSON(
      'recent_saves.json'
    ) as Promise<Errorable<Record<string, SaveRef>>>)

    if (E.isLeft(recentSavesResult)) {
      return recentSavesResult
    }

    const recentSaves = recentSavesResult.right

    recentSaves[saveRef.filePath.raw] = { ...saveRef, lastOpened: dayjs().unix() * 1000 }
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
  getPluginPath: async (pluginId: string) => {
    const dir = await path.appDataDir()

    return `${dir}/plugins/${pluginId}`
  },
  openDirectory: async (directory: string): Promise<Errorable<null>> => {
    open(directory)
    return E.right(null)
  },
  getPlatform: platform,
  getState: async () => TauriInvoker.getState(),
  getSettings: async () => {
    const promise = TauriInvoker.getStorageFileJSON('settings.json') as Promise<
      Errorable<Partial<Settings>>
    >

    return promise.then(
      E.match(
        (err) => E.left(err),
        (partialSettings) => E.right({ ...defaultSettings, ...partialSettings })
      )
    )
  },
  updateSettings: async (settings: Settings) => {
    return TauriInvoker.writeStorageFileJSON('settings.json', settings as JSONObject)
  },
  setTheme: (appTheme: 'light' | 'dark' | 'system'): Promise<Errorable<null>> =>
    TauriInvoker.setTheme(appTheme),
  emitMenuEvent: TauriInvoker.handleMenuAccelleratorWindows,

  getImageData: TauriInvoker.getImageData,
  listInstalledPlugins: TauriInvoker.listInstalledPlugins,
  downloadPlugin: TauriInvoker.downloadPlugin,
  loadPluginCode: TauriInvoker.loadPluginCode,
  deletePlugin: TauriInvoker.deletePlugin,

  registerListeners: (listeners) => {
    const unlistenPromises: Promise<UnlistenFn>[] = [
      listen('tauri://drag-drop', (e: OnDropEvent) => {
        const allFilesPromise = e.payload.paths.map(async (filePath) => ({
          filePath,
          stat: await stat(filePath),
          bytes: await readFile(filePath),
        }))

        Promise.all(allFilesPromise).then(async (fileData) => {
          const filesWithData = fileData.map(
            ({ filePath, stat, bytes }) =>
              new File([bytes], filePath, { lastModified: stat.mtime?.getUTCMilliseconds() })
          )
          // account for Windows pixel density variance
          const scaleFactor = platform() === 'windows' ? await getCurrentWindow().scaleFactor() : 1

          // account for macOS title bar
          const verticalOffset = platform() === 'macos' ? 28 : 0

          const dataTransfer = new DataTransfer()

          for (const file of filesWithData) {
            dataTransfer.items.add(file)
          }

          document
            .elementFromPoint(
              e.payload.position.x / scaleFactor,
              e.payload.position.y / scaleFactor - verticalOffset
            )
            ?.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer }))
        })
      }),
    ]

    if (listeners.onSave) {
      unlistenPromises.push(listen('save', listeners.onSave))
    }
    if (listeners.onReset) {
      unlistenPromises.push(listen('reset', listeners.onReset))
    }
    if (listeners.onOpen) {
      unlistenPromises.push(listen('open', listeners.onOpen))
    }
    if (listeners.onPluginDownloadProgress) {
      const [pluginID, listener] = listeners.onPluginDownloadProgress

      unlistenPromises.push(
        listen<number>(`plugin:download-progress:${pluginID}`, (event) => listener(event.payload))
      )
    }
    const unlistenPromise = Promise.all(unlistenPromises)

    return () =>
      unlistenPromise.then((unlistenFunctions) => {
        for (const unlistenFunction of unlistenFunctions) {
          unlistenFunction()
        }
      })
  },
}
