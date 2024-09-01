import fs from 'fs'
import { uniqBy } from 'lodash'
import { SaveFolder } from '../types/storage'
import { SaveRef, SaveRefMap } from '../types/types'
import {
  loadStoredList,
  loadStoredObject,
  updateStoredList,
  updateStoredObject,
} from './fileHandlers'

// const SaveTypeStrings: { [key: string]: SaveType } = {
//   RGBY_J: SaveType.RGBY_J,
//   RBY_I: SaveType.RBY_I,
//   GS_J: SaveType.GS_J,
//   GS_I: SaveType.GS_I,
//   C_J: SaveType.C_J,
//   C_I: SaveType.C_I,
//   RS: SaveType.RS,
//   FRLG: SaveType.FRLG,
//   E: SaveType.E,
//   DP: SaveType.DP,
//   Pt: SaveType.Pt,
//   HGSS: SaveType.HGSS,
//   G5: SaveType.G5,
//   G6: SaveType.G6,
// }

const RECENT_SAVES_FILE = 'recent_saves.json'

function fileCanOpen(filePath: string): boolean {
  try {
    fs.accessSync(filePath, fs.constants.F_OK)
    return true
  } catch (err) {
    console.log(`Can't open ${filePath}: ${err}`)
    return false
  }
}

export function loadRecentSaves() {
  const recentSaves = loadStoredObject<SaveRefMap>(RECENT_SAVES_FILE)
  const uniqEntries = uniqBy(Object.entries(recentSaves), ([path]) => path)

  return Object.fromEntries(
    uniqEntries.map(([path, saveRef]) => [path, { ...saveRef, valid: fileCanOpen(path) }])
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
