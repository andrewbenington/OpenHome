import { R } from '../../core/util/functional'
import BackendInterface, { BackendListeners } from './backendInterface'

const DummyBackend: BackendInterface = {
  /* saving */
  saveSharedState: async () => R.Err('no backend in use'),

  /* past gen identifier lookups */
  loadLookups: async () => R.Err('no backend in use'),
  addToLookups: async () => R.Err('no backend in use'),

  /* ohpkm store */
  loadOhpkmStore: async () => R.Err('no backend in use'),
  addToOhpkmStore: async () => R.Err('no backend in use'),

  /* pokedex */
  loadPokedex: async () => R.Err('no backend in use'),
  registerInPokedex: async () => R.Err('no backend in use'),

  /* OHPKM management */
  loadHomeMonLookup: async () => R.Err('no backend in use'),
  writeHomeMon: async () => R.Err('no backend in use'),
  deleteHomeMons: async () => R.Err('no backend in use'),

  /* openhome boxes */
  loadHomeBanks: async () => R.Err('no backend in use'),
  writeHomeBanks: async () => R.Err('no backend in use'),

  /* game saves */
  loadSaveFile: async () => R.Err('no backend in use'),
  writeSaveFile: async () => R.Err('no backend in use'),

  /* game save management */
  getRecentSaves: async () => R.Err('no backend in use'),
  addRecentSave: async () => R.Err('no backend in use'),
  removeRecentSave: async () => R.Err('no backend in use'),
  findSuggestedSaves: async () => R.Err('no backend in use'),
  getSaveFolders: async () => R.Err('no backend in use'),
  removeSaveFolder: async () => R.Err('no backend in use'),
  upsertSaveFolder: async () => R.Err('no backend in use'),

  /* bag */
  loadItemBag: async () => R.Err('no backend in use'),
  saveItemBag: async () => R.Err('no backend in use'),

  /* transactions */
  startTransaction: async () => R.Err('no backend in use'),
  commitTransaction: async () => R.Err('no backend in use'),
  rollbackTransaction: async () => R.Err('no backend in use'),

  /* application */
  pickFile: async () => R.Err('no backend in use'),
  pickFolder: async () => R.Err('no backend in use'),
  getResourcesPath: async () => '',
  openDirectory: async () => R.Err('no backend in use'),
  openFileLocation: async () => R.Err('no backend in use'),
  getPlatform: () => 'none',
  registerListeners: (_: Partial<BackendListeners>) => () => {},
  getState: async () => R.Err('no backend in use'),
  getSettings: async () => R.Err('no backend in use'),
  updateSettings: async () => R.Err('no backend in use'),
  setTheme: async () => R.Err('no backend in use'),
  saveLocalFile: async () => R.Err('no backend in use'),
  emitMenuEvent: async () => R.Err('no backend in use'),

  /* plugins */
  getImageData: async () => R.Err('no backend in use'),
  listInstalledPlugins: async () => R.Err('no backend in use'),
  getPluginPath: async () => '',
  downloadPlugin: async () => R.Err('no backend in use'),
  loadPluginCode: async () => R.Err('no backend in use'),
  deletePlugin: async () => R.Err('no backend in use'),
}

export default DummyBackend
