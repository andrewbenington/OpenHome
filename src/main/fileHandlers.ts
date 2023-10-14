import { dialog } from 'electron'
import fs from 'fs'
import _ from 'lodash'

export function initializeFolders(appDataPath: string) {
  if (!fs.existsSync(`${appDataPath}/OpenHome/storage/boxes`)) {
    fs.mkdirSync(`${appDataPath}/OpenHome/storage/boxes`, { recursive: true })
  }
  _.range(36).forEach((boxNum) => {
    if (
      !fs.existsSync(`${appDataPath}/OpenHome/storage/boxes/Box ${(boxNum + 1).toString()}.csv`)
    ) {
      fs.writeFileSync(
        `${appDataPath}/OpenHome/storage/boxes/Box ${(boxNum + 1).toString()}.csv`,
        ''
      )
    }
  })
  if (!fs.existsSync(`${appDataPath}/OpenHome/storage/mons`)) {
    fs.mkdirSync(`${appDataPath}/OpenHome/storage/mons`, { recursive: true })
  }
  if (!fs.existsSync(`${appDataPath}/OpenHome/storage/lookup`)) {
    fs.mkdirSync(`${appDataPath}/OpenHome/storage/lookup`, { recursive: true })
  }
  if (!fs.existsSync(`${appDataPath}/OpenHome/storage/lookup/gen12Lookup.csv`)) {
    fs.writeFileSync(`${appDataPath}/OpenHome/storage/lookup/gen12Lookup.csv`, '')
  }
  if (!fs.existsSync(`${appDataPath}/OpenHome/storage/lookup/gen345Lookup.csv`)) {
    fs.writeFileSync(`${appDataPath}/OpenHome/storage/lookup/gen345Lookup.csv`, '')
  }
  if (!fs.existsSync(`${appDataPath}/OpenHome/storage/saveFiles.csv`)) {
    fs.writeFileSync(`${appDataPath}/OpenHome/storage/saveFiles.csv`, '')
  }
  fs.opendir('../', (err, dir) => {
    if (err) console.error('Error:', err)
    else {
      // Print the pathname of the directory
      dir.closeSync()
    }
  })
}

export async function selectFile() {
  // Open file picker
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
  })
  return result.filePaths
}

export async function selectFiles() {
  // Open file picker
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
  })
  return result.filePaths
}

export function getFileCreatedDate(path: string) {
  const { birthtime } = fs.statSync(path)
  return birthtime
}

export function readBytesFromFile(path: string) {
  const fileBytes = fs.readFileSync(path)
  if (fileBytes) {
    return new Uint8Array(fileBytes)
  }
  return undefined
}

export function readStringFromFile(path: string) {
  try {
    return fs.readFileSync(path, { encoding: 'utf8' })
  } catch (e) {
    console.error(`error reading ${path}: ${e}`)
  }
  return ''
}

export function writeStringToFile(path: string, content: string) {
  return fs.writeFileSync(path, content)
}

export function writeBytesToPath(path: string, bytes: Uint8Array) {
  fs.writeFileSync(path, bytes)
}
