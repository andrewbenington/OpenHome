import { uniqBy } from 'lodash'
import { SaveFolder } from '../types/storage'
import { SaveRef, SaveRefMap } from '../types/types'
import {
  fileCanOpen,
  fileLastModified,
  loadStoredList,
  loadStoredObject,
  updateStoredList,
  updateStoredObject,
} from './fileHandlers'

const RECENT_SAVES_FILE = 'recent_saves.json'

export function loadRecentSaves() {
  const recentSaves = loadStoredObject<SaveRefMap>(RECENT_SAVES_FILE)
  const uniqEntries = uniqBy(Object.entries(recentSaves), ([path]) => path)

  return Object.fromEntries(
    uniqEntries.map(([path, saveRef]) => [
      path,
      { ...saveRef, valid: fileCanOpen(path), lastModified: fileLastModified(path) },
    ])
  ) as SaveRefMap
}

function writeRecentSaves(recentSaves: SaveRefMap) {
  updateStoredObject(RECENT_SAVES_FILE, recentSaves)
}

export function addRecentSave(save: SaveRef) {
  const saveRefMap = loadRecentSaves()
  save.valid = fileCanOpen(save.filePath.raw)
  saveRefMap[save.filePath.raw] = save
  writeRecentSaves(saveRefMap)
}

export function removeRecentSave(filePath: string) {
  const saveRefMap = loadRecentSaves()
  delete saveRefMap[encodeURIComponent(filePath)]
  writeRecentSaves(saveRefMap)
}
export function loadSaveFileFolders() {
  return loadStoredList<SaveFolder>('save-folders.json')
}

export function addSaveFileFolder(folderPath: string, label?: string) {
  const saveFolders = loadSaveFileFolders().filter((folder) => folder.path != folderPath)
  saveFolders.push({ path: folderPath, label })
  updateStoredList('save-folders.json', saveFolders)
}

export function removeSaveFileFolder(folderPath: string) {
  const saveFolders = loadSaveFileFolders().filter((folder) => folder.path != folderPath)
  updateStoredList('save-folders.json', saveFolders)
}
