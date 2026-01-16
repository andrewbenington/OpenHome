import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { PathData, PossibleSaves } from '@openhome-core/save/util/path'
import { SaveFolder, StoredBankData } from '@openhome-core/save/util/storage'
import { Errorable, R } from '@openhome-core/util/functional'
import { JSONObject, LoadSaveResponse, SaveRef } from '@openhome-core/util/types'
import BackendInterface, {
  BankOrBoxChange,
  OhpkmStore,
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
import { Commands, StoredBankDataSerialized } from './tauriInvoker'
import { isRustErr } from './types'

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
  addToLookups: Commands.add_to_lookups,

  /* ohpkm store */
  loadOhpkmStore: async function (): Promise<Errorable<OhpkmStore>> {
    return Commands.get_ohpkm_store().then(
      R.map((b64ByIdentifier) =>
        Object.fromEntries(
          Object.entries(b64ByIdentifier).map(([identifier, b64String]) => [
            identifier,
            new OHPKM(Uint8Array.fromBase64(b64String)),
          ])
        )
      )
    )
  },
  addToOhpkmStore: function (updates: OhpkmStore): Promise<Errorable<null>> {
    return Commands.add_to_ohpkm_store(
      Object.fromEntries(
        Object.entries(updates).map(([identifier, ohpkm]) => [identifier, ohpkm.toByteArray()])
      )
    )
  },
  deleteHomeMons: async function (identifiers: string[]): Promise<Errorable<null>> {
    const monFilePaths = identifiers.map((identifier) => `mons/${identifier}.ohpkm`)
    return Commands.delete_storage_files(monFilePaths).then(
      R.map((deletionResults) => {
        for (const [file, result] of Object.entries(deletionResults)) {
          if (isRustErr(result)) {
            console.error(`Could not delete ${file}: ${result.Err}`)
          }
        }
        return null
      })
    )
  },

  /* write synced state to disk during save */
  saveSyncedState: Commands.save_synced_state,

  /* pokedex */
  loadPokedex: Commands.get_pokedex,
  registerInPokedex: Commands.update_pokedex,

  /* openhome boxes */
  loadHomeBanks: () => Commands.load_banks().then(R.map(deserializeBankData)),
  writeHomeBanks: (bankData: StoredBankData) => Commands.write_banks(serializeBankData(bankData)),

  /* game saves */
  loadSaveFile: async (pathData: PathData): Promise<Errorable<LoadSaveResponse>> => {
    const bytesResult = await Commands.get_file_bytes(pathData.raw)
    if (R.isErr(bytesResult)) {
      return bytesResult
    }
    const timestampResult = await Commands.get_file_created(pathData.raw)
    if (R.isErr(timestampResult)) {
      return timestampResult
    }
    return R.Ok({
      path: pathData,
      fileBytes: new Uint8Array(bytesResult.value),
      createdDate: new Date(timestampResult.value),
    })
  },
  writeSaveFile: Commands.write_file_bytes,
  saveLocalFile: async (bytes: Uint8Array, suggestedName: string) => {
    const defaultPath = await path.join(await path.downloadDir(), suggestedName)
    const filePath = await save({ defaultPath })
    return filePath ? Commands.write_file_bytes(filePath, bytes) : R.Ok(null)
  },

  // /* game save management */
  getRecentSaves: Commands.validate_recent_saves,
  addRecentSave: (saveRef: SaveRef): Promise<Errorable<null>> =>
    Commands.get_storage_file_json('recent_saves.json').then(
      R.asyncFlatMap((recentSaves) => {
        if (Array.isArray(recentSaves)) {
          return Promise.resolve(
            R.Err('recent_saves.json is malformed (expecting object, received array)')
          )
        }

        recentSaves[saveRef.filePath.raw] = { ...saveRef, lastOpened: dayjs().unix() * 1000 }
        return Commands.write_storage_file_json('recent_saves.json', recentSaves)
      })
    ),
  removeRecentSave: (filePath: string): Promise<Errorable<null>> =>
    Commands.get_storage_file_json('recent_saves.json').then(
      R.asyncFlatMap((recentSaves) => {
        if (Array.isArray(recentSaves)) {
          return Promise.resolve(
            R.Err('recent_saves.json is malformed (expecting object, received array)')
          )
        }

        delete recentSaves[filePath]
        return Commands.write_storage_file_json('recent_saves.json', recentSaves)
      })
    ),
  findSuggestedSaves: async (): Promise<Errorable<PossibleSaves>> =>
    Commands.get_storage_file_json('save-folders.json').then(
      R.asyncFlatMap((saveFolders) => {
        if (!Array.isArray(saveFolders)) {
          return Promise.resolve(
            R.Err('save-folders.json is malformed (expecting object, received array)')
          )
        }
        return Commands.find_suggested_saves(
          (saveFolders as unknown as SaveFolder[]).map((folder) => folder.path)
        )
      })
    ),
  getSaveFolders: async (): Promise<Errorable<SaveFolder[]>> =>
    Commands.get_storage_file_json('save-folders.json').then(
      R.flatMap((saveFolders) => {
        if (!Array.isArray(saveFolders)) {
          return R.Err('save-folders.json is malformed (expecting object, received array)')
        }
        return R.Ok(saveFolders as unknown as SaveFolder[])
      })
    ),
  removeSaveFolder: async (pathToRemove: string): Promise<Errorable<null>> =>
    Commands.get_storage_file_json('save-folders.json').then(
      R.asyncFlatMap((fileContent) => {
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
      })
    ),
  upsertSaveFolder: (folderPath: string, label: string): Promise<Errorable<null>> =>
    Commands.get_storage_file_json('save-folders.json').then(
      R.asyncFlatMap((fileContent) => {
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
      })
    ),

  /* bag */
  loadItemBag: async () => {
    return (await Commands.get_storage_file_json('item-bag.json')) as Errorable<
      Record<string, number>
    >
  },

  saveItemBag: async (items: Record<string, number>) =>
    Commands.write_storage_file_json('item-bag.json', items),
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
  getResourcesPath: path.resourceDir,
  getPluginPath: async (pluginId: string) => `${await path.appDataDir()}/plugins/${pluginId}`,
  openDirectory: Commands.open_directory,
  openFileLocation: Commands.open_file_location,
  getPlatform: platform,
  getState: Commands.get_state,
  getSettings: async () =>
    Commands.get_storage_file_json('settings.json').then(
      R.map((partialSettings) => ({
        ...defaultSettings,
        ...partialSettings,
      }))
    ),
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
    if (listeners.onStateUpdate) {
      for (const [stateType, listener] of Object.entries(listeners.onStateUpdate)) {
        unlistenPromises.push(
          listen(`synced_state_update::${stateType}`, (event) => listener(event.payload), {})
        )
      }
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

function deserializeBankData(data: StoredBankDataSerialized): StoredBankData {
  return {
    ...data,
    banks: data.banks.map((bank) => ({
      ...bank,
      boxes: bank.boxes.map((box) => ({
        ...box,
        identifiers: new Map(
          Object.entries(box.identifiers).map(
            ([indexStr, identifier]) => [parseInt(indexStr), identifier] as const
          )
        ),
      })),
    })),
  }
}

function serializeBankData(data: StoredBankData): StoredBankDataSerialized {
  return {
    ...data,
    banks: data.banks.map((bank) => ({
      ...bank,
      boxes: bank.boxes.map((box) => ({
        ...box,
        identifiers: Object.fromEntries(box.identifiers.entries()),
      })),
    })),
  }
}
