import { BrowserWindow, IpcMainInvokeEvent, app, ipcMain } from 'electron'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { ParsedPath, PossibleSaves } from '../types/SAVTypes/path'
import {
  getFileCreatedDate,
  initializeFolders,
  readBytesFromFile,
  recursivelyFindCitraSaves,
  recursivelyFindDeSamuMESaves,
  recursivelyFindMGBASaves,
  selectFile,
} from './fileHandlers'
import {
  addRecentSave,
  loadBoxNames,
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

  ipcMain.handle('find-saves', async () => {
    const possibleSaves: Partial<PossibleSaves> = {}
    if (
      fs.existsSync(path.join(os.homedir(), '.local', 'share', 'citra-emu', 'sdmc', 'Nintendo 3DS'))
    ) {
      possibleSaves.citra = recursivelyFindCitraSaves(
        path.join(os.homedir(), '.local', 'share', 'citra-emu', 'sdmc', 'Nintendo 3DS')
      ).map((p) => ({ ...path.parse(p), separator: path.sep, raw: p }))
    }
    if (fs.existsSync(path.join(app.getPath('appData'), 'OpenEmu'))) {
      possibleSaves.openEmu = recursivelyFindDeSamuMESaves(
        path.join(app.getPath('appData'), 'OpenEmu', 'DeSmuME')
      ).map((p) => ({ ...path.parse(p), separator: path.sep, raw: p }))
      possibleSaves.openEmu.push(
        ...recursivelyFindMGBASaves(path.join(app.getPath('appData'), 'OpenEmu', 'mGBA')).map(
          (p) => ({
            ...path.parse(p),
            separator: path.sep,
            raw: p,
          })
        )
      )
    }
    if (fs.existsSync(path.join(app.getPath('appData'), 'DeSmuME'))) {
      possibleSaves.desamume = recursivelyFindDeSamuMESaves(
        path.join(app.getPath('appData'), 'DeSmuME')
      ).map((p) => ({ ...path.parse(p), separator: path.sep, raw: p }))
    }
    return possibleSaves
  })

  ipcMain.handle('read-home-mons', async () => {
    const appDataPath = app.getPath('appData')
    initializeFolders(appDataPath)
    return loadOHPKMs()
  })

  ipcMain.handle('read-home-boxes', async () => {
    const appDataPath = app.getPath('appData')
    const boxFiles = fs.readdirSync(path.join(appDataPath, 'OpenHome', 'storage', 'boxes'))
    const boxNameList = loadBoxNames()
    const boxesMap = {}
    boxNameList.forEach((boxName, i) => {
      boxesMap[boxName] = {
        index: i,
        name: boxName,
      }
    })
    boxFiles.forEach((fileName) => {
      const boxString = fs.readFileSync(
        path.join(appDataPath, 'OpenHome', 'storage', 'boxes', fileName),
        {
          encoding: 'utf8',
        }
      )
      boxesMap[fileName.replace('.csv', '')].mons = boxString
    })
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
