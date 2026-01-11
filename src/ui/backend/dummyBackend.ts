import * as E from 'fp-ts/lib/Either'
import BackendInterface, { BackendListeners } from './backendInterface'

const DummyBackend: BackendInterface = {
  /* past gen identifier lookups */
  loadLookups: async () => E.left('no backend in use'),
  updateLookups: async () => E.left('no backend in use'),

  loadOhpkmStore: async () => E.left('no backend in use'),
  updateOhpkmStore: async () => E.left('no backend in use'),

  /* pokedex */
  loadPokedex: async () => E.left('no backend in use'),
  registerInPokedex: async () => E.left('no backend in use'),

  /* OHPKM management */
  loadHomeMonLookup: async () => E.left('no backend in use'),
  writeHomeMon: async () => E.left('no backend in use'),
  deleteHomeMons: async () => E.left('no backend in use'),

  /* openhome boxes */
  loadHomeBanks: async () => E.left('no backend in use'),
  writeHomeBanks: async () => E.left('no backend in use'),

  /* game saves */
  loadSaveFile: async () => E.left('no backend in use'),
  writeSaveFile: async () => E.left('no backend in use'),

  /* game save management */
  getRecentSaves: async () => E.left('no backend in use'),
  addRecentSave: async () => E.left('no backend in use'),
  removeRecentSave: async () => E.left('no backend in use'),
  findSuggestedSaves: async () => E.left('no backend in use'),
  getSaveFolders: async () => E.left('no backend in use'),
  removeSaveFolder: async () => E.left('no backend in use'),
  upsertSaveFolder: async () => E.left('no backend in use'),

  /* bag */
  loadItemBag: async () => E.left('no backend in use'),
  saveItemBag: async () => E.left('no backend in use'),

  /* transactions */
  startTransaction: async () => E.left('no backend in use'),
  commitTransaction: async () => E.left('no backend in use'),
  rollbackTransaction: async () => E.left('no backend in use'),

  /* application */
  pickFile: async () => E.left('no backend in use'),
  pickFolder: async () => E.left('no backend in use'),
  getResourcesPath: async () => '',
  openDirectory: async () => E.left('no backend in use'),
  openFileLocation: async () => E.left('no backend in use'),
  getPlatform: () => 'none',
  registerListeners: (_: Partial<BackendListeners>) => () => {},
  getState: async () => E.left('no backend in use'),
  getSettings: async () => E.left('no backend in use'),
  updateSettings: async () => E.left('no backend in use'),
  setTheme: async () => E.left('no backend in use'),
  saveLocalFile: async () => E.left('no backend in use'),
  emitMenuEvent: async () => null,

  /* plugins */
  getImageData: async () => E.left('no backend in use'),
  listInstalledPlugins: async () => E.left('no backend in use'),
  getPluginPath: async () => '',
  downloadPlugin: async () => E.left('no backend in use'),
  loadPluginCode: async () => E.left('no backend in use'),
  deletePlugin: async () => E.left('no backend in use'),
}

export default DummyBackend
