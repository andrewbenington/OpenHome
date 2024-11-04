import child_process from 'child_process'
import { app, dialog } from 'electron'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { getStoragePath } from './loadData'

export function initializeFolders() {
  const appDataPath = app.getPath('appData')
  if (!fs.existsSync(`${appDataPath}/OpenHome/storage/mons`)) {
    fs.mkdirSync(`${appDataPath}/OpenHome/storage/mons`, { recursive: true })
  }
  fs.opendir('../', (err, dir) => {
    if (err) console.error('Error:', err)
    else {
      // Print the pathname of the directory
      dir.closeSync()
    }
  })
}

export function fileCanOpen(filePath: string): boolean {
  try {
    fs.accessSync(filePath, fs.constants.F_OK)
    return true
  } catch (err) {
    return false
  }
}

export function fileLastModified(filePath: string): number | undefined {
  return fs.statSync(filePath, { throwIfNoEntry: false })?.mtimeMs
}

export async function selectFile() {
  // Open file picker
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
  })
  return result.filePaths
}

export async function selectDirectory() {
  // Open file picker
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  })
  return result.filePaths
}

export function getFileCreatedDate(path: string) {
  const { birthtime } = fs.statSync(path)
  return birthtime
}

export function readBytesFromFile(path: string) {
  const fileBytes = fs.readFileSync(path)
  return new Uint8Array(fileBytes)
}

// export function findSaveFilesInDataFolder(path: string) {
//   const files = fs.readdirSync(
//     path.join(os.homedir(), '.local', 'share', 'citra-emu', 'sdmc', 'Nintendo 3DS')
//   )
// }

export function loadStoredObject<T>(filename: string): T {
  const fullPath = path.join(getStoragePath(), filename)
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, '{}')
    return {} as T
  }
  const fileString = fs.readFileSync(path.join(getStoragePath(), filename)).toString()
  return JSON.parse(fileString) as T
}

export function updateStoredObject<T>(filename: string, val: T) {
  const fullPath = path.join(getStoragePath(), filename)
  fs.writeFileSync(fullPath, JSON.stringify(val, undefined, 2))
}

export function loadStoredList<T>(filename: string): T[] {
  const fullPath = path.join(getStoragePath(), filename)
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, '[]')
    return []
  }
  const fileString = fs.readFileSync(path.join(getStoragePath(), filename)).toString()
  return JSON.parse(fileString) as T[]
}

export function updateStoredList<T>(filename: string, val: T[]) {
  const fullPath = path.join(getStoragePath(), filename)
  fs.writeFileSync(fullPath, JSON.stringify(val, undefined, 2))
}

export function openDirectory(directory: string) {
  let command = ''
  switch (os.platform()) {
    case 'linux':
      command = 'xdg-open'
      break
    case 'darwin':
      command = 'open'
      break
    case 'win32':
      command = 'explorer'
      break
    default:
      return
  }

  console.log(`${command} ${directory}`)
  const process = child_process.exec(`${command} '${directory}'`)
  console.log(process)
  console.log(process.exitCode)
}
