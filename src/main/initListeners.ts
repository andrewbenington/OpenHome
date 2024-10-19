import { BrowserWindow, IpcMainInvokeEvent, app, ipcMain } from 'electron'
import * as E from 'fp-ts/Either'
import fs from 'fs'
import path from 'path'
import BackendInterface from '../types/backendInterface'
import { bytesToPKM } from '../types/FileImport'
import { OHPKM } from '../types/pkm/OHPKM'
import { ParsedPath, PossibleSaves } from '../types/SAVTypes/path'
import { SaveFolder, StoredBoxData } from '../types/storage'
import { Errorable, LoadSaveResponse, LookupMap, SaveRef } from '../types/types'
import { getMonFileIdentifier } from '../util/Lookup'
import { getFileCreatedDate, readBytesFromFile, selectDirectory, selectFile } from './fileHandlers'
import {
  getStoragePath,
  loadBoxData,
  loadGen12Lookup,
  loadGen345Lookup,
  loadOHPKMs,
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

export function initListeners(backend: OpenHomeAppBackend) {
  ipcMain.handle('load-gen12-lookup', backend.loadGen12Lookup)
  ipcMain.handle('load-gen345-lookup', backend.loadGen345Lookup)
  ipcMain.handle('write-gen12-lookup', withEvent(bindToInstance(backend.writeGen12Lookup, backend)))
  ipcMain.handle(
    'write-gen345-lookup',
    withEvent(bindToInstance(backend.writeGen345Lookup, backend))
  )

  ipcMain.handle('load-home-mons', withEvent(bindToInstance(backend.loadHomeMonLookup, backend)))
  ipcMain.handle('write-home-mon', withEvent(bindToInstance(backend.writeHomeMon, backend)))
  ipcMain.handle('delete-home-mons', withEvent(bindToInstance(backend.deleteHomeMons, backend)))

  ipcMain.handle('load-home-boxes', bindToInstance(backend.loadHomeBoxes, backend))
  ipcMain.handle('write-home-boxes', withEvent(bindToInstance(backend.writeHomeBoxes, backend)))

  ipcMain.handle('load-save-file', withEvent(bindToInstance(backend.loadSaveFile, backend)))
  ipcMain.handle('write-save-file', withEvent(bindToInstance(backend.writeSaveFile, backend)))

  ipcMain.handle('get-recent-saves', bindToInstance(backend.getRecentSaves, backend))
  ipcMain.handle('add-recent-save', withEvent(bindToInstance(backend.addRecentSave, backend)))
  ipcMain.handle('remove-recent-save', withEvent(bindToInstance(backend.removeRecentSave, backend)))
  ipcMain.handle('find-suggested-saves', bindToInstance(backend.findSuggestedSaves, backend))

  ipcMain.handle('get-save-folders', bindToInstance(backend.getSaveFolders, backend))
  ipcMain.handle('remove-save-folder', withEvent(bindToInstance(backend.removeSaveFolder, backend)))
  ipcMain.handle('upsert-save-folder', withEvent(bindToInstance(backend.upsertSaveFolder, backend)))

  ipcMain.handle('get-resources-path', () => {})

  ipcMain.handle('start-transaction', bindToInstance(backend.startTransaction, backend))
  ipcMain.handle('commit-transaction', bindToInstance(backend.commitTransaction, backend))
  ipcMain.handle('rollback-transaction', bindToInstance(backend.rollbackTransaction, backend))

  ipcMain.handle('pick-folder', bindToInstance(backend.pickFolder, backend))
  ipcMain.handle('set-document-edited', withEvent(bindToInstance(backend.setHasChanges, backend)))
}

export class OpenHomeAppBackend implements BackendInterface {
  private openTransaction: boolean = false
  private tempFiles: string[] = []

  public async startTransaction() {
    this.openTransaction = true
    return E.right(null)
  }

  public async commitTransaction() {
    if (!this.openTransaction) {
      return E.left('No open transaction')
    }
    this.openTransaction = false
    const results = this.tempFiles.map((filename) => {
      try {
        fs.renameSync(filename, filename.substring(0, filename.length - 4))
        return E.right(null)
      } catch (e) {
        return E.left(`${filename}: ${e}`)
      }
    })
    const failedRenames = results.filter(E.isLeft)
    if (failedRenames.length) {
      return E.left(failedRenames.join('\n'))
    }
    return E.right(null)
  }

  public async rollbackTransaction() {
    this.openTransaction = false
    const results = this.tempFiles.map((filename) => {
      try {
        fs.unlinkSync(filename)
        return E.right(null)
      } catch (e) {
        return E.left(`${filename}: ${e}`)
      }
    })
    const failedDeletes = results.filter(E.isLeft)
    if (failedDeletes.length) {
      return E.left(failedDeletes.join('\n'))
    }
    return E.right(null)
  }

  public addTempFile(filename: string) {
    this.tempFiles.push(filename)
  }

  public async updateStoredObject<T>(filename: string, val: T): Promise<Errorable<null>> {
    const fullPath = path.join(getStoragePath(), filename)
    try {
      this.writeFile(fullPath, JSON.stringify(val, undefined, 2))
      return E.right(null)
    } catch (e) {
      return E.left(`${e}`)
    }
  }

  public async updateStoredList<T>(filename: string, val: T[]) {
    try {
      const fullPath = path.join(getStoragePath(), filename)
      this.writeFile(fullPath, JSON.stringify(val, undefined, 2))
      return E.right(null)
    } catch (e) {
      return E.left(`${e}`)
    }
  }

  public async writeFile(path: string, data: Uint8Array | string): Promise<Errorable<null>> {
    try {
      if (fs.existsSync(path)) {
        // Test if there is write access to the file
        fs.accessSync(path, fs.constants.W_OK)
      }
      fs.writeFileSync(path + (this.openTransaction ? '.tmp' : ''), data)
      if (this.openTransaction) {
        this.tempFiles.push(path + '.tmp')
      }
      return E.right(null)
    } catch (e) {
      return E.left(`${e}`)
    }
  }

  public async writeHomeMon(bytes: Uint8Array): Promise<Errorable<null>> {
    try {
      const mon = bytesToPKM(bytes, 'OHPKM') as OHPKM
      const appDataPath = app.getPath('appData')
      const fileName = getMonFileIdentifier(mon)
      return this.writeFile(`${appDataPath}/OpenHome/storage/mons/${fileName}.ohpkm`, mon.bytes)
    } catch (e) {
      return E.left(`${e}`)
    }
  }

  public async deleteHomeMons(identifiers: string[]): Promise<Errorable<null>> {
    try {
      identifiers.forEach((fileName) => {
        const appDataPath = app.getPath('appData')
        fs.unlinkSync(`${appDataPath}/OpenHome/storage/mons/${fileName}.ohpkm`)
      })
      return E.right(null)
    } catch (e) {
      return E.left(`${e}`)
    }
  }

  public async loadGen12Lookup() {
    try {
      return E.right(loadGen12Lookup())
    } catch (e) {
      return E.left(`${e}`)
    }
  }

  public async writeGen12Lookup(lookupMap: LookupMap): Promise<Errorable<null>> {
    return this.updateStoredObject('gen12_lookup.json', lookupMap)
  }

  public async loadGen345Lookup() {
    try {
      return E.right(loadGen345Lookup())
    } catch (e) {
      return E.left(`${e}`)
    }
  }

  public async writeGen345Lookup(lookupMap: LookupMap): Promise<Errorable<null>> {
    return this.updateStoredObject('gen345_lookup.json', lookupMap)
  }

  public async getRecentSaves(): Promise<Errorable<Record<string, SaveRef>>> {
    try {
      return E.right(recentSavesFromFile())
    } catch (e) {
      return E.left(`${e}`)
    }
  }

  public async addRecentSave(saveRef: SaveRef): Promise<Errorable<null>> {
    try {
      addRecentSaveToFile(saveRef)
      return E.right(null)
    } catch (e) {
      return E.left(`${e}`)
    }
  }

  public async removeRecentSave(filePath: string): Promise<Errorable<null>> {
    try {
      removeRecentSaveFromFile(filePath)
      return E.right(null)
    } catch (e) {
      return E.left(`${e}`)
    }
  }

  public async findSuggestedSaves(): Promise<Errorable<PossibleSaves>> {
    try {
      return E.right(await findPossibleSaves())
    } catch (e) {
      return E.left(`${e}`)
    }
  }

  public async loadHomeMonLookup(): Promise<Errorable<Record<string, Uint8Array<ArrayBuffer>>>> {
    try {
      return E.right(loadOHPKMs())
    } catch (e) {
      return E.left(`${e}`)
    }
  }

  public async loadHomeBoxes(): Promise<Errorable<StoredBoxData[]>> {
    try {
      return E.right(loadBoxData())
    } catch (e) {
      return E.left(`${e}`)
    }
  }

  public async writeHomeBoxes(boxData: StoredBoxData[]): Promise<Errorable<null>> {
    return this.updateStoredList<StoredBoxData>('box-data.json', boxData)
  }

  public async loadSaveFile(filePath?: ParsedPath): Promise<Errorable<LoadSaveResponse>> {
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

  public async writeSaveFile(path: string, bytes: Uint8Array): Promise<Errorable<null>> {
    return this.writeFile(path, bytes)
  }

  public async pickFolder(): Promise<Errorable<string | undefined>> {
    try {
      const dirs = await selectDirectory()
      return E.right(dirs.length ? dirs[0] : undefined)
    } catch (e) {
      return E.left(`${e}`)
    }
  }

  public async getSaveFolders(): Promise<Errorable<SaveFolder[]>> {
    try {
      return E.right(loadSaveFileFolders())
    } catch (e) {
      return E.left(`${e}`)
    }
  }

  public async removeSaveFolder(path: string): Promise<Errorable<null>> {
    try {
      removeSaveFileFolder(path)
      return E.right(null)
    } catch (e) {
      return E.left(`${e}`)
    }
  }

  public async upsertSaveFolder(folderPath: string, label: string): Promise<Errorable<null>> {
    try {
      addSaveFileFolder(folderPath, label)
      return E.right(null)
    } catch (e) {
      return E.left(`${e}`)
    }
  }

  public async setHasChanges(hasChanges: boolean): Promise<void> {
    const window = BrowserWindow.getAllWindows()[0]
    window?.setDocumentEdited(hasChanges)
  }

  public async getResourcesPath(): Promise<string> {
    return app.isPackaged
      ? path.join(process.resourcesPath, 'resources')
      : path.join(`${app.getAppPath()}resources`)
  }
}

function withEvent<T extends any[], R>(
  func: (...args: T) => R
): (_: IpcMainInvokeEvent, ...rest: T) => R {
  return (_: IpcMainInvokeEvent, ...rest: T) => {
    return func(...rest)
  }
}
type Method<T, A extends any[], R> = (this: T, ...args: A) => R

function bindToInstance<T, A extends any[], R>(
  method: Method<T, A, R>,
  instance: T
): (...args: A) => R {
  return (...args: A) => method.apply(instance, args)
}

export default OpenHomeAppBackend
