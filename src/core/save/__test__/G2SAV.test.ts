import { bytesToPKM } from '@openhome-core/pkm/FileImport'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { R } from '@openhome-core/util/functional'
import { PK2 } from '@pokemon-files/pkm'
import fs from 'fs'
import path from 'path'
import { beforeAll, expect, test } from 'vitest'
import { G2SAV } from '../G2SAV'
import { buildUnknownSaveFile } from '../util/load'
import { emptyPathData } from '../util/path'
import { initializeWasm } from './init'
import { dummyTrack } from './util'

beforeAll(initializeWasm)
let crystalSaveFile: G2SAV
var slowbroOH: OHPKM

beforeAll(async () => {
  await initializeWasm()
  const result = buildUnknownSaveFile(
    emptyPathData,
    new Uint8Array(fs.readFileSync(path.join(__dirname, 'save-files', 'crystal.sav'))),
    {},
    [G2SAV]
  )

  if (R.isErr(result)) {
    throw result.err
  }

  crystalSaveFile = result.value as G2SAV

  const slowpokeBytes = fs.readFileSync(
    path.join('src/core/pkm/__test__/PKMFiles/OhpkmV2', 'slowbro.ohpkm')
  )
  slowbroOH = bytesToPKM(new Uint8Array(slowpokeBytes), 'OhpkmV2') as OHPKM
})

test('pc box decoded correctly', () => {
  expect(crystalSaveFile.boxes[9].boxSlots[0]?.data.nickname).toEqual('AMPHAROS')
  expect(crystalSaveFile.boxes[9].boxSlots[1]?.data.nickname).toEqual('BELLOSSOM')
  expect(crystalSaveFile.boxes[9].boxSlots[18]?.data.nickname).toEqual('SLOWKING')
  expect(crystalSaveFile.boxes[9].boxSlots[19]?.data.nickname).toEqual('MISDREAVUS')
})

test('removing mon shifts others in box', () => {
  const result1 = buildUnknownSaveFile(emptyPathData, new Uint8Array(crystalSaveFile.bytes), {}, [
    G2SAV,
  ])

  if (R.isErr(result1)) {
    throw Error(result1.err)
  }

  const modifiedSaveFile1 = result1.value as G2SAV

  modifiedSaveFile1.boxes[9].boxSlots[0] = undefined
  modifiedSaveFile1.updatedBoxSlots.push({ box: 9, index: 0 })
  modifiedSaveFile1.prepareForSaving()

  const result2 = buildUnknownSaveFile(emptyPathData, new Uint8Array(modifiedSaveFile1.bytes), {}, [
    G2SAV,
  ])

  if (R.isErr(result2)) {
    throw Error(result2.err)
  }

  const modifiedSaveFile2 = result2.value as G2SAV

  expect(modifiedSaveFile2.boxes[9].boxSlots[0]?.data.nickname).toEqual('BELLOSSOM')
  expect(modifiedSaveFile2.boxes[9].boxSlots[18]?.data.nickname).toEqual('MISDREAVUS')
  expect(modifiedSaveFile2.boxes[9].boxSlots[19]).toEqual(undefined)
})

test('inserting mon works', () => {
  const result1 = buildUnknownSaveFile(emptyPathData, new Uint8Array(crystalSaveFile.bytes), {}, [
    G2SAV,
  ])

  if (R.isErr(result1)) {
    throw Error(result1.err)
  }

  const modifiedSaveFile1 = result1.value as G2SAV

  modifiedSaveFile1.boxes[13].boxSlots[17] = dummyTrack(new PK2(slowbroOH))
  modifiedSaveFile1.updatedBoxSlots.push({ box: 13, index: 0 })
  modifiedSaveFile1.prepareForSaving()

  const result2 = buildUnknownSaveFile(emptyPathData, new Uint8Array(modifiedSaveFile1.bytes), {}, [
    G2SAV,
  ])

  if (R.isErr(result2)) {
    throw Error(result2.err)
  }

  const modifiedSaveFile2 = result2.value as G2SAV

  expect(modifiedSaveFile2.boxes[13].boxSlots[0]?.data.nickname).toEqual('UNOWN')
  expect(modifiedSaveFile2.boxes[13].boxSlots[16]?.data.nickname).toEqual('WIGGLYTUFF')
  expect(modifiedSaveFile2.boxes[13].boxSlots[17]?.data.nickname).toEqual('Slowbro')
})
