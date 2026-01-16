import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { PathData, PossibleSaves } from '@openhome-core/save/util/path'
import { SaveFolder, StoredBankData } from '@openhome-core/save/util/storage'
import { Errorable } from '@openhome-core/util/functional'
import { LoadSaveResponse, LookupMap, SaveRef } from '@openhome-core/util/types'
import { AppTheme, Settings } from '@openhome-ui/state/appInfo'
import { PluginMetadataWithIcon } from '@openhome-ui/util/plugin'
import { Pokedex, PokedexUpdate } from '@openhome-ui/util/pokedex'

export type AppState = {
  open_transaction: boolean
  temp_files: string[]
  is_dev: boolean
  new_features_since_update: UpdateFeatures[]
}

export type UpdateFeatures = {
  version: string
  feature_messages: string[]
}

export type ImageResponse = {
  base64: string
  extension: string
}

export type PluginDownloadProgress = {
  pluginId: string
  progress: number
}

export type StoredLookups = { gen12: LookupMap; gen345: LookupMap }

export type OhpkmStore = Record<string, OHPKM>

export default interface BackendInterface {
  /* past gen identifier lookups */
  loadLookups: () => Promise<Errorable<StoredLookups>>
  addToLookups: (new_entries: StoredLookups) => Promise<Errorable<null>>

  /* ohpkm bytes store by identifier */
  loadOhpkmStore: () => Promise<Errorable<OhpkmStore>>
  addToOhpkmStore: (updates: OhpkmStore) => Promise<Errorable<null>>
  deleteHomeMons: (identifiers: string[]) => Promise<Errorable<null>>

  /* write synced state to disk during save */
  saveSyncedState: () => Promise<Errorable<void>>

  /* past gen identifier lookups */
  loadPokedex: () => Promise<Errorable<Pokedex>>
  registerInPokedex: (updates: PokedexUpdate[]) => Promise<Errorable<null>>

  /* openhome banks/boxes */
  loadHomeBanks: () => Promise<Errorable<StoredBankData>>
  writeHomeBanks: (bankData: StoredBankData) => Promise<Errorable<null>>

  /* game saves */
  loadSaveFile: (filePath: PathData) => Promise<Errorable<LoadSaveResponse>>
  writeSaveFile: (path: string, bytes: Uint8Array) => Promise<Errorable<null>>

  /* game save management */
  getRecentSaves: () => Promise<Errorable<Record<string, SaveRef>>>
  addRecentSave: (save: SaveRef) => Promise<Errorable<null>>
  removeRecentSave: (filePath: string) => Promise<Errorable<null>>
  findSuggestedSaves: () => Promise<Errorable<PossibleSaves>>
  getSaveFolders: () => Promise<Errorable<SaveFolder[]>>
  removeSaveFolder: (path: string) => Promise<Errorable<null>>
  upsertSaveFolder: (folderPath: string, label: string) => Promise<Errorable<null>>

  /* item bag */
  loadItemBag: () => Promise<Errorable<Record<string, number>>>
  saveItemBag: (items: Record<string, number>) => Promise<Errorable<null>>

  /* transactions */
  startTransaction: () => Promise<Errorable<null>>
  commitTransaction: () => Promise<Errorable<null>>
  rollbackTransaction: () => Promise<Errorable<null>>

  /* application */
  pickFile: () => Promise<Errorable<PathData | undefined>>
  pickFolder: () => Promise<Errorable<string | undefined>>
  getResourcesPath: () => Promise<string>
  openDirectory: (directory: string) => Promise<Errorable<null>>
  openFileLocation: (filePath: string) => Promise<Errorable<null>>
  getPlatform: () => string
  registerListeners: (listeners: Partial<BackendListeners>) => () => void
  getState: () => Promise<Errorable<AppState>>
  getSettings: () => Promise<Errorable<Settings>>
  updateSettings: (settings: Settings) => Promise<Errorable<null>>
  setTheme(appTheme: AppTheme): Promise<Errorable<null>>
  saveLocalFile: (bytes: Uint8Array, suggestedName: string) => Promise<Errorable<null>>
  emitMenuEvent: (menuEventId: string) => Promise<Errorable<null>>

  /* plugins */
  getImageData: (absolutePath: string) => Promise<Errorable<ImageResponse>>
  listInstalledPlugins: () => Promise<Errorable<PluginMetadataWithIcon[]>>
  getPluginPath: (pluginId: string) => Promise<string>
  downloadPlugin(remoteUrl: string): Promise<Errorable<string>>
  loadPluginCode(pluginId: string): Promise<Errorable<string>>
  deletePlugin(pluginId: string): Promise<Errorable<string>>
}

export type BankOrBoxChange = { bank: number; box: number }

export interface BackendListeners {
  onSave: () => void
  onReset: () => void
  onOpen: () => void
  onLookupsUpdate: (updated_lookups: StoredLookups) => void
  onStateUpdate: Record<string, <State>(updated_state: State) => void>
  onPokedexUpdate: (updated_pokedex: Pokedex) => void
  onPluginDownloadProgress: [string, (_progress_pct: number) => void]
  onBankOrBoxChange: (change: BankOrBoxChange) => void
}
