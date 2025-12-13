import { PK1 } from '@pokemon-files/pkm'
import assert, { fail } from 'assert'
import * as E from 'fp-ts/lib/Either'
import fs from 'fs'
import path from 'path'
import { bytesToPKM } from 'src/types/FileImport'
import { beforeAll, expect, test } from 'vitest'
import { OHPKM } from '../../pkm/OHPKM'
import { G1SAV } from '../G1SAV'
import { buildUnknownSaveFile } from '../util/load'
import { emptyPathData } from '../util/path'
import { initializeWasm } from './init'

let blueSaveFile: G1SAV
var slowbroOH: OHPKM

beforeAll(initializeWasm)
beforeAll(() => {
  const result = buildUnknownSaveFile(
    emptyPathData,
    new Uint8Array(fs.readFileSync(path.join(__dirname, 'SAVFiles', 'blue.sav'))),
    {},
    [G1SAV]
  )

  assert(E.isRight(result))

  blueSaveFile = result.right as G1SAV

  slowbroOH = bytesToPKM(
    new Uint8Array(
      fs.readFileSync(path.join('src/core/pkm/__test__/PKMFiles/OhpkmV2', 'slowbro.ohpkm'))
    ),
    'OhpkmV2'
  ) as OHPKM
})

test('pc box decoded correctly', () => {
  expect(blueSaveFile.boxes[7].pokemon[0]?.nickname).toEqual('KABUTOPS')
  expect(blueSaveFile.boxes[7].pokemon[1]?.nickname).toEqual('AERODACTYL')
  expect(blueSaveFile.boxes[7].pokemon[9]?.nickname).toEqual('MEWTWO')
  expect(blueSaveFile.boxes[7].pokemon[10]?.nickname).toEqual('MEW')
})

test('removing mon shifts others in box', () => {
  const result1 = buildUnknownSaveFile(emptyPathData, new Uint8Array(blueSaveFile.bytes), {}, [
    G1SAV,
  ])

  if (E.isLeft(result1)) {
    fail(result1.left)
  }

  const modifiedSaveFile1 = result1.right as G1SAV

  modifiedSaveFile1.boxes[7].pokemon[0] = undefined
  modifiedSaveFile1.updatedBoxSlots.push({ box: 7, index: 0 })
  modifiedSaveFile1.prepareBoxesAndGetModified()

  const result2 = buildUnknownSaveFile(emptyPathData, new Uint8Array(modifiedSaveFile1.bytes), {}, [
    G1SAV,
  ])

  if (E.isLeft(result2)) {
    fail(result2.left)
  }

  const modifiedSaveFile2 = result2.right as G1SAV

  expect(modifiedSaveFile2.boxes[7].pokemon[0]?.nickname).toEqual('AERODACTYL')
  expect(modifiedSaveFile2.boxes[7].pokemon[9]?.nickname).toEqual('MEW')
  expect(modifiedSaveFile2.boxes[7].pokemon[10]).toEqual(undefined)
})

test('inserting mon works', () => {
  const result1 = buildUnknownSaveFile(emptyPathData, new Uint8Array(blueSaveFile.bytes), {}, [
    G1SAV,
  ])

  if (E.isLeft(result1)) {
    fail(result1.left)
  }
  const modifiedSaveFile1 = result1.right as G1SAV

  modifiedSaveFile1.boxes[7].pokemon[11] = new PK1(slowbroOH)
  modifiedSaveFile1.updatedBoxSlots.push({ box: 7, index: 0 })
  modifiedSaveFile1.prepareBoxesAndGetModified()

  const result2 = buildUnknownSaveFile(emptyPathData, new Uint8Array(modifiedSaveFile1.bytes), {}, [
    G1SAV,
  ])

  if (E.isLeft(result2)) {
    fail(result2.left)
  }

  const modifiedSaveFile2 = result2.right as G1SAV

  expect(modifiedSaveFile2.boxes[7].pokemon[0]?.nickname).toEqual('KABUTOPS')
  expect(modifiedSaveFile2.boxes[7].pokemon[10]?.nickname).toEqual('MEW')
  expect(modifiedSaveFile2.boxes[7].pokemon[11]?.nickname).toEqual('Slowbro')
})
