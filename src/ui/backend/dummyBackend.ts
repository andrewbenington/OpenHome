import { R } from '@openhome-core/util/functional'
import BackendInterface from './backendInterface'

const ERROR_NO_BACKEND = async () => R.Err('no backend in use')
const EMPTY_WITH_CLEANUP = () => () => {}

const DummyBackend: BackendInterface = {
  /* write synced state to disk during save */
  saveSyncedState: ERROR_NO_BACKEND,

  /* past gen identifier lookups */
  loadLookups: ERROR_NO_BACKEND,
  addToLookups: ERROR_NO_BACKEND,
  removeDangling: ERROR_NO_BACKEND,

  /* ohpkm store */
  loadOhpkmStore: ERROR_NO_BACKEND,
  addToOhpkmStore: ERROR_NO_BACKEND,
  deleteHomeMons: ERROR_NO_BACKEND,

  /* pokedex */
  loadPokedex: ERROR_NO_BACKEND,
  registerInPokedex: ERROR_NO_BACKEND,

  /* openhome boxes */
  loadHomeBanks: ERROR_NO_BACKEND,
  writeHomeBanks: ERROR_NO_BACKEND,

  /* game saves */
  loadSaveFile: ERROR_NO_BACKEND,
  writeSaveFile: ERROR_NO_BACKEND,
  writeAllSaveFiles: async () => [R.Err('no backend in use')],

  /* game save management */
  getRecentSaves: ERROR_NO_BACKEND,
  addRecentSave: ERROR_NO_BACKEND,
  removeRecentSave: ERROR_NO_BACKEND,
  findSuggestedSaves: ERROR_NO_BACKEND,
  getSaveFolders: ERROR_NO_BACKEND,
  removeSaveFolder: ERROR_NO_BACKEND,
  upsertSaveFolder: ERROR_NO_BACKEND,

  /* bag */
  loadItemBag: ERROR_NO_BACKEND,
  saveItemBag: ERROR_NO_BACKEND,

  /* transactions */
  startTransaction: ERROR_NO_BACKEND,
  commitTransaction: ERROR_NO_BACKEND,
  rollbackTransaction: ERROR_NO_BACKEND,

  /* application */
  pickFile: ERROR_NO_BACKEND,
  pickFolder: ERROR_NO_BACKEND,
  getResourcesPath: async () => '',
  openDirectory: ERROR_NO_BACKEND,
  openFileLocation: ERROR_NO_BACKEND,
  getPlatform: () => 'none',
  registerListeners: EMPTY_WITH_CLEANUP,
  onMenuEvent: EMPTY_WITH_CLEANUP,
  onMenuEvents: EMPTY_WITH_CLEANUP,
  getState: ERROR_NO_BACKEND,
  getSettings: ERROR_NO_BACKEND,
  updateSettings: ERROR_NO_BACKEND,
  getConvertStrategies: ERROR_NO_BACKEND,
  updateConvertStrategies: ERROR_NO_BACKEND,
  setTheme: ERROR_NO_BACKEND,
  saveLocalFile: ERROR_NO_BACKEND,
  emitMenuEvent: ERROR_NO_BACKEND,

  /* logging */
  getLogs: ERROR_NO_BACKEND,
  log: ERROR_NO_BACKEND,
  onNewLog: EMPTY_WITH_CLEANUP,
  clearLogsForRange: ERROR_NO_BACKEND,

  /* data directory */
  promptChangeDataDir: ERROR_NO_BACKEND,
  getDataDirPath: ERROR_NO_BACKEND,

  /* plugins */
  getImageData: ERROR_NO_BACKEND,
  listInstalledPlugins: ERROR_NO_BACKEND,
  getPluginPath: ERROR_NO_BACKEND,
  downloadPlugin: ERROR_NO_BACKEND,
  loadPluginCode: ERROR_NO_BACKEND,
  deletePlugin: ERROR_NO_BACKEND,
}

export default DummyBackend
