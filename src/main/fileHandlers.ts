import { dialog } from 'electron'
import fs from 'fs'
import path from 'path'
import { getStoragePath } from './loadData'

export function initializeFolders(appDataPath: string) {
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
    console.log(`Can't open ${filePath}: ${err}`)
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

export async function selectFiles() {
  // Open file picker
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
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
  if (fileBytes) {
    return new Uint8Array(fileBytes)
  }
  return undefined
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
