import { OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { SAV, SaveWriter } from '@openhome-core/save/interfaces'
import { PathData, PossibleSaves } from '@openhome-core/save/util/path'
import { SaveFolder, StoredBankData } from '@openhome-core/save/util/storage'
import {
  ConvertStrategyEntries,
  Filter,
  PaginatedPage,
  PaginationCursor,
  PluginMetadata,
} from '@openhome-core/tauri/spectaCommands'
import { Option, Result } from '@openhome-core/util/functional'
import { NowOrLater } from '@openhome-core/util/promise'
import { LoadSaveResponse, LookupMap, SaveRef } from '@openhome-core/util/types'
import { LogFilter } from '@openhome-ui/pages/logs'
import { AppTheme, Settings } from '@openhome-ui/state/appInfo'
import { ConvertStrategies } from '@openhome-ui/state/convert-strategies'
import { OhpkmBatchLookupResults } from '@openhome-ui/state/ohpkm'
import { Pokedex, PokedexUpdate } from '@openhome-ui/util/pokedex'
import { Dayjs } from 'dayjs'

export type AppState = {
  is_dev: boolean
  new_features_since_update: UpdateFeatures[]
  transaction: TransactionState
}

type TransactionState = {
  open_transaction: boolean
  temp_files: string[]
}

type UpdateFeatures = {
  version: string
  feature_messages: string[]
}

export type ImageResponse = {
  base64: string
  extension: string
}

export type LogEntry = {
  timestamp: Dayjs
  level: string
  target?: string
  message: string
  event?: string
  fields?: Record<string, unknown>
  context?: Record<string, unknown>
  ohpkm_id?: OhpkmIdentifier
}

export type LogsResponse = {
  current: LogFilter
  next: LogFilter
  remaining_file_lines: LogEntry[]
}

export type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE'

export type StoredLookups = { gen12: LookupMap; gen345: LookupMap }

export type OhpkmStore = Record<string, OHPKM>

export type ItemBag = Record<string, number>

export default interface BackendInterface {
  /* past gen identifier lookups */
  loadLookups: () => Promise<Result<StoredLookups>>
  addToLookups: (new_entries: StoredLookups) => Promise<Result<null>>
  removeDangling: () => Promise<Result<null>>

  /* ohpkm bytes store by identifier */
  searchOhpkmStore(
    cursor: PaginationCursor,
    filters: Filter[]
  ): Promise<Result<PaginatedPage<OHPKM>>>
  getOhpkmIdsMatchingUnknownHandler(save: SAV): Promise<Result<OhpkmIdentifier[]>>
  lookupOhpkmById: (id: OhpkmIdentifier) => Promise<Result<Option<OHPKM>>>
  lookupOhpkmBatch: (ids: OhpkmIdentifier[]) => Promise<Result<OhpkmBatchLookupResults>>
  addToOhpkmStore: (updates: OhpkmStore) => Promise<Result<null>>
  deleteHomeMons: (identifiers: string[]) => Promise<Result<null>>
  getOhpkmCount: () => Promise<Result<number>>

  /* prompt user to select new data directory location, then restart using that location */
  promptChangeDataDir: () => Promise<Result<null>>
  /* prompt user to select new data directory location, copy all data there, and restart using that location */
  promptMoveDataDir: () => Promise<Result<null>>
  /* get the current data directory path */
  getDataDirPath: () => Promise<Result<string>>

  /* write synced state to disk during save */
  saveSyncedState: () => Promise<Result<null>>

  /* past gen identifier lookups */
  loadPokedex: () => Promise<Result<Pokedex>>
  registerInPokedex: (updates: PokedexUpdate[]) => Promise<Result<null>>
  syncPokedex: () => Promise<Result<null>>

  /* openhome banks/boxes */
  loadHomeBanks: () => Promise<Result<StoredBankData>>
  writeHomeBanks: (bankData: StoredBankData) => Promise<Result<null>>

  /* game saves */
  loadSaveFile: (filePath: PathData) => Promise<Result<LoadSaveResponse>>
  writeSaveFile: (path: string, bytes: Uint8Array) => Promise<Result<null>>
  writeAllSaveFiles: (saveWriters: SaveWriter[]) => Promise<Result<null>[]>

  /* game save management */
  getRecentSaves: () => Promise<Result<Record<string, SaveRef>>>
  addRecentSave: (save: SaveRef) => Promise<Result<null>>
  removeRecentSave: (filePath: string) => Promise<Result<null>>
  findSuggestedSaves: () => Promise<Result<PossibleSaves>>
  getSaveFolders: () => Promise<Result<SaveFolder[]>>
  removeSaveFolder: (path: string) => Promise<Result<null>>
  upsertSaveFolder: (folderPath: string, label: string) => Promise<Result<null>>

  /* item bag */
  loadItemBag: () => Promise<ItemBag>
  saveItemBag: (items: ItemBag) => Promise<Result<null>>

  /* transactions */
  startTransaction: () => Promise<Result<null>>
  commitTransaction: () => Promise<Result<null>>
  rollbackTransaction: () => Promise<Result<null>>

  /* application */
  pickFile: () => Promise<Result<PathData | undefined>>
  pickFolder: () => Promise<Result<string | undefined>>
  getResourcesPath: () => Promise<string>
  openDirectory: (directory: string) => Promise<Result<null>>
  openFileLocation: (filePath: string) => Promise<Result<null>>
  convertLocalImagePath: (absolutePath: string) => string
  getPlatform: () => string
  registerListeners: (listeners: Partial<BackendListeners>) => () => void
  onMenuEvent: (event: MenuEvent, listener: () => void) => () => void
  onMenuEvents: (
    eventsAndCallbacks: Partial<Record<MenuEvent, () => NowOrLater<unknown>>>
  ) => () => void
  getState: () => Promise<Result<AppState>>
  getSettings: () => Promise<Result<Settings>>
  updateSettings: (settings: Settings) => Promise<Result<null>>
  getConvertStrategies: () => Promise<Result<ConvertStrategies>>
  updateConvertStrategies: (strategies: ConvertStrategyEntries) => Promise<Result<null>>
  setTheme(appTheme: AppTheme): Promise<Result<null>>
  saveLocalFile: (bytes: Uint8Array, suggestedName: string) => Promise<Result<null>>
  emitMenuEvent: (menuEventId: string) => Promise<void>

  /* logging */
  getLogs(filter: LogFilter): Promise<Result<LogsResponse>>
  log(level: LogLevel, message: string, context?: Record<string, unknown>): Promise<Result<void>>
  clearLogsForRange(start: Dayjs, end: Dayjs): Promise<Result<null>>
  onNewLog: (callback: (notification: NewLogNotification) => void) => () => void

  /* plugins */
  listInstalledPlugins: () => Promise<Result<PluginMetadata[]>>
  getPluginPath: (pluginId: string) => Promise<Result<string>>
  downloadPlugin(remoteUrl: string): Promise<Result<string>>
  loadPluginCode(pluginId: string): Promise<Result<string>>
  deletePlugin(pluginId: string): Promise<Result<null>>
}

export type BankOrBoxChange = { bank: number; box: number }

export type MenuEvent = 'save' | 'reset' | 'open' | 'zoom_in' | 'zoom_out' | 'reset_zoom'

export type NewLogNotification = {
  level: LogLevel
  timestamp_unix: number
}

export interface BackendListeners {
  onMenuEvent: (event: MenuEvent) => void
  onLookupsUpdate: (updated_lookups: StoredLookups) => void
  onStateUpdate: Record<string, <State>(updated_state: State) => void>
  onPokedexUpdate: (updated_pokedex: Pokedex) => void
  onPluginDownloadProgress: [string, (_progress_pct: number) => void]
  onBankOrBoxChange: (change: BankOrBoxChange) => void
}
