import { createContext } from 'react'
import BackendInterface from '../../types/backendInterface'
import { ParsedPath, PossibleSaves } from '../../types/SAVTypes/path'
import { SaveFolder, StoredBoxData } from '../../types/storage'
import { Errorable, LoadSaveResponse, LookupMap, SaveRef } from '../../types/types'

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
  writeHomeMon: (monBytes: Uint8Array): Promise<Errorable<null>> => {
    return window.electron.ipcRenderer.invoke('write-home-mon', monBytes)
  },

  /* openhome boxes */
  loadHomeBoxes: function (): Promise<Errorable<StoredBoxData[]>> {
    return window.electron.ipcRenderer.invoke('load-home-boxes')
  },
  writeHomeBoxes: (boxData: StoredBoxData[]): Promise<Errorable<null>> => {
    return window.electron.ipcRenderer.invoke('write-home-boxes', boxData)
  },

  /* game saves */
  loadSaveFile: (filePath?: ParsedPath): Promise<Errorable<LoadSaveResponse>> => {
    return window.electron.ipcRenderer.invoke('load-save-file', filePath)
  },
  writeSaveFile: (path: string, bytes: Uint8Array) => {
    return window.electron.ipcRenderer.invoke('write-save-file', path, bytes)
  },

  /* game save management */
  getRecentSaves: (): Promise<Errorable<Record<string, SaveRef>>> => {
    return window.electron.ipcRenderer.invoke('get-recent-saves')
  },
  addRecentSave: (saveRef: SaveRef): Promise<Errorable<null>> => {
    return window.electron.ipcRenderer.invoke('add-recent-save', saveRef)
  },
  removeRecentSave: (filePath: string): Promise<Errorable<null>> => {
    return window.electron.ipcRenderer.invoke('remove-recent-save', filePath)
  },
  findSuggestedSaves: (): Promise<Errorable<PossibleSaves>> => {
    return window.electron.ipcRenderer.invoke('find-suggested-saves')
  },
  getSaveFolders: (): Promise<Errorable<SaveFolder[]>> => {
    return window.electron.ipcRenderer.invoke('get-save-folders')
  },
  removeSaveFolder: (path: string): Promise<Errorable<null>> => {
    return window.electron.ipcRenderer.invoke('remove-save-folder', path)
  },
  upsertSaveFolder: (folderPath: string, label: string): Promise<Errorable<null>> => {
    return window.electron.ipcRenderer.invoke('upsert-save-folder', folderPath, label)
  },

  /* transactions */
  startTransaction: (): Promise<Errorable<null>> => {
    return window.electron.ipcRenderer.invoke('start-transaction')
  },
  commitTransaction: (): Promise<Errorable<null>> => {
    return window.electron.ipcRenderer.invoke('commit-transaction')
  },
  rollbackTransaction: (): Promise<Errorable<null>> => {
    return window.electron.ipcRenderer.invoke('rollback-transaction')
  },

  /* application */
  setHasChanges: (hasChanges: boolean): Promise<void> => {
    return window.electron.ipcRenderer.invoke('set-document-edited', hasChanges)
  },
  pickFolder: (): Promise<Errorable<string | undefined>> => {
    return window.electron.ipcRenderer.invoke('pick-folder')
  },
  getResourcesPath: () => window.electron.ipcRenderer.invoke('get-resources-path'),
  openDirectory: (directory: string): Promise<Errorable<null>> => {
    return window.electron.ipcRenderer.invoke('open-directory', directory)
  },
  getPlatform: () => window.electron.ipcRenderer.invoke('get-platform'),
}

export const ElectronBackendContext = createContext(ElectronBackend)
