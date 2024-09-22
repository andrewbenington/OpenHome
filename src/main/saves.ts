import fs from 'fs'
import { uniqBy } from 'lodash'
import os from 'os'
import path from 'path'
import { ParsedPath, PossibleSaves } from '../types/SAVTypes/path'
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

export function recentSavesFromFile() {
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

export function addRecentSaveToFile(save: SaveRef) {
  const saveRefMap = recentSavesFromFile()
  save.valid = fileCanOpen(save.filePath.raw)
  saveRefMap[save.filePath.raw] = save
  writeRecentSaves(saveRefMap)
}

export function removeRecentSaveFromFile(filePath: string) {
  const saveRefMap = recentSavesFromFile()
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

function parsedPathFromString(p: string): ParsedPath {
  return {
    ...path.parse(p),
    separator: path.sep,
    raw: p,
  }
}

export async function findPossibleSaves() {
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
}

export function recursivelyFindCitraSaves(currentPath: string) {
  const files = fs.readdirSync(currentPath)
  if (files.includes('data')) {
    if (fs.existsSync(path.join(currentPath, 'data', '00000001', 'main'))) {
      return [path.join(currentPath, 'data', '00000001', 'main')]
    }
    return []
  }
  const foundSaves: string[] = []
  files.forEach((file) => {
    const newPath = path.join(currentPath, file)
    if (fs.lstatSync(newPath).isDirectory()) {
      foundSaves.push(...recursivelyFindCitraSaves(path.join(currentPath, file)))
    }
  })
  return foundSaves
}

export function recursivelyFindOpenEmuSaves(currentPath: string) {
  const files = fs.readdirSync(currentPath)
  if (files.includes('data')) {
    if (fs.existsSync(path.join(currentPath, 'data', '00000001', 'main'))) {
      return [path.join(currentPath, 'data', '00000001', 'main')]
    }
    return []
  }
  const foundSaves: string[] = []
  files.forEach((file) => {
    const newPath = path.join(currentPath, file)
    if (fs.lstatSync(newPath).isDirectory()) {
      foundSaves.push(...recursivelyFindCitraSaves(path.join(currentPath, file)))
    }
  })
  return foundSaves
}

export function recursivelyFindDeSamuMESaves(currentPath: string): string[] {
  try {
    const files = fs.readdirSync(currentPath)
    if (files.includes('Battery Saves')) {
      return fs
        .readdirSync(path.join(currentPath, 'Battery Saves'))
        .filter((file) => file.endsWith('.dsv'))
        .map((file) => path.join(currentPath, 'Battery Saves', file))
    }
    if (files.includes('Battery')) {
      return fs
        .readdirSync(path.join(currentPath, 'Battery'))
        .filter((file) => file.endsWith('.dsv'))
        .map((file) => path.join(currentPath, 'Battery', file))
    }
    const foundSaves: string[] = []
    files.forEach((file) => {
      const newPath = path.join(currentPath, file)
      if (fs.lstatSync(newPath).isDirectory()) {
        foundSaves.push(...recursivelyFindDeSamuMESaves(path.join(currentPath, file)))
      }
    })
    return foundSaves
  } catch (e) {
    return []
  }
}

export function recursivelyFindGambatteSaves(currentPath: string) {
  try {
    const files = fs.readdirSync(currentPath)
    if (files.includes('Battery Saves')) {
      return fs
        .readdirSync(path.join(currentPath, 'Battery Saves'))
        .filter((file) => file.endsWith('.sav') || file.endsWith('.rtc'))
        .map((file) => path.join(currentPath, 'Battery Saves', file))
    }
    const foundSaves: string[] = []
    files.forEach((file) => {
      const newPath = path.join(currentPath, file)
      if (fs.lstatSync(newPath).isDirectory()) {
        foundSaves.push(...recursivelyFindGambatteSaves(path.join(currentPath, file)))
      }
    })
    return foundSaves
  } catch (e) {
    return []
  }
}

export function recursivelyFindMGBASaves(currentPath: string) {
  try {
    const files = fs.readdirSync(currentPath)
    if (files.includes('Battery Saves')) {
      return fs
        .readdirSync(path.join(currentPath, 'Battery Saves'))
        .filter((file) => file.endsWith('.sav'))
        .map((file) => path.join(currentPath, 'Battery Saves', file))
    }
    const foundSaves: string[] = []
    files.forEach((file) => {
      const newPath = path.join(currentPath, file)
      if (fs.lstatSync(newPath).isDirectory()) {
        foundSaves.push(...recursivelyFindMGBASaves(path.join(currentPath, file)))
      }
    })

    return foundSaves
  } catch (e) {
    return []
  }
}
