import fs from 'fs';
import path from 'path';
import { bytesToPKM } from 'util/FileImport';
import { TextDecoder, TextEncoder } from 'node:util'; // (ESM style imports)
import { PK3 } from '../PK3';

(global as any).TextDecoder = TextDecoder;

test('gen 3 stat calculations', () => {
  const file = path.join(__dirname, './', 'blaziken-g3.pkm');
  const fileBytes = fs.readFileSync(file);
  const bytes = new Uint8Array(fileBytes);
  const mon = bytesToPKM(bytes, 'pkm');
  expect(mon.stats).toStrictEqual({
    hp: 282,
    atk: 359,
    def: 165,
    spe: 208,
    spa: 243,
    spd: 154,
  });
});

const slowpokeGen7 = bytesToPKM(
  new Uint8Array(
    fs.readFileSync(path.join(__dirname, './', 'slowpoke-shiny-g7.pk7'))
  ),
  'PK7'
);

test('gen 6+ nickname accuracy', () => {
  const converted = new PK3(slowpokeGen7);
  expect(converted.nickname).toBe(slowpokeGen7.nickname);
});

test('gen 6+ shiny accuracy', () => {
  const converted = new PK3(slowpokeGen7);
  if (!slowpokeGen7.personalityValue) {
    fail('mon has no personality value');
  }
  expect(converted.isShiny).toBe(slowpokeGen7.isShiny);
});

test('gen 6+ nature accuracy', () => {
  const converted = new PK3(slowpokeGen7);
  expect(converted.nature).toBe(slowpokeGen7.nature);
});
