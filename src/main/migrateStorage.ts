import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import { StoredBoxData } from '../types/storage'
import { SaveRefMap, SaveType } from '../types/types'
import { fileCanOpen, fileLastModified, updateStoredList, updateStoredObject } from './fileHandlers'

const SaveTypeStrings: { [key: string]: SaveType } = {
  RGBY_J: SaveType.RGBY_J,
  RBY_I: SaveType.RBY_I,
  GS_J: SaveType.GS_J,
  GS_I: SaveType.GS_I,
  C_J: SaveType.C_J,
  C_I: SaveType.C_I,
  RS: SaveType.RS,
  FRLG: SaveType.FRLG,
  E: SaveType.E,
  DP: SaveType.DP,
  Pt: SaveType.Pt,
  HGSS: SaveType.HGSS,
  G5: SaveType.G5,
  G6: SaveType.G6,
}

function boxDataFromCSV(oldBoxFolderPath: string) {
  const boxFiles = fs.readdirSync(oldBoxFolderPath)
  boxFiles.sort((a, b) => {
    if (a.startsWith('Box ') && parseInt(a.substring(4)) > 0) {
      if (b.startsWith('Box ') && parseInt(b.substring(4)) > 0) {
        return parseInt(a.substring(4)) - parseInt(b.substring(4))
      } else {
        return -1
      }
    } else {
      if (a.startsWith('Box ') && parseInt(b.substring(4)) > 0) {
        return 1
      } else {
        return a.localeCompare(b)
      }
    }
  })
  const allBoxes: StoredBoxData[] = []
  for (const [index, fileName] of boxFiles.entries()) {
    const boxName = fileName.replace('.csv', '')
    const storedBoxData: StoredBoxData = {
      name: boxName,
      index,
      monIdentifiersByIndex: {},
    }
    const boxFileString = fs.readFileSync(path.join(oldBoxFolderPath, fileName)).toString()
    boxFileString.split(/\r?\n/).forEach((entry) => {
      const [boxPosition, monRef] = entry.split(',')
      if (boxPosition && monRef) {
        storedBoxData.monIdentifiersByIndex[boxPosition] = monRef
      }
    })
    allBoxes.push(storedBoxData)
  }
  return allBoxes
}

function lookupFromCSV(path: string) {
  const lookupMap: { [key: string]: string } = {}
  const lookupFileString = fs.readFileSync(path).toString()
  lookupFileString.split(/\r?\n/).forEach((entry) => {
    const [lookupString, monRef] = entry.split(',')
    if (lookupString && monRef) {
      lookupMap[lookupString] = monRef
    }
  })
  return lookupMap
}

function recentSavesFromCSV(csvPath: string): SaveRefMap {
  const csvFileString = fs.readFileSync(csvPath).toString()
  const recentSaves: SaveRefMap = {}
  csvFileString.split(/\r?\n/).forEach((entry) => {
    // eslint-disable-next-line prefer-const
    let [filePathRaw, saveTypeString, game, trainerName, trainerID, lastOpened] = entry.split(',')
    filePathRaw = decodeURIComponent(filePathRaw)
    const filePath = { ...path.parse(filePathRaw), separator: path.sep, raw: filePathRaw }
    const saveType = SaveTypeStrings[saveTypeString]
    if (filePath && saveType) {
      recentSaves[filePathRaw] = {
        filePath,
        saveType,
        game,
        trainerName,
        trainerID,
        lastOpened: parseInt(lastOpened),
        valid: fileCanOpen(filePathRaw),
        lastModified: fileLastModified(filePathRaw),
      }
    }
  })
  return recentSaves
}

export function migrateRecentSavesCSV() {
  const appDataPath = app.getPath('appData')
  const savesPath = path.join(appDataPath, 'OpenHome', 'storage', 'saveFiles.csv')
  if (fileCanOpen(savesPath)) {
    const csvSaves = recentSavesFromCSV(savesPath)
    updateStoredObject('recent_saves.json', csvSaves)
    fs.rmSync(savesPath)
  }

  const lookupPath = path.join(appDataPath, 'OpenHome', 'storage', 'lookup')

  const gen12Path = path.join(lookupPath, 'gen12Lookup.csv')
  if (fileCanOpen(gen12Path)) {
    const csvLookup = lookupFromCSV(gen12Path)
    updateStoredObject<Record<string, string>>('gen12_lookup.json', csvLookup)
    fs.rmSync(gen12Path)
  }

  const gen345Path = path.join(lookupPath, 'gen345Lookup.csv')
  if (fileCanOpen(gen345Path)) {
    const csvLookup = lookupFromCSV(gen345Path)
    updateStoredObject<Record<string, string>>('gen345_lookup.json', csvLookup)
    fs.rmSync(gen345Path)
  }

  if (fileCanOpen(lookupPath)) {
    fs.rmSync(lookupPath, { recursive: true, force: true })
  }

  const oldBoxFolderPath = path.join(appDataPath, 'OpenHome', 'storage', 'boxes')
  if (fileCanOpen(oldBoxFolderPath)) {
    const boxData = boxDataFromCSV(oldBoxFolderPath)
    updateStoredList<StoredBoxData>('box-data.json', boxData)
    fs.rmSync(oldBoxFolderPath, { recursive: true, force: true })
  }
}

export function migrateAll() {
  migrateRecentSavesCSV()
}
