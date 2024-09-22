import { createContext } from 'react'
import { OHPKM } from '../../types/pkm/OHPKM'
import { ParsedPath } from '../../types/SAVTypes/path'
import { StoredBoxData } from '../../types/storage'
import { Errorable, LoadSaveResponse, LookupMap } from '../../types/types'
import BackendInterface from './backendInterface'

export const ElectronBackend: BackendInterface = {
  /* past gen identifier lookups */
  loadGen12Lookup: function (): Promise<Errorable<LookupMap>> {
    return window.electron.ipcRenderer.invoke('load-gen12-lookup')
  },
  loadGen345Lookup: function (): Promise<Errorable<LookupMap>> {
    return window.electron.ipcRenderer.invoke('load-gen345-lookup')
  },
  writeGen12Lookup: function (lookup: LookupMap): Promise<Errorable<null>> {
    return window.electron.ipcRenderer.invoke('write-gen12-lookup', lookup)
  },
  writeGen345Lookup: function (lookup: LookupMap): Promise<Errorable<null>> {
    return window.electron.ipcRenderer.invoke('write-gen345-lookup', lookup)
  },

  /* OHPKM management */
  loadHomeMonLookup: function (): Promise<Errorable<Record<string, Uint8Array>>> {
    return window.electron.ipcRenderer.invoke('load-home-mons')
  },
  deleteHomeMons: (identifiers: string[]): Promise<Errorable<null>> =>
    window.electron.ipcRenderer.invoke('delete-home-mons', identifiers),
  writeHomeMon: (mon: OHPKM): Promise<Errorable<null>> => {
    return window.electron.ipcRenderer.invoke('write-home-mon', mon)
  },

  /* openhome boxes */
  loadHomeBoxes: function (): Promise<Errorable<StoredBoxData[]>> {
    return window.electron.ipcRenderer.invoke('load-home-boxes')
  },
  writeHomeBoxes: (boxData: StoredBoxData): Promise<Errorable<null>> => {
    return window.electron.ipcRenderer.invoke('write-home-boxes', boxData)
  },

  /* game saves */
  loadSaveFile: (filePath?: ParsedPath): Promise<Errorable<LoadSaveResponse>> => {
    return window.electron.ipcRenderer.invoke('load-save-file', filePath)
  },
  writeSaveFile: (path: string, bytes: Uint8Array) => {
    return window.electron.ipcRenderer.invoke('write-save-file', { path, bytes })
  },

  /* application */
  setHasChanges: (hasChanges: boolean): Promise<void> => {
    return window.electron.ipcRenderer.invoke('set-document-edited', hasChanges)
  },
}

export const ElectronBackendContext = createContext(ElectronBackend)
