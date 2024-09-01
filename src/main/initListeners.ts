import { BrowserWindow, IpcMainInvokeEvent, app, ipcMain } from 'electron'
import fs from 'fs'
import { uniqBy } from 'lodash'
import os from 'os'
import path from 'path'
import { ParsedPath, PossibleSaves } from '../types/SAVTypes/path'
import { StoredBoxData } from '../types/storage'
import {
  getFileCreatedDate,
  initializeFolders,
  readBytesFromFile,
  recursivelyFindCitraSaves,
  recursivelyFindDeSamuMESaves,
  recursivelyFindGambatteSaves,
  recursivelyFindMGBASaves,
  selectDirectory,
  selectFile,
} from './fileHandlers'
import {
  loadBoxData,
  loadGen12Lookup,
  loadGen345Lookup,
  loadOHPKMs,
  registerGen12Lookup,
  registerGen345Lookup,
  writeBoxData,
} from './loadData'
import {
  addRecentSave,
  addSaveFileFolder,
  loadRecentSaves,
  loadSaveFileFolders,
  removeRecentSave,
  removeSaveFileFolder,
} from './saves'
import writePKMToFile, { deleteOHPKMFile } from './writePKMToFile'

function initListeners() {
  ipcMain.on('write-ohpkm', async (_, bytes: Uint8Array) => {
    writePKMToFile(bytes)
  })

  ipcMain.on('delete-ohpkm-files', async (_, fileNames: string[]) => {
    fileNames.forEach((fn) => deleteOHPKMFile(fn))
  })

  ipcMain.handle('read-gen12-lookup', async () => {
    let lookupMap
    try {
      lookupMap = loadGen12Lookup()
    } catch (e) {
      console.error('no gen12 lookup file')
    }
    return lookupMap
  })

  ipcMain.on('write-gen12-lookup', async (_, lookupMap) => {
    registerGen12Lookup(lookupMap)
  })

  ipcMain.handle('read-gen345-lookup', async () => {
    let lookupMap
    try {
      lookupMap = loadGen345Lookup()
    } catch (e) {
      console.error('no gen345 lookup file')
    }
    return lookupMap
  })

  ipcMain.on('write-gen345-lookup', async (_, lookupMap) => {
    registerGen345Lookup(lookupMap)
  })

  ipcMain.handle('read-recent-saves', async () => {
    let recentSaves
    try {
      recentSaves = loadRecentSaves()
    } catch (e) {
      console.error('no save refs file')
    }
    return recentSaves
  })

  ipcMain.on('add-recent-save', async (_, saveRef) => {
    addRecentSave(saveRef)
  })

  ipcMain.handle('remove-recent-save', async (_, saveRef) => {
    removeRecentSave(saveRef)
  })

  function parsedPathFromString(p: string): ParsedPath {
    return {
      ...path.parse(p),
      separator: path.sep,
      raw: p,
    }
  }

  ipcMain.handle('find-saves', async () => {
    const possibleSaves: PossibleSaves = { citra: [], desamume: [], openEmu: [] }
    const saveFolders = loadSaveFileFolders()
    if (
      fs.existsSync(path.join(os.homedir(), '.local', 'share', 'citra-emu', 'sdmc', 'Nintendo 3DS'))
    ) {
      possibleSaves.citra.push(
        ...recursivelyFindCitraSaves(
          path.join(os.homedir(), '.local', 'share', 'citra-emu', 'sdmc', 'Nintendo 3DS')
        ).map((p) => ({ ...path.parse(p), separator: path.sep, raw: p }))
      )
    }
    for (const folder of saveFolders) {
      possibleSaves.citra.push(...recursivelyFindCitraSaves(folder.path).map(parsedPathFromString))
      possibleSaves.openEmu.push(
        ...recursivelyFindMGBASaves(folder.path).map(parsedPathFromString),
        ...recursivelyFindDeSamuMESaves(folder.path).map(parsedPathFromString),
        ...recursivelyFindGambatteSaves(folder.path).map(parsedPathFromString)
      )
    }
    possibleSaves.citra = uniqBy(possibleSaves.citra, (parsedPath) => parsedPath.raw)
    possibleSaves.openEmu = uniqBy(possibleSaves.openEmu, (parsedPath) => parsedPath.raw)
    return possibleSaves
  })

  ipcMain.handle('read-home-mons', async () => {
    const appDataPath = app.getPath('appData')
    initializeFolders(appDataPath)
    return loadOHPKMs()
  })

  ipcMain.handle('read-home-boxes', async () => {
    return loadBoxData()
  })

  ipcMain.on('write-home-boxes', async (_, boxData: StoredBoxData[]) => {
    try {
      writeBoxData(boxData)
    } catch (e) {
      console.error('save home boxes error', e)
    }
  })

  ipcMain.handle('read-save-file', async (_, filePath?: ParsedPath[]) => {
    let filePaths = filePath?.map((fp) => fp.raw)
    if (!filePaths) {
      filePaths = await selectFile()
    }
    if (filePaths) {
      const fileBytes = readBytesFromFile(filePaths[0])
      const createdDate = getFileCreatedDate(filePaths[0])
      return {
        path: { ...path.parse(filePaths[0]), separator: path.sep, raw: filePath },
        fileBytes,
        createdDate,
      }
    }
    return {}
  })

  ipcMain.handle('write-save-file', async (_, { bytes, path }) => {
    fs.writeFileSync(path.raw, bytes)
  })

  ipcMain.handle('pick-save-folder', async () => {
    const dirPaths = await selectDirectory()

    return dirPaths.length ? dirPaths[0] : undefined
  })

  ipcMain.handle('read-save-folders', async () => {
    return loadSaveFileFolders()
  })
  ipcMain.handle('remove-save-folder', async (_, path) => {
    removeSaveFileFolder(path)
  })

  ipcMain.handle('upsert-save-folder', async (_, folderPath: string, label: string) => {
    addSaveFileFolder(folderPath, label)
  })
  ipcMain.handle('get-resources-path', () => {
    return app.isPackaged
      ? path.join(process.resourcesPath, 'resources')
      : path.join(`${app.getAppPath()}resources`)
  })

  ipcMain.handle('set-document-edited', (event: IpcMainInvokeEvent, edited: boolean) => {
    const window = BrowserWindow.getAllWindows().find(
      (win) => win.webContents.id === event.sender.id
    )
    window?.setDocumentEdited(edited)
  })
}

export default initListeners
