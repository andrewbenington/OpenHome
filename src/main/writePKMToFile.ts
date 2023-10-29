import { app } from 'electron'
import fs from 'fs'
import { OHPKM } from '../types/PKMTypes/OHPKM'
import { bytesToPKM } from '../util/FileImport'
import { getMonFileIdentifier } from '../util/Lookup'

export default function writePKMToFile(bytes: Uint8Array) {
  try {
    const mon = bytesToPKM(bytes, 'OHPKM') as OHPKM
    const appDataPath = app.getPath('appData')
    const fileName = getMonFileIdentifier(mon)
    fs.writeFileSync(`${appDataPath}/OpenHome/storage/mons/${fileName}.ohpkm`, mon.bytes)
  } catch (e) {
    console.error('write ohpkm:', e)
  }
}

export function deleteOHPKMFile(fileName: string) {
  const appDataPath = app.getPath('appData')
  fs.unlinkSync(`${appDataPath}/OpenHome/storage/mons/${fileName}.ohpkm`)
}
