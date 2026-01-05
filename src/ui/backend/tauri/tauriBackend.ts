import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { PathData, PossibleSaves } from '@openhome-core/save/util/path'
import { SaveFolder } from '@openhome-core/save/util/storage'
import { Errorable, R, Result } from '@openhome-core/util/functional'
import { JSONObject, LoadSaveResponse, SaveRef } from '@openhome-core/util/types'
import BackendInterface, {
  BankOrBoxChange,
  StoredLookups,
} from '@openhome-ui/backend/backendInterface'
import { defaultSettings, Settings } from '@openhome-ui/state/appInfo'
import { Pokedex } from '@openhome-ui/util/pokedex'
import { path } from '@tauri-apps/api'
import { Event, listen, UnlistenFn } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { open as fileDialog, save } from '@tauri-apps/plugin-dialog'
import { FileInfo, readFile, stat } from '@tauri-apps/plugin-fs'
import { platform } from '@tauri-apps/plugin-os'
import dayjs from 'dayjs'
import { Commands } from './tauriInvoker'
import { isErr } from './types'

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
  loadLookups: Commands.get_lookups,
  updateLookups: Commands.update_lookups,

  /* pokedex */
  loadPokedex: Commands.get_pokedex,
  registerInPokedex: Commands.update_pokedex,

  // /* OHPKM management */
  loadHomeMonLookup: async function (): Promise<Errorable<Record<string, OHPKM>>> {
    return Commands.get_ohpkm_files().then(transformResult(buildOhpkmMap))
  },

  deleteHomeMons: async function (identifiers: string[]): Promise<Errorable<null>> {
    const monFilePaths = identifiers.map((identifier) => `mons/${identifier}.ohpkm`)
    const deletionResults = await Commands.delete_storage_files(monFilePaths)

    deletionResults.onOk((deletionResults) => {
      for (const [file, result] of Object.entries(deletionResults)) {
        if (isErr(result)) {
          console.error(`Could not delete ${file}: ${result.Err}`)
        }
      }
    })

    return deletionResults.map(() => null)
  },

  writeHomeMon: async (identifier: string, bytes: Uint8Array): Promise<Errorable<null>> => {
    const relativePath = await path.join('mons_v2', `${identifier}.ohpkm`)

    return Commands.write_storage_file_bytes(relativePath, bytes)
  },

  /* openhome boxes */
  loadHomeBanks: Commands.load_banks,
  writeHomeBanks: Commands.write_banks,

  /* game saves */
  loadSaveFile: async (pathData: PathData): Promise<Errorable<LoadSaveResponse>> => {
    const bytesResult = await Commands.get_file_bytes(pathData.raw)
    const timestampResult = await Commands.get_file_created(pathData.raw)

    return bytesResult.flatMap((bytes) =>
      timestampResult.map((unixTimestamp) => ({
        path: pathData,
        fileBytes: new Uint8Array(bytes),
        createdDate: new Date(unixTimestamp),
      }))
    )
  },
  writeSaveFile: Commands.write_file_bytes,
  saveLocalFile: async (bytes: Uint8Array, suggestedName: string) => {
    const defaultPath = await path.join(await path.downloadDir(), suggestedName)
    const filePath = await save({ defaultPath })
    return filePath ? Commands.write_file_bytes(filePath, bytes) : R.Ok(null)
  },

  // /* game save management */
  getRecentSaves: Commands.validate_recent_saves,
  addRecentSave: async (saveRef: SaveRef): Promise<Errorable<null>> =>
    (await Commands.get_storage_file_json('recent_saves.json')).asyncFlatMap((recentSaves) => {
      if (Array.isArray(recentSaves)) {
        return Promise.resolve(
          R.Err('recent_saves.json is malformed (expecting object, received array)')
        )
      }

      recentSaves[saveRef.filePath.raw] = { ...saveRef, lastOpened: dayjs().unix() * 1000 }
      return Commands.write_storage_file_json('recent_saves.json', recentSaves)
    }),
  removeRecentSave: async (filePath: string): Promise<Errorable<null>> =>
    (await Commands.get_storage_file_json('recent_saves.json')).asyncFlatMap((recentSaves) => {
      if (Array.isArray(recentSaves)) {
        return Promise.resolve(
          R.Err('recent_saves.json is malformed (expecting object, received array)')
        )
      }

      delete recentSaves[filePath]
      return Commands.write_storage_file_json('recent_saves.json', recentSaves)
    }),
  findSuggestedSaves: async (): Promise<Errorable<PossibleSaves>> =>
    (await Commands.get_storage_file_json('save-folders.json')).asyncFlatMap((saveFolders) => {
      if (!Array.isArray(saveFolders)) {
        return Promise.resolve(
          R.Err('save-folders.json is malformed (expecting object, received array)')
        )
      }
      return Commands.find_suggested_saves(
        (saveFolders as unknown as SaveFolder[]).map((folder) => folder.path)
      )
    }),
  getSaveFolders: async (): Promise<Errorable<SaveFolder[]>> =>
    (await Commands.get_storage_file_json('save-folders.json')).flatMap((saveFolders) => {
      if (!Array.isArray(saveFolders)) {
        return R.Err('save-folders.json is malformed (expecting object, received array)')
      }
      return R.Ok(saveFolders as unknown as SaveFolder[])
    }),
  removeSaveFolder: async (pathToRemove: string): Promise<Errorable<null>> =>
    (await Commands.get_storage_file_json('save-folders.json')).asyncFlatMap((fileContent) => {
      if (!Array.isArray(fileContent)) {
        return Promise.resolve(
          R.Err('save-folders.json is malformed (expecting object, received array)')
        )
      }
      const saveFolders = fileContent as unknown as SaveFolder[]
      return Commands.write_storage_file_json(
        'save-folders.json',
        saveFolders.filter((folder) => folder.path !== pathToRemove)
      )
    }),
  upsertSaveFolder: async (folderPath: string, label: string): Promise<Errorable<null>> =>
    (await Commands.get_storage_file_json('save-folders.json')).asyncFlatMap((fileContent) => {
      if (!Array.isArray(fileContent)) {
        return Promise.resolve(
          R.Err('save-folders.json is malformed (expecting object, received array)')
        )
      }
      const saveFolders = fileContent as unknown as SaveFolder[]
      return Commands.write_storage_file_json('save-folders.json', [
        ...saveFolders.filter((folder) => folder.path !== folderPath),
        { label, path: folderPath },
      ])
    }),

  /* bag */
  loadItemBag: async () => {
    return (await Commands.get_storage_file_json('item-bag.json')) as Errorable<
      Record<string, number>
    >
  },

  saveItemBag: async (items: Record<string, number>): Promise<Errorable<null>> => {
    return Commands.write_storage_file_json('item-bag.json', items)
  },

  /* transactions */
  startTransaction: Commands.start_transaction,
  commitTransaction: Commands.commit_transaction,
  rollbackTransaction: Commands.rollback_transaction,

  /* application */
  pickFile: async (): Promise<Errorable<PathData | undefined>> => {
    const filePath = await fileDialog({ directory: false, title: 'Select File' })
    if (!filePath) return R.Ok(undefined)
    return R.Ok(await pathDataFromRaw(filePath))
  },
  pickFolder: async (): Promise<Errorable<string | undefined>> => {
    const path = await fileDialog({ directory: true, title: 'Select Folder' })

    return R.Ok(path ?? undefined)
  },
  getResourcesPath: () => {
    return path.resourceDir()
  },
  getPluginPath: async (pluginId: string) => {
    const dir = await path.appDataDir()

    return `${dir}/plugins/${pluginId}`
  },
  openDirectory: Commands.open_directory,
  openFileLocation: Commands.open_file_location,
  getPlatform: platform,
  getState: Commands.get_state,
  getSettings: async () => {
    return (await Commands.get_storage_file_json('settings.json')).map((partialSettings) => ({
      ...defaultSettings,
      ...partialSettings,
    }))
  },
  updateSettings: async (settings: Settings) =>
    Commands.write_storage_file_json('settings.json', settings as unknown as JSONObject),
  setTheme: Commands.set_app_theme,
  emitMenuEvent: Commands.handle_windows_accellerator,

  getImageData: Commands.get_image_data,
  listInstalledPlugins: Commands.list_installed_plugins,
  downloadPlugin: Commands.download_plugin,
  loadPluginCode: Commands.load_plugin_code,
  deletePlugin: Commands.delete_plugin,

  registerListeners: (listeners) => {
    const unlistenPromises: Promise<UnlistenFn>[] = [
      listen('tauri://drag-drop', (e: OnDropEvent) => {
        const allFilesPromise: Promise<{
          filePath: string
          stat: FileInfo
          bytes: Uint8Array
        }>[] = e.payload.paths.map(async (filePath) => ({
          filePath,
          stat: await stat(filePath),
          bytes: await readFile(filePath),
        }))

        Promise.all(allFilesPromise).then(async (fileData) => {
          const filesWithData = fileData.map(
            ({ filePath, stat, bytes }) =>
              new File([bytes as Uint8Array<ArrayBuffer>], filePath, {
                lastModified: stat.mtime?.getUTCMilliseconds(),
              })
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
    if (listeners.onLookupsUpdate) {
      const listener = listeners.onLookupsUpdate

      unlistenPromises.push(
        listen<StoredLookups>('lookups_update', (event) => listener(event.payload))
      )
    }
    if (listeners.onPokedexUpdate) {
      const listener = listeners.onPokedexUpdate

      unlistenPromises.push(listen<Pokedex>('pokedex_update', (event) => listener(event.payload)))
    }
    if (listeners.onBankOrBoxChange) {
      const listener = listeners.onBankOrBoxChange

      unlistenPromises.push(
        listen<BankOrBoxChange>('bank_or_box_change', (event) => listener(event.payload))
      )
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
          try {
            unlistenFunction()
          } catch (e) {
            console.error(e)
          }
        }
      })
  },
}

function transformResult<T, E, U>(transformer: (value: T) => U) {
  return (result: Result<T, E>) => result.map(transformer)
}

function buildOhpkmMap(bytesByFilename: Record<string, number[]>) {
  return Object.fromEntries(
    Object.entries(bytesByFilename).map(([filename, bytes]) => [
      filename.slice(0, filename.length - 6),
      new OHPKM(new Uint8Array(bytes)),
    ])
  )
}
