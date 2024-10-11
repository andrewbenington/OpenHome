import { app } from 'electron'
import fs from 'fs'
import { bytesToPKM } from '../types/FileImport'
import { OHPKM } from '../types/pkm/OHPKM'
import { getMonFileIdentifier } from '../util/Lookup'

export default function writePKMToFile(bytes: Uint8Array) {
  const mon = bytesToPKM(bytes, 'OHPKM') as OHPKM
  const appDataPath = app.getPath('appData')
  const fileName = getMonFileIdentifier(mon)
  fs.writeFileSync(`${appDataPath}/OpenHome/storage/mons/${fileName}.ohpkm`, mon.bytes)
}

export function deleteOHPKMFile(fileName: string) {
  const appDataPath = app.getPath('appData')
  fs.unlinkSync(`${appDataPath}/OpenHome/storage/mons/${fileName}.ohpkm`)
}
