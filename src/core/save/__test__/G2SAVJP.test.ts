import { R } from '@openhome-core/util/functional'
import assert, { fail } from 'assert'
import fs from 'fs'
import path from 'path'
import { beforeAll, expect, test } from 'vitest'
import { G1SAV } from '../G1SAV'
import { G1SAVJP } from '../G1SAVJP'
import { G2SAV } from '../G2SAV'
import { G2SAVJP } from '../G2SAVJP'
import { buildUnknownSaveFile } from '../util/load'
import { emptyPathData } from '../util/path'
import { areGen2JapanCrystalChecksumsValid } from '../util/gbJapanChecksums'
import { initializeWasm } from './init'

let jpCrystalSaveFile: G2SAVJP

beforeAll(initializeWasm)

function saveTestFilePath(...pathElements: string[]): string {
  return path.join(__dirname, 'save-files', ...pathElements)
}

const ALL_GB_SAVE_TYPES = [G1SAV, G1SAVJP, G2SAV, G2SAVJP]

beforeAll(() => {
  const result = buildUnknownSaveFile(
    emptyPathData,
    new Uint8Array(fs.readFileSync(saveTestFilePath('jp-crystal.sav'))),
    ALL_GB_SAVE_TYPES
  )

  assert(R.isOk(result))

  jpCrystalSaveFile = result.data as G2SAVJP
})

test('detected as Japanese Gen 2 save and nothing else', () => {
  expect(jpCrystalSaveFile).toBeInstanceOf(G2SAVJP)
})

test('trainer data decoded correctly', () => {
  expect(jpCrystalSaveFile.name).toEqual('テスト')
  expect(jpCrystalSaveFile.tid).toEqual(54321)
})

test('all 9 stored boxes are read, active box from live copy', () => {
  const boxCounts = jpCrystalSaveFile.boxes.map(
    (box) => box.boxSlots.filter((slot) => slot !== undefined).length
  )

  expect(boxCounts).toEqual([2, 0, 0, 0, 0, 0, 1, 0, 0])
  expect(jpCrystalSaveFile.currentPCBox).toEqual(0)
})

test('active box decoded from live copy correctly', () => {
  expect(jpCrystalSaveFile.boxes[0].boxSlots[0]?.nickname).toEqual('ワニノコ')
  expect(jpCrystalSaveFile.boxes[0].boxSlots[1]?.nickname).toEqual('ピカチュウ')
  expect(jpCrystalSaveFile.boxes[6].boxSlots[0]?.nickname).toEqual('チコりータ')
  expect(jpCrystalSaveFile.boxes[0].boxSlots[0]?.trainerName).toEqual('テスト')
})

test('write round-trip preserves box contents and checksums', () => {
  const result1 = buildUnknownSaveFile(
    emptyPathData,
    new Uint8Array(jpCrystalSaveFile.bytes),
    ALL_GB_SAVE_TYPES
  )

  if (R.isErr(result1)) {
    fail(result1.error)
  }
  const modifiedSaveFile1 = result1.data as G2SAVJP

  for (let boxNumber = 0; boxNumber < 9; boxNumber++) {
    modifiedSaveFile1.updatedBoxSlots.push({ box: boxNumber, boxSlot: 0 })
  }
  modifiedSaveFile1.prepareForSaving()

  expect(areGen2JapanCrystalChecksumsValid(modifiedSaveFile1.bytes)).toEqual(true)

  const result2 = buildUnknownSaveFile(
    emptyPathData,
    new Uint8Array(modifiedSaveFile1.bytes),
    ALL_GB_SAVE_TYPES
  )

  if (R.isErr(result2)) {
    fail(result2.error)
  }
  const modifiedSaveFile2 = result2.data as G2SAVJP

  expect(modifiedSaveFile2).toBeInstanceOf(G2SAVJP)
  for (let boxNumber = 0; boxNumber < 9; boxNumber++) {
    for (let slot = 0; slot < 30; slot++) {
      const before = jpCrystalSaveFile.boxes[boxNumber].boxSlots[slot]
      const after = modifiedSaveFile2.boxes[boxNumber].boxSlots[slot]

      expect(after?.nickname).toEqual(before?.nickname)
      expect(after?.trainerName).toEqual(before?.trainerName)
      expect(after?.nationalDex).toEqual(before?.nationalDex)
      expect(after?.dvs).toEqual(before?.dvs)
      expect(after?.heldItemIndex).toEqual(before?.heldItemIndex)
    }
  }
})

test('taking a held item survives a write round-trip', () => {
  const result1 = buildUnknownSaveFile(
    emptyPathData,
    new Uint8Array(jpCrystalSaveFile.bytes),
    ALL_GB_SAVE_TYPES
  )

  if (R.isErr(result1)) {
    fail(result1.error)
  }
  const modifiedSaveFile1 = result1.data as G2SAVJP

  // find a boxed mon holding an item
  let targetBox = -1
  let targetSlot = -1

  outer: for (let boxNumber = 0; boxNumber < 9; boxNumber++) {
    for (let slot = 0; slot < 30; slot++) {
      const mon = modifiedSaveFile1.boxes[boxNumber].boxSlots[slot]

      if (mon && mon.heldItemIndex) {
        targetBox = boxNumber
        targetSlot = slot
        break outer
      }
    }
  }
  expect(targetBox).toBeGreaterThanOrEqual(0)

  const mon = modifiedSaveFile1.boxes[targetBox].boxSlots[targetSlot]!

  mon.heldItemIndexGen2 = undefined
  modifiedSaveFile1.updatedBoxSlots.push({ box: targetBox, boxSlot: targetSlot })
  modifiedSaveFile1.prepareForSaving()

  const result2 = buildUnknownSaveFile(
    emptyPathData,
    new Uint8Array(modifiedSaveFile1.bytes),
    ALL_GB_SAVE_TYPES
  )

  if (R.isErr(result2)) {
    fail(result2.error)
  }
  const modifiedSaveFile2 = result2.data as G2SAVJP

  expect(modifiedSaveFile2.boxes[targetBox].boxSlots[targetSlot]?.heldItemIndex).toEqual(0)
  expect(areGen2JapanCrystalChecksumsValid(modifiedSaveFile2.bytes)).toEqual(true)
})
