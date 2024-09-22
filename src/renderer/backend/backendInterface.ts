import { OHPKM } from '../../types/pkm/OHPKM'
import { ParsedPath } from '../../types/SAVTypes/path'
import { StoredBoxData } from '../../types/storage'
import { Errorable, LoadSaveResponse, LookupMap } from '../../types/types'

export default interface BackendInterface {
  /* past gen identifier lookups */
  loadGen12Lookup: () => Promise<Errorable<LookupMap>>
  loadGen345Lookup: () => Promise<Errorable<LookupMap>>
  writeGen12Lookup: (lookup: LookupMap) => Promise<Errorable<null>>
  writeGen345Lookup: (lookup: LookupMap) => Promise<Errorable<null>>

  /* OHPKM management */
  loadHomeMonLookup: () => Promise<Errorable<Record<string, Uint8Array>>>
  writeHomeMon: (mon: OHPKM) => Promise<Errorable<null>>
  deleteHomeMons: (identifiers: string[]) => Promise<Errorable<null>>

  /* openhome boxes */
  loadHomeBoxes: () => Promise<Errorable<StoredBoxData[]>>
  writeHomeBoxes: (boxData: StoredBoxData) => Promise<Errorable<null>>

  /* game saves */
  loadSaveFile: (filePath?: ParsedPath) => Promise<Errorable<LoadSaveResponse>>
  writeSaveFile: (path: string, bytes: Uint8Array) => Promise<Errorable<null>>

  /* application */
  setHasChanges: (hasChanges: boolean) => Promise<void>
}
