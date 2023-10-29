import { BrowserWindow, IpcMainInvokeEvent, app, ipcMain } from 'electron'
import fs from 'fs'
import path from 'path'
import { StringToStringMap } from '../types/types'
import {
  getFileCreatedDate,
  initializeFolders,
  readBytesFromFile,
  selectFile,
} from './fileHandlers'
import {
  addRecentSave,
  loadGen12Lookup,
  loadGen345Lookup,
  loadOHPKMs,
  loadRecentSaves,
  registerGen12Lookup,
  registerGen345Lookup,
  removeRecentSave,
} from './loadData'
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

  ipcMain.handle('read-home-mons', async () => {
    const appDataPath = app.getPath('appData')
    initializeFolders(appDataPath)
    return loadOHPKMs()
  })

  ipcMain.handle('read-home-boxes', async (_, boxName) => {
    const appDataPath = app.getPath('appData')
    const boxString = fs.readFileSync(
      path.join(appDataPath, 'OpenHome', 'storage', 'boxes', `${boxName}.csv`),
      {
        encoding: 'utf8',
      }
    )
    const boxesMap: StringToStringMap = {}
    boxesMap[`${boxName}`] = boxString
    return boxesMap
  })

  ipcMain.on('write-home-box', async (_, { boxName, boxString }) => {
    try {
      const appDataPath = app.getPath('appData')
      fs.writeFileSync(
        path.join(appDataPath, 'OpenHome', 'storage', 'boxes', `${boxName}.csv`),
        boxString
      )
    } catch (e) {
      console.error('save home error', e)
    }
  })

  ipcMain.handle('read-save-file', async (_, filePath) => {
    let filePaths = filePath
    if (!filePaths) {
      filePaths = await selectFile()
    }
    if (filePaths) {
      const fileBytes = readBytesFromFile(filePaths[0])
      const createdDate = getFileCreatedDate(filePaths[0])
      return {
        path: filePaths[0],
        fileBytes,
        createdDate,
      }
    }
    return {}
  })

  ipcMain.handle('write-save-file', async (_, { bytes, path }) => {
    fs.writeFileSync(path, bytes)
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
