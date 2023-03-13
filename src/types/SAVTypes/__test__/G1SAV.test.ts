import fs from 'fs';
import { TextDecoder } from 'node:util'; // (ESM style imports)
import path from 'path';
import { SaveType } from '../../types';
import { bytesToPKM } from '../../../util/FileImport';
import G1SAV from '../G1SAV';
import { buildSaveFile } from '../util';
import { PK1 } from '../../PKMTypes';

(global as any).TextDecoder = TextDecoder;

const blueSaveFile = buildSaveFile(
  '',
  new Uint8Array(
    fs.readFileSync(path.join(__dirname, './SAVFiles', 'blue.sav'))
  ),
  SaveType.RBY_I,
  {}
) as G1SAV;

const slowpokeOH = bytesToPKM(
  new Uint8Array(
    fs.readFileSync(
      path.join(__dirname, './PKMFiles/OH', 'slowpoke-shiny.ohpkm')
    )
  ),
  'OHPKM'
);

test('pc box decoded correctly', () => {
  expect(blueSaveFile.boxes[7].pokemon[0]?.nickname).toEqual('KABUTOPS');
  expect(blueSaveFile.boxes[7].pokemon[1]?.nickname).toEqual('AERODACTYL');
  expect(blueSaveFile.boxes[7].pokemon[9]?.nickname).toEqual('MEWTWO');
  expect(blueSaveFile.boxes[7].pokemon[10]?.nickname).toEqual('MEW');
});

test('removing mon shifts others in box', () => {
  const modifiedSaveFile1 = buildSaveFile(
    '',
    new Uint8Array(blueSaveFile.bytes),
    SaveType.RBY_I,
    {}
  ) as G1SAV;
  modifiedSaveFile1.boxes[7].pokemon[0] = undefined;
  modifiedSaveFile1.changedMons.push({ box: 7, index: 0 });
  modifiedSaveFile1.prepareBoxesForSaving();

  const modifiedSaveFile2 = buildSaveFile(
    '',
    new Uint8Array(modifiedSaveFile1.bytes),
    SaveType.RBY_I,
    {}
  ) as G1SAV;
  expect(modifiedSaveFile2.boxes[7].pokemon[0]?.nickname).toEqual('AERODACTYL');
  expect(modifiedSaveFile2.boxes[7].pokemon[9]?.nickname).toEqual('MEW');
  expect(modifiedSaveFile2.boxes[7].pokemon[10]).toEqual(undefined);
});

test('inserting mon works', () => {
  const modifiedSaveFile1 = buildSaveFile(
    '',
    new Uint8Array(blueSaveFile.bytes),
    SaveType.RBY_I,
    {}
  ) as G1SAV;
  modifiedSaveFile1.boxes[7].pokemon[11] = new PK1(slowpokeOH);
  modifiedSaveFile1.changedMons.push({ box: 7, index: 0 });
  modifiedSaveFile1.prepareBoxesForSaving();

  const modifiedSaveFile2 = buildSaveFile(
    '',
    new Uint8Array(modifiedSaveFile1.bytes),
    SaveType.RBY_I,
    {}
  ) as G1SAV;
  expect(modifiedSaveFile2.boxes[7].pokemon[0]?.nickname).toEqual('KABUTOPS');
  expect(modifiedSaveFile2.boxes[7].pokemon[10]?.nickname).toEqual('MEW');
  expect(modifiedSaveFile2.boxes[7].pokemon[11]?.nickname).toEqual('Slowpoke');
});

