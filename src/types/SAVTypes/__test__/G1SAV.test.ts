import fs from 'fs'
// import { TextDecoder } from 'node:util' // (ESM style imports)
import path from 'path'
import { PK1 } from 'pokemon-files'
import { bytesToPKM } from '../../FileImport'
import { OHPKM } from '../../pkm/OHPKM'
import { G1SAV } from '../G1SAV'
import { buildSaveFile } from '../load'
import { emptyPathData } from '../path'
// ;(global as any).TextDecoder = TextDecoder

const blueSaveFile = buildSaveFile(
  emptyPathData,
  new Uint8Array(fs.readFileSync(path.join(__dirname, './SAVFiles', 'blue.sav'))),
  {},
  [G1SAV]
) as G1SAV

const slowpokeOH = bytesToPKM(
  new Uint8Array(fs.readFileSync(path.join(__dirname, './PKMFiles/OH', 'slowpoke-shiny.ohpkm'))),
  'OHPKM'
) as OHPKM

test('pc box decoded correctly', () => {
  expect(blueSaveFile.boxes[7].pokemon[0]?.nickname).toEqual('KABUTOPS')
  expect(blueSaveFile.boxes[7].pokemon[1]?.nickname).toEqual('AERODACTYL')
  expect(blueSaveFile.boxes[7].pokemon[9]?.nickname).toEqual('MEWTWO')
  expect(blueSaveFile.boxes[7].pokemon[10]?.nickname).toEqual('MEW')
})

test('removing mon shifts others in box', () => {
  const modifiedSaveFile1 = buildSaveFile(emptyPathData, new Uint8Array(blueSaveFile.bytes), {}, [
    G1SAV,
  ]) as G1SAV
  modifiedSaveFile1.boxes[7].pokemon[0] = undefined
  modifiedSaveFile1.updatedBoxSlots.push({ box: 7, index: 0 })
  modifiedSaveFile1.prepareBoxesAndGetModified()

  const modifiedSaveFile2 = buildSaveFile(
    emptyPathData,
    new Uint8Array(modifiedSaveFile1.bytes),
    {},
    [G1SAV]
  ) as G1SAV
  expect(modifiedSaveFile2.boxes[7].pokemon[0]?.nickname).toEqual('AERODACTYL')
  expect(modifiedSaveFile2.boxes[7].pokemon[9]?.nickname).toEqual('MEW')
  expect(modifiedSaveFile2.boxes[7].pokemon[10]).toEqual(undefined)
})

test('inserting mon works', () => {
  const modifiedSaveFile1 = buildSaveFile(emptyPathData, new Uint8Array(blueSaveFile.bytes), {}, [
    G1SAV,
  ]) as G1SAV
  modifiedSaveFile1.boxes[7].pokemon[11] = new PK1(slowpokeOH)
  modifiedSaveFile1.updatedBoxSlots.push({ box: 7, index: 0 })
  modifiedSaveFile1.prepareBoxesAndGetModified()

  const modifiedSaveFile2 = buildSaveFile(
    emptyPathData,
    new Uint8Array(modifiedSaveFile1.bytes),
    {},
    [G1SAV]
  ) as G1SAV
  expect(modifiedSaveFile2.boxes[7].pokemon[0]?.nickname).toEqual('KABUTOPS')
  expect(modifiedSaveFile2.boxes[7].pokemon[10]?.nickname).toEqual('MEW')
  expect(modifiedSaveFile2.boxes[7].pokemon[11]?.nickname).toEqual('Slowpoke')
})
