import * as E from 'fp-ts/lib/Either'
import BackendInterface from './backendInterface'

const DummyBackend: BackendInterface = {
  /* past gen identifier lookups */
  loadGen12Lookup: async () => E.left('no backend in use'),
  loadGen345Lookup: async () => E.left('no backend in use'),
  writeGen12Lookup: async () => E.left('no backend in use'),
  writeGen345Lookup: async () => E.left('no backend in use'),

  /* OHPKM management */
  loadHomeMonLookup: async () => E.left('no backend in use'),
  writeHomeMon: async () => E.left('no backend in use'),
  deleteHomeMons: async () => E.left('no backend in use'),

  /* openhome boxes */
  loadHomeBoxes: async () => E.left('no backend in use'),
  writeHomeBoxes: async () => E.left('no backend in use'),

  /* game saves */
  loadSaveFile: async () => E.left('no backend in use'),
  writeSaveFile: async () => E.left('no backend in use'),

  /* application */
  setHasChanges: async () => {},
}

export default DummyBackend
