import { OHPKM } from './pkm/OHPKM'
import { PathData, PossibleSaves } from './SAVTypes/path'
import { SaveFolder, StoredBoxData } from './storage'
import { Errorable, LoadSaveResponse, LookupMap, SaveRef } from './types'

export type AppState = {
  open_transaction: boolean
  temp_files: string[]
  is_dev: boolean
}

export default interface BackendInterface {
  /* past gen identifier lookups */
  loadGen12Lookup: () => Promise<Errorable<LookupMap>>
  loadGen345Lookup: () => Promise<Errorable<LookupMap>>
  writeGen12Lookup: (lookup: LookupMap) => Promise<Errorable<null>>
  writeGen345Lookup: (lookup: LookupMap) => Promise<Errorable<null>>

  /* OHPKM management */
  loadHomeMonLookup: () => Promise<Errorable<Record<string, OHPKM>>>
  writeHomeMon: (identifier: string, monBytes: Uint8Array) => Promise<Errorable<null>>
  deleteHomeMons: (identifiers: string[]) => Promise<Errorable<null>>

  /* openhome boxes */
  loadHomeBoxes: () => Promise<Errorable<StoredBoxData[]>>
  writeHomeBoxes: (boxData: StoredBoxData[]) => Promise<Errorable<null>>

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

  /* transactions */
  startTransaction: () => Promise<Errorable<null>>
  commitTransaction: () => Promise<Errorable<null>>
  rollbackTransaction: () => Promise<Errorable<null>>

  /* application */
  pickFile: () => Promise<Errorable<string | undefined>>
  pickFolder: () => Promise<Errorable<string | undefined>>
  getResourcesPath: () => Promise<string>
  openDirectory: (directory: string) => Promise<Errorable<null>>
  getPlatform: () => Promise<string>
  registerListeners: (listeners: BackendListeners) => () => void
  getState: () => Promise<Errorable<AppState>>
}

export interface BackendListeners {
  onSave: () => void
  onReset: () => void
}
