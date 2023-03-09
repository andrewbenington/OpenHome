import fs from 'fs';
import path from 'path';
import { bytesToPKM } from 'util/FileImport';
import OHPKM from '../OHPKM';
import { TextDecoder } from 'node:util'; // (ESM style imports)

(global as any).TextDecoder = TextDecoder;

const blazikenOH = bytesToPKM(
  new Uint8Array(
    fs.readFileSync(path.join(__dirname, './PKMFiles/OH', 'blaziken.ohpkm'))
  ),
  'OHPKM'
) as OHPKM;

test('ohpkm conversion to OHPKM and back is lossless', () => {
  const ohPKM = new OHPKM(blazikenOH);
  // gaining cool contest points
  expect(blazikenOH.personalityValue).toEqual(ohPKM.personalityValue);
});
