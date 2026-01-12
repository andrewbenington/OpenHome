import { bytesToPKM } from '@openhome-core/pkm/FileImport'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { R } from '@openhome-core/util/functional'
import { PK1 } from '@pokemon-files/pkm'
import assert, { fail } from 'assert'
import fs from 'fs'
import path from 'path'
import { beforeAll, expect, test } from 'vitest'
import { G1SAV } from '../G1SAV'
import { buildUnknownSaveFile } from '../util/load'
import { emptyPathData } from '../util/path'
import { initializeWasm } from './init'
import { dummyTrack } from './util'

let blueSaveFile: G1SAV
var slowbroOH: OHPKM

beforeAll(initializeWasm)
beforeAll(() => {
  const result = buildUnknownSaveFile(
    emptyPathData,
    new Uint8Array(fs.readFileSync(path.join(__dirname, 'save-files', 'blue.sav'))),
    {},
    [G1SAV]
  )

  assert(R.isOk(result))

  blueSaveFile = result.value as G1SAV

  slowbroOH = bytesToPKM(
    new Uint8Array(
      fs.readFileSync(path.join('src/core/pkm/__test__/PKMFiles/OhpkmV2', 'slowbro.ohpkm'))
    ),
    'OhpkmV2'
  ) as OHPKM
})

test('pc box decoded correctly', () => {
  expect(blueSaveFile.boxes[7].boxSlots[0]?.data.nickname).toEqual('KABUTOPS')
  expect(blueSaveFile.boxes[7].boxSlots[1]?.data.nickname).toEqual('AERODACTYL')
  expect(blueSaveFile.boxes[7].boxSlots[9]?.data.nickname).toEqual('MEWTWO')
  expect(blueSaveFile.boxes[7].boxSlots[10]?.data.nickname).toEqual('MEW')
})

test('removing mon shifts others in box', () => {
  const result1 = buildUnknownSaveFile(emptyPathData, new Uint8Array(blueSaveFile.bytes), {}, [
    G1SAV,
  ])

  if (R.isErr(result1)) {
    fail(result1.err)
  }

  const modifiedSaveFile1 = result1.value as G1SAV

  modifiedSaveFile1.boxes[7].boxSlots[0] = undefined
  modifiedSaveFile1.updatedBoxSlots.push({ box: 7, index: 0 })
  modifiedSaveFile1.prepareBoxesAndGetModified()

  const result2 = buildUnknownSaveFile(emptyPathData, new Uint8Array(modifiedSaveFile1.bytes), {}, [
    G1SAV,
  ])

  if (R.isErr(result2)) {
    fail(result2.err)
  }

  const modifiedSaveFile2 = result2.value as G1SAV

  expect(modifiedSaveFile2.boxes[7].boxSlots[0]?.data.nickname).toEqual('AERODACTYL')
  expect(modifiedSaveFile2.boxes[7].boxSlots[9]?.data.nickname).toEqual('MEW')
  expect(modifiedSaveFile2.boxes[7].boxSlots[10]).toEqual(undefined)
})

test('inserting mon works', () => {
  const result1 = buildUnknownSaveFile(emptyPathData, new Uint8Array(blueSaveFile.bytes), {}, [
    G1SAV,
  ])

  if (R.isErr(result1)) {
    fail(result1.err)
  }
  const modifiedSaveFile1 = result1.value as G1SAV

  modifiedSaveFile1.boxes[7].boxSlots[11] = dummyTrack(new PK1(slowbroOH))
  modifiedSaveFile1.updatedBoxSlots.push({ box: 7, index: 0 })
  modifiedSaveFile1.prepareBoxesAndGetModified()

  const result2 = buildUnknownSaveFile(emptyPathData, new Uint8Array(modifiedSaveFile1.bytes), {}, [
    G1SAV,
  ])

  if (R.isErr(result2)) {
    fail(result2.err)
  }

  const modifiedSaveFile2 = result2.value as G1SAV

  expect(modifiedSaveFile2.boxes[7].boxSlots[0]?.data.nickname).toEqual('KABUTOPS')
  expect(modifiedSaveFile2.boxes[7].boxSlots[10]?.data.nickname).toEqual('MEW')
  expect(modifiedSaveFile2.boxes[7].boxSlots[11]?.data.nickname).toEqual('Slowbro')
})
