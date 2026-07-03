import BackendInterface, {
  BankOrBoxChange,
  MenuEvent,
  NewLogNotification,
  OhpkmStore,
  parseLogs,
  StoredLookups,
} from '@openhome-core/backend/backendInterface'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { SaveWriter } from '@openhome-core/save/interfaces'
import { PathData, PossibleSaves } from '@openhome-core/save/util/path'
import { SaveFolder, SimpleOpenHomeBox, StoredBankData } from '@openhome-core/save/util/storage'
import { Errorable, R } from '@openhome-core/util/functional'
import { JSONObject, LoadSaveResponse, SaveRef } from '@openhome-core/util/types'
import { LogFilter } from '@openhome-ui/pages/logs'
import { defaultSettings, Settings } from '@openhome-ui/state/appInfo'
import { Pokedex } from '@openhome-ui/util/pokedex'
import { path } from '@tauri-apps/api'
import { Event, listen, UnlistenFn } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { open as fileDialog, save } from '@tauri-apps/plugin-dialog'
import { FileInfo, readFile, stat } from '@tauri-apps/plugin-fs'
import { platform } from '@tauri-apps/plugin-os'
import dayjs, { Dayjs } from 'dayjs'
import { Commands, LogFilterIpc, StoredBankDataSerialized } from './commandsOld'

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
  loadLookups: Commands.getLookups,
  addToLookups: Commands.addToLookups,

  /* ohpkm store */
  loadOhpkmStore: async function (): Promise<Errorable<OhpkmStore>> {
    return Commands.getOhpkmStore().then(
      R.map((b64ByIdentifier) =>
        Object.fromEntries(
          b64ByIdentifier.map(([identifier, b64String]) => [
            identifier,
            OHPKM.fromBytes(Uint8Array.fromBase64(b64String).buffer),
          ])
        )
      )
    )
  },
  removeDangling: Commands.removeDangling,
  addToOhpkmStore: function (updates: OhpkmStore): Promise<Errorable<null>> {
    return Commands.add_to_ohpkm_store(
      Object.fromEntries(
        Object.entries(updates).map(([identifier, ohpkm]) => [identifier, ohpkm.toByteArray()])
      )
    )
  },
  deleteHomeMons: async function (identifiers: string[]): Promise<Errorable<null>> {
    return Commands.permanentlyDeleteOhpkms(identifiers).then(
      R.map((deletionResults) => {
        for (const [file, error] of Object.entries(deletionResults)) {
          if (error) {
            console.error(`Could not delete ${file}: ${error}`)
          }
        }
        return null
      })
    )
  },

  /* prompt user to select new data directory location */
  promptChangeDataDir: Commands.changeDataDir,
  /* get the current data directory path */
  getDataDirPath: Commands.getDataDirPath,

  /* write synced state to disk during save */
  saveSyncedState: Commands.saveSyncedState,

  /* pokedex */
  loadPokedex: Commands.getPokedex,
  registerInPokedex: Commands.updatePokedex,

  /* openhome boxes */
  loadHomeBanks: () => Commands.loadBanks().then(R.map(deserializeBankData)),
  writeHomeBanks: (bankData: StoredBankData) => Commands.writeBanks(serializeBankData(bankData)),

  /* game saves */
  loadSaveFile: async (pathData: PathData): Promise<Errorable<LoadSaveResponse>> => {
    const bytesResult = await Commands.get_file_bytes(pathData.raw)
    if (R.isErr(bytesResult)) {
      return bytesResult
    }
    const timestampResult = await Commands.getFileCreated(pathData.raw)
    if (R.isErr(timestampResult)) {
      return timestampResult
    }
    return R.Ok({
      path: pathData,
      fileBytes: new Uint8Array(bytesResult.data),
      createdDate: timestampResult.data ? new Date(timestampResult.data) : undefined,
    })
  },
  writeSaveFile: async (path: string, bytes: Uint8Array) =>
    Commands.writeFileBytes(path, Array.from(bytes)),
  writeAllSaveFiles: async (saveWriters: SaveWriter[]) =>
    Promise.all(
      saveWriters.map((saveWriter) =>
        Commands.writeFileBytes(saveWriter.filepath, Array.from(saveWriter.bytes))
      )
    ),
  saveLocalFile: async (bytes: Uint8Array, suggestedName: string) => {
    const defaultPath = await path.join(await path.downloadDir(), suggestedName)
    const filePath = await save({ defaultPath })
    return filePath ? Commands.writeFileBytes(filePath, Array.from(bytes)) : R.Ok(null)
  },

  /* game save management */
  getRecentSaves: Commands.validateRecentSaves,
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
        return Commands.findSuggestedSaves(
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
  startTransaction: Commands.startTransaction,
  commitTransaction: Commands.commitTransaction,
  rollbackTransaction: Commands.rollbackTransaction,

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
  getPluginPath: async (pluginId: string) =>
    Commands.getDataDirPath().then(R.map((dataDirPath) => `${dataDirPath}/plugins/${pluginId}`)),
  openDirectory: Commands.openDirectory,
  openFileLocation: Commands.openFileLocation,
  getPlatform: platform,
  getState: Commands.getState,
  getSettings: async () =>
    Commands.get_storage_file_json('settings.json').then(
      R.map((partialSettings) => ({
        ...defaultSettings,
        ...partialSettings,
      }))
    ),
  updateSettings: async (settings: Settings) =>
    Commands.write_storage_file_json('settings.json', settings as unknown as JSONObject),
  getConvertStrategies: Commands.getConvertStrategies,
  updateConvertStrategies: Commands.updateConvertStrategies,
  setTheme: Commands.setAppTheme,
  emitMenuEvent: Commands.handleWindowsAccelerator,

  getImageData: Commands.getImageData,
  listInstalledPlugins: Commands.listInstalledPlugins,
  downloadPlugin: Commands.downloadPlugin,
  loadPluginCode: Commands.loadPluginCode,
  deletePlugin: Commands.deletePlugin,
  getLogs: (filter: LogFilter) => {
    const { start, end, ...otherParams } = filter
    const ipcFilter: LogFilterIpc = {
      start_epoch_seconds: start.unix(),
      end_epoch_seconds: end.unix(),
      ...otherParams,
    }
    return Commands.getLogsToday(ipcFilter).then(R.map(parseLogs))
  },
  log: Commands.log,
  clearLogsForRange: (start: Dayjs, end: Dayjs) => {
    return Commands.clearLogsForRange(start.unix(), end.unix())
  },

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
  onMenuEvent: (event: MenuEvent, callback: () => void) => {
    const unlistenPromise = listen(event, callback)

    return () => unlistenPromise.then((unlistenFunction) => unlistenFunction())
  },
  onMenuEvents: (eventsAndCallbacks: Partial<Record<MenuEvent, () => void>>) => {
    const unlistenPromises: Promise<UnlistenFn>[] = []
    for (const [event, callback] of Object.entries(eventsAndCallbacks)) {
      unlistenPromises.push(listen(event, callback))
    }

    return () =>
      Promise.all(unlistenPromises).then((unlistenFunctions) => {
        for (const unlistenFunction of unlistenFunctions) {
          try {
            unlistenFunction()
          } catch (e) {
            console.error(e)
          }
        }
      })
  },
  onNewLog: (callback: (notification: NewLogNotification) => void) => {
    const unlistenPromise = listen('tracing::log', (event) =>
      callback(event.payload as NewLogNotification)
    )

    return () => unlistenPromise.then((unlistenFunction) => unlistenFunction())
  },
}

function deserializeBankData(data: StoredBankDataSerialized): StoredBankData {
  return {
    ...data,
    banks: data.banks.map((bank) => ({
      ...bank,
      boxes: new Map(
        bank.boxes.map((box) => {
          const simpleBox: SimpleOpenHomeBox = {
            ...box,
            identifiers: new Map(
              Object.entries(box.identifiers).map(
                ([indexStr, identifier]) => [parseInt(indexStr), identifier] as const
              )
            ),
          }
          return [box.index, simpleBox] as const
        })
      ),
    })),
  }
}

function serializeBankData(data: StoredBankData): StoredBankDataSerialized {
  return {
    ...data,
    banks: data.banks.map((bank) => ({
      ...bank,
      boxes: Array.from(bank.boxes.values()).map((box) => ({
        ...box,
        identifiers: Object.fromEntries(box.identifiers.entries()),
      })),
    })),
  }
}
