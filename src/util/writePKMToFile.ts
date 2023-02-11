import { app } from 'electron';
import fs from 'fs';
import { bytesToPKM } from './FileImport';
import OHPKM from '../pkm/OHPKM';

function bytesToString(value: number, numBytes: number) {
  return value.toString(16).padStart(numBytes * 2, '0');
}

export default function writePKMToFile(bytes: Uint8Array, format: string) {
  const originalMon = bytesToPKM(bytes, format)
  console.log(originalMon)
  const mon = new OHPKM(originalMon);
  console.log(mon.nickname)
  console.log(mon.bytes)
  const appDataPath = app.getPath('appData');
  const fileName = bytesToString(mon.trainerID, 2)
    .concat(bytesToString(mon.secretID, 2))
    .concat(bytesToString(mon.personalityValue, 4));
  fs.writeFileSync(
    `${appDataPath}/open-home/storage/boxes/box01/${fileName}.ohpkm`,
    mon.bytes
  );
}
