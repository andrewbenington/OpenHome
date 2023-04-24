/* eslint-disable jest/no-commented-out-tests */
import fs from 'fs';
import { TextDecoder } from 'node:util'; // (ESM style imports)
import path from 'path';
import { bytesToPKM } from 'util/FileImport';
import { getMonGen12Identifier } from 'util/Lookup';
import { OHPKM } from '../OHPKM';
import { PK2 } from '../PK2';

(global as any).TextDecoder = TextDecoder;

// test('gen 3 stat calculations', () => {
//   const file = path.join(__dirname, './PKMFiles/Gen3', 'blaziken.pkm');
//   const fileBytes = fs.readFileSync(file);
//   const bytes = new Uint8Array(fileBytes);
//   const mon = bytesToPKM(bytes, 'pkm');
//   expect(mon.stats).toStrictEqual({
//     hp: 282,
//     atk: 359,
//     def: 165,
//     spe: 208,
//     spa: 243,
//     spd: 154,
//   });
// });

const hoohGen2 = bytesToPKM(
  new Uint8Array(
    fs.readFileSync(path.join(__dirname, './PKMFiles/Gen2', 'hooh.pk2'))
  ),
  'PK2'
) as PK2;

// test('gen 3 EVs are updated', () => {
//   const emeraldPKM = new PK3(blazikenOH);
//   // mimicking ev reduction berries and ev gain
//   emeraldPKM.evs = {
//     atk: 252,
//     hp: 6,
//     spa: 0,
//     spe: 252,
//     def: 0,
//     spd: 0,
//   };
//   blazikenOH.updateData(emeraldPKM);
//   expect(blazikenOH.evs).toStrictEqual({
//     atk: 252,
//     hp: 6,
//     spa: 0,
//     spe: 252,
//     def: 0,
//     spd: 0,
//   });
// });

// test('gen 3 ribbons are updated', () => {
//   const emeraldPKM = new PK3(blazikenOH);
//   // gaining Gen 3 ribbons
//   emeraldPKM.ribbons = [
//     ...emeraldPKM.ribbons,
//     'Cool (Hoenn)',
//     'Cool Super',
//     'Cool Hyper',
//     'Cool Master (Hoenn)',
//     'Winning',
//   ];
//   blazikenOH.updateData(emeraldPKM);
//   expect(blazikenOH.ribbons).toContain('Cool Master (Hoenn)');
//   expect(blazikenOH.ribbons).toContain('Winning');
//   expect(blazikenOH.ribbons).toContain('Effort');
//   expect(blazikenOH.ribbons).toContain('Footprint');
// });

// test('gen 3 contest stats are updated', () => {
//   const emeraldPKM = new PK3(blazikenOH);
//   // gaining cool contest points
//   emeraldPKM.contest = {
//     cool: 30,
//     beauty: 255,
//     smart: 255,
//     tough: 255,
//     cute: 255,
//     sheen: 1,
//   };
//   blazikenOH.updateData(emeraldPKM);
//   expect(blazikenOH.contest).toStrictEqual({
//     cool: 30,
//     beauty: 255,
//     smart: 255,
//     tough: 255,
//     cute: 255,
//     sheen: 1,
//   });
// });

// test('gen 3 conversion to OHPKM and back is lossless', () => {
//   const ohPKM = new OHPKM(blazikenGen3);
//   // gaining cool contest points
//   const gen3PKM = new PK3(ohPKM)
//   expect(blazikenGen3.bytes).toEqual(gen3PKM.bytes)
// });

test('pk2 and ohpkm have the same gen12lookup key', () => {
  const ohPKM = new OHPKM(hoohGen2);
  expect(getMonGen12Identifier(ohPKM)).toEqual(getMonGen12Identifier(hoohGen2));
});

// test('gen 6+ nickname accuracy', () => {
//   const converted = new PK3(slowpokeGen7);
//   expect(converted.nickname).toBe(slowpokeGen7.nickname);
// });

// test('gen 6+ shiny accuracy', () => {
//   const converted = new PK3(slowpokeGen7);
//   if (!slowpokeGen7.personalityValue) {
//     fail('mon has no personality value');
//   }
//   expect(converted.isShiny).toBe(slowpokeGen7.isShiny);
// });

// test('gen 6+ nature accuracy', () => {
//   const converted = new PK3(slowpokeGen7);
//   expect(converted.nature).toBe(slowpokeGen7.nature);
// });
