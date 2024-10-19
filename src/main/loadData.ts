import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import { StoredBoxData } from '../types/storage'
import {
  loadStoredList,
  loadStoredObject,
  readBytesFromFile,
  updateStoredList,
  updateStoredObject,
} from './fileHandlers'

export function getStoragePath(): string {
  return path.join(app.getPath('appData'), 'OpenHome', 'storage')
}

export function loadOHPKMs() {
  const monsPath = path.join(getStoragePath(), 'mons')
  const files = fs.readdirSync(monsPath)
  const monMap: { [key: string]: Uint8Array<ArrayBuffer> } = {}
  files.forEach((file) => {
    if (file.endsWith('.ohpkm')) {
      const bytes = readBytesFromFile(path.join(monsPath, file))
      if (bytes) {
        monMap[file.slice(0, file.length - 6)] = bytes
      }
    }
  })
  return monMap
}

export function loadBoxData() {
  return loadStoredList<StoredBoxData>('box-data.json')
}

export function writeBoxData(data: StoredBoxData[]) {
  return updateStoredList<StoredBoxData>('box-data.json', data)
}

export function loadGen12Lookup() {
  return loadStoredObject<Record<string, string>>('gen12_lookup.json')
}

export function registerGen12Lookup(lookupMap: Record<string, string>) {
  updateStoredObject<Record<string, string>>('gen12_lookup.json', lookupMap)
}

export function loadGen345Lookup() {
  return loadStoredObject<Record<string, string>>('gen345_lookup.json')
}

export function registerGen345Lookup(lookupMap: Record<string, string>) {
  updateStoredObject<Record<string, string>>('gen345_lookup.json', lookupMap)
}
