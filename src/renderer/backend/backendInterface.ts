import { ParsedPath, PossibleSaves } from '../../types/SAVTypes/path'
import { SaveFolder, StoredBoxData } from '../../types/storage'
import { Errorable, LoadSaveResponse, LookupMap, SaveRef } from '../../types/types'

export default interface BackendInterface {
  /* past gen identifier lookups */
  loadGen12Lookup: () => Promise<Errorable<LookupMap>>
  loadGen345Lookup: () => Promise<Errorable<LookupMap>>
  writeGen12Lookup: (lookup: LookupMap) => Promise<Errorable<null>>
  writeGen345Lookup: (lookup: LookupMap) => Promise<Errorable<null>>

  /* OHPKM management */
  loadHomeMonLookup: () => Promise<Errorable<Record<string, Uint8Array>>>
  writeHomeMon: (monBytes: Uint8Array) => Promise<Errorable<null>>
  deleteHomeMons: (identifiers: string[]) => Promise<Errorable<null>>

  /* openhome boxes */
  loadHomeBoxes: () => Promise<Errorable<StoredBoxData[]>>
  writeHomeBoxes: (boxData: StoredBoxData[]) => Promise<Errorable<null>>

  /* game saves */
  loadSaveFile: (filePath?: ParsedPath) => Promise<Errorable<LoadSaveResponse>>
  writeSaveFile: (path: string, bytes: Uint8Array) => Promise<Errorable<null>>

  /* game save management */
  getRecentSaves: () => Promise<Errorable<Record<string, SaveRef>>>
  addRecentSave: (save: SaveRef) => Promise<Errorable<null>>
  removeRecentSave: (filePath: string) => Promise<Errorable<null>>
  findSuggestedSaves: () => Promise<Errorable<PossibleSaves>>
  getSaveFolders: () => Promise<Errorable<SaveFolder[]>>
  removeSaveFolder: (path: string) => Promise<Errorable<null>>
  upsertSaveFolder: (folderPath: string, label: string) => Promise<Errorable<null>>

  /* application */
  setHasChanges: (hasChanges: boolean) => Promise<void>
  pickFolder: () => Promise<Errorable<string | undefined>>
  getResourcesPath: () => Promise<string>
}
