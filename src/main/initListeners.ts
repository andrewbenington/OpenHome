import { BrowserWindow, IpcMainInvokeEvent, app, ipcMain } from 'electron'
import * as E from 'fp-ts/Either'
import fs from 'fs'
import path from 'path'
import { ParsedPath, PossibleSaves } from '../types/SAVTypes/path'
import { SaveFolder, StoredBoxData } from '../types/storage'
import { Errorable, LoadSaveResponse, LookupMap, SaveRef } from '../types/types'
import { getFileCreatedDate, readBytesFromFile, selectDirectory, selectFile } from './fileHandlers'
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
  addRecentSaveToFile,
  addSaveFileFolder,
  findPossibleSaves,
  loadSaveFileFolders,
  recentSavesFromFile,
  removeRecentSaveFromFile,
  removeSaveFileFolder,
} from './saves'
import writePKMToFile, { deleteOHPKMFile } from './writePKMToFile'

async function writeHomeMon(_: IpcMainInvokeEvent, bytes: Uint8Array): Promise<Errorable<null>> {
  try {
    writePKMToFile(bytes)
    return E.right(null)
  } catch (e) {
    return E.left(`${e}`)
  }
}

async function deleteOHPKMFiles(
  _: IpcMainInvokeEvent,
  identifiers: string[]
): Promise<Errorable<null>> {
  try {
    identifiers.forEach((fn) => deleteOHPKMFile(fn))
    return E.right(null)
  } catch (e) {
    return E.left(`${e}`)
  }
}

async function readGen12Lookup() {
  try {
    return E.right(loadGen12Lookup())
  } catch (e) {
    return E.left(`${e}`)
  }
}

async function writeGen12Lookup(
  _: IpcMainInvokeEvent,
  lookupMap: LookupMap
): Promise<Errorable<null>> {
  try {
    registerGen12Lookup(lookupMap)
    return E.right(null)
  } catch (e) {
    return E.left(`${e}`)
  }
}

async function readGen345Lookup() {
  try {
    return E.right(loadGen345Lookup())
  } catch (e) {
    return E.left(`${e}`)
  }
}

async function writeGen345Lookup(
  _: IpcMainInvokeEvent,
  lookupMap: LookupMap
): Promise<Errorable<null>> {
  try {
    registerGen345Lookup(lookupMap)
    return E.right(null)
  } catch (e) {
    return E.left(`${e}`)
  }
}

async function loadRecentSaves(): Promise<Errorable<Record<string, SaveRef>>> {
  try {
    return E.right(recentSavesFromFile())
  } catch (e) {
    return E.left(`${e}`)
  }
}

async function addRecentSave(_: IpcMainInvokeEvent, saveRef: SaveRef): Promise<Errorable<null>> {
  try {
    addRecentSaveToFile(saveRef)
    return E.right(null)
  } catch (e) {
    return E.left(`${e}`)
  }
}

async function removeRecentSave(_: IpcMainInvokeEvent, filePath: string): Promise<Errorable<null>> {
  try {
    removeRecentSaveFromFile(filePath)
    return E.right(null)
  } catch (e) {
    return E.left(`${e}`)
  }
}

async function findSaves(): Promise<Errorable<PossibleSaves>> {
  try {
    return E.right(await findPossibleSaves())
  } catch (e) {
    return E.left(`${e}`)
  }
}

async function loadHomeMons(): Promise<Errorable<Record<string, Uint8Array>>> {
  try {
    return E.right(loadOHPKMs())
  } catch (e) {
    return E.left(`${e}`)
  }
}

async function loadHomeBoxes(): Promise<Errorable<StoredBoxData[]>> {
  try {
    return E.right(loadBoxData())
  } catch (e) {
    return E.left(`${e}`)
  }
}

async function writeHomeBoxes(
  _: IpcMainInvokeEvent,
  boxData: StoredBoxData[]
): Promise<Errorable<null>> {
  try {
    writeBoxData(boxData)
    return E.right(null)
  } catch (e) {
    return E.left(`Error saving: ${e}`)
  }
}

async function loadSaveFile(
  _: IpcMainInvokeEvent,
  filePath?: ParsedPath
): Promise<Errorable<LoadSaveResponse>> {
  try {
    const rawPath = filePath?.raw ?? (await selectFile())[0]
    const fileBytes = readBytesFromFile(rawPath)
    const createdDate = getFileCreatedDate(rawPath)
    const response: LoadSaveResponse = {
      path: { ...path.parse(rawPath), separator: path.sep, raw: rawPath },
      fileBytes,
      createdDate,
    }
    return E.right(response)
  } catch (e) {
    return E.left(`${e}`)
  }
}

async function writeSaveFile(
  _: IpcMainInvokeEvent,
  { bytes, path }: { bytes: Uint8Array; path: string }
): Promise<Errorable<null>> {
  try {
    fs.writeFileSync(path, bytes)
    return E.right(null)
  } catch (e) {
    return E.left(`Error saving: ${e}`)
  }
}

async function pickFolder(): Promise<Errorable<string | undefined>> {
  try {
    const dirs = await selectDirectory()
    return E.right(dirs.length ? dirs[0] : undefined)
  } catch (e) {
    return E.left(`${e}`)
  }
}

async function getSaveFolders(): Promise<Errorable<SaveFolder[]>> {
  try {
    return E.right(loadSaveFileFolders())
  } catch (e) {
    return E.left(`${e}`)
  }
}

async function removeSaveFolder(_: IpcMainInvokeEvent, path: string): Promise<Errorable<null>> {
  try {
    removeSaveFileFolder(path)
    return E.right(null)
  } catch (e) {
    return E.left(`${e}`)
  }
}

async function upsertSaveFolder(
  _: IpcMainInvokeEvent,
  folderPath: string,
  label: string
): Promise<Errorable<null>> {
  try {
    addSaveFileFolder(folderPath, label)
    return E.right(null)
  } catch (e) {
    return E.left(`${e}`)
  }
}

function initListeners() {
  ipcMain.handle('load-gen12-lookup', readGen12Lookup)
  ipcMain.handle('load-gen345-lookup', readGen345Lookup)
  ipcMain.handle('write-gen12-lookup', writeGen12Lookup)
  ipcMain.handle('write-gen345-lookup', writeGen345Lookup)

  ipcMain.handle('load-home-mons', loadHomeMons)
  ipcMain.handle('write-home-mon', writeHomeMon)
  ipcMain.handle('delete-home-mons', deleteOHPKMFiles)

  ipcMain.handle('load-home-boxes', loadHomeBoxes)
  ipcMain.handle('write-home-boxes', writeHomeBoxes)

  ipcMain.handle('load-save-file', loadSaveFile)
  ipcMain.handle('write-save-file', writeSaveFile)

  ipcMain.handle('get-recent-saves', loadRecentSaves)
  ipcMain.handle('add-recent-save', addRecentSave)
  ipcMain.handle('remove-recent-save', removeRecentSave)
  ipcMain.handle('find-suggested-saves', findSaves)

  ipcMain.handle('get-save-folders', getSaveFolders)
  ipcMain.handle('remove-save-folder', removeSaveFolder)
  ipcMain.handle('upsert-save-folder', upsertSaveFolder)

  ipcMain.handle('get-resources-path', () => {
    return app.isPackaged
      ? path.join(process.resourcesPath, 'resources')
      : path.join(`${app.getAppPath()}resources`)
  })

  ipcMain.handle('pick-folder', pickFolder)
  ipcMain.handle('set-document-edited', (event: IpcMainInvokeEvent, edited: boolean) => {
    const window = BrowserWindow.getAllWindows().find(
      (win) => win.webContents.id === event.sender.id
    )
    window?.setDocumentEdited(edited)
  })
}

export default initListeners
