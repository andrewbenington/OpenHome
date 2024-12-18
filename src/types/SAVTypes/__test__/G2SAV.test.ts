import assert from 'assert'
import * as E from 'fp-ts/lib/Either'
import fs from 'fs'
import path from 'path'
import { PK2 } from 'pokemon-files'
import { bytesToPKM } from '../../FileImport'
import { OHPKM } from '../../pkm/OHPKM'
import { G2SAV } from '../G2SAV'
import { buildSaveFile } from '../load'
import { emptyPathData } from '../path'

const result = buildSaveFile(
  emptyPathData,
  new Uint8Array(fs.readFileSync(path.join(__dirname, './SAVFiles', 'crystal.sav'))),
  {},
  [G2SAV]
)

assert(E.isRight(result))

const crystalSaveFile = result.right as G2SAV

const slowpokeOH = bytesToPKM(
  new Uint8Array(fs.readFileSync(path.join(__dirname, './PKMFiles/OH', 'slowpoke-shiny.ohpkm'))),
  'OHPKM'
) as OHPKM

test('pc box decoded correctly', () => {
  expect(crystalSaveFile.boxes[9].pokemon[0]?.nickname).toEqual('AMPHAROS')
  expect(crystalSaveFile.boxes[9].pokemon[1]?.nickname).toEqual('BELLOSSOM')
  expect(crystalSaveFile.boxes[9].pokemon[18]?.nickname).toEqual('SLOWKING')
  expect(crystalSaveFile.boxes[9].pokemon[19]?.nickname).toEqual('MISDREAVUS')
})

test('removing mon shifts others in box', () => {
  const result1 = buildSaveFile(emptyPathData, new Uint8Array(crystalSaveFile.bytes), {}, [G2SAV])

  if (E.isLeft(result1)) {
    fail(result1.left)
  }

  const modifiedSaveFile1 = result1.right as G2SAV

  modifiedSaveFile1.boxes[9].pokemon[0] = undefined
  modifiedSaveFile1.updatedBoxSlots.push({ box: 9, index: 0 })
  modifiedSaveFile1.prepareBoxesAndGetModified()

  const result2 = buildSaveFile(emptyPathData, new Uint8Array(modifiedSaveFile1.bytes), {}, [G2SAV])

  if (E.isLeft(result2)) {
    fail(result2.left)
  }

  const modifiedSaveFile2 = result2.right as G2SAV

  expect(modifiedSaveFile2.boxes[9].pokemon[0]?.nickname).toEqual('BELLOSSOM')
  expect(modifiedSaveFile2.boxes[9].pokemon[18]?.nickname).toEqual('MISDREAVUS')
  expect(modifiedSaveFile2.boxes[9].pokemon[19]).toEqual(undefined)
})

test('inserting mon works', () => {
  const result1 = buildSaveFile(emptyPathData, new Uint8Array(crystalSaveFile.bytes), {}, [G2SAV])

  if (E.isLeft(result1)) {
    fail(result1.left)
  }

  const modifiedSaveFile1 = result1.right as G2SAV

  modifiedSaveFile1.boxes[13].pokemon[17] = new PK2(slowpokeOH)
  modifiedSaveFile1.updatedBoxSlots.push({ box: 13, index: 0 })
  modifiedSaveFile1.prepareBoxesAndGetModified()

  const result2 = buildSaveFile(emptyPathData, new Uint8Array(modifiedSaveFile1.bytes), {}, [G2SAV])

  if (E.isLeft(result2)) {
    fail(result2.left)
  }

  const modifiedSaveFile2 = result2.right as G2SAV

  expect(modifiedSaveFile2.boxes[13].pokemon[0]?.nickname).toEqual('UNOWN')
  expect(modifiedSaveFile2.boxes[13].pokemon[16]?.nickname).toEqual('WIGGLYTUFF')
  expect(modifiedSaveFile2.boxes[13].pokemon[17]?.nickname).toEqual('Slowpoke')
})
