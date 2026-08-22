import { R } from '@openhome-core/util/functional'
import assert, { fail } from 'assert'
import fs from 'fs'
import path from 'path'
import { beforeAll, expect, test } from 'vitest'
import { G1SAV } from '../G1SAV'
import { G1SAVJP } from '../G1SAVJP'
import { G2SAV } from '../G2SAV'
import { G2SAVJP } from '../G2SAVJP'
import { OriginGame } from '@pkm-rs/pkg'
import { buildUnknownSaveFile } from '../util/load'
import { emptyPathData } from '../util/path'
import { isGen1JapanChecksumValid } from '../util/gbJapanChecksums'
import { initializeWasm } from './init'

let jpBlueSaveFile: G1SAVJP

beforeAll(initializeWasm)

function saveTestFilePath(...pathElements: string[]): string {
  return path.join(__dirname, 'save-files', ...pathElements)
}

const ALL_GB_SAVE_TYPES = [G1SAV, G1SAVJP, G2SAV, G2SAVJP]

beforeAll(() => {
  const result = buildUnknownSaveFile(
    emptyPathData,
    new Uint8Array(fs.readFileSync(saveTestFilePath('jp-blue.sav'))),
    ALL_GB_SAVE_TYPES
  )

  assert(R.isOk(result))

  jpBlueSaveFile = result.data as G1SAVJP
})

test('detected as Japanese Gen 1 save and nothing else', () => {
  expect(jpBlueSaveFile).toBeInstanceOf(G1SAVJP)
})

test('trainer data decoded correctly', () => {
  expect(jpBlueSaveFile.name).toEqual('テスト')
  expect(jpBlueSaveFile.tid).toEqual(12345)
})

test('origin game is detected from Japanese titles', () => {
  const originFor = (fileName: string) => {
    const result = buildUnknownSaveFile(
      { ...emptyPathData, name: fileName },
      new Uint8Array(fs.readFileSync(saveTestFilePath('jp-blue.sav'))),
      ALL_GB_SAVE_TYPES
    )

    if (R.isErr(result)) {
      fail(result.error)
    }
    return (result.data as G1SAVJP).origin
  }

  expect(originFor('ポケットモンスター 青.sav')).toEqual(OriginGame.BlueJpn)
  expect(originFor('ポケットモンスター 緑.sav')).toEqual(OriginGame.BlueGreen)
  expect(originFor('ポケットモンスター ピカチュウ.sav')).toEqual(OriginGame.Yellow)
  expect(originFor('ポケットモンスター 赤.sav')).toEqual(OriginGame.Red)
})

test('all 8 stored boxes are read', () => {
  const boxCounts = jpBlueSaveFile.boxes.map(
    (box) => box.boxSlots.filter((slot) => slot !== undefined).length
  )

  expect(boxCounts).toEqual([2, 0, 0, 0, 1, 0, 0, 0])
})

test('pc box decoded correctly', () => {
  expect(jpBlueSaveFile.boxes[0].boxSlots[0]?.nickname).toEqual('フシギダネ')
  expect(jpBlueSaveFile.boxes[0].boxSlots[1]?.nickname).toEqual('ピカチュウ')
  expect(jpBlueSaveFile.boxes[4].boxSlots[0]?.nickname).toEqual('ミュウ')
  expect(jpBlueSaveFile.boxes[0].boxSlots[0]?.trainerName).toEqual('テスト')
  expect(jpBlueSaveFile.boxes[0].boxSlots[0]?.nationalDex).toEqual(1)
  // the shiny DV spread must survive parsing exactly
  expect(jpBlueSaveFile.boxes[0].boxSlots[0]?.dvs).toEqual({
    hp: 8,
    atk: 15,
    def: 10,
    spe: 10,
    spc: 10,
  })
})

test('write round-trip preserves box contents and checksum', () => {
  const result1 = buildUnknownSaveFile(
    emptyPathData,
    new Uint8Array(jpBlueSaveFile.bytes),
    ALL_GB_SAVE_TYPES
  )

  if (R.isErr(result1)) {
    fail(result1.error)
  }
  const modifiedSaveFile1 = result1.data as G1SAVJP

  // rewrite every box from the parsed representation without changing anything
  for (let boxNumber = 0; boxNumber < 8; boxNumber++) {
    modifiedSaveFile1.updatedBoxSlots.push({ box: boxNumber, boxSlot: 0 })
  }
  modifiedSaveFile1.prepareForSaving()

  expect(isGen1JapanChecksumValid(modifiedSaveFile1.bytes)).toEqual(true)

  const result2 = buildUnknownSaveFile(
    emptyPathData,
    new Uint8Array(modifiedSaveFile1.bytes),
    ALL_GB_SAVE_TYPES
  )

  if (R.isErr(result2)) {
    fail(result2.error)
  }
  const modifiedSaveFile2 = result2.data as G1SAVJP

  expect(modifiedSaveFile2).toBeInstanceOf(G1SAVJP)
  for (let boxNumber = 0; boxNumber < 8; boxNumber++) {
    for (let slot = 0; slot < 30; slot++) {
      const before = jpBlueSaveFile.boxes[boxNumber].boxSlots[slot]
      const after = modifiedSaveFile2.boxes[boxNumber].boxSlots[slot]

      expect(after?.nickname).toEqual(before?.nickname)
      expect(after?.trainerName).toEqual(before?.trainerName)
      expect(after?.nationalDex).toEqual(before?.nationalDex)
      expect(after?.dvs).toEqual(before?.dvs)
    }
  }
})

test('removing mon shifts others in box', () => {
  const result1 = buildUnknownSaveFile(
    emptyPathData,
    new Uint8Array(jpBlueSaveFile.bytes),
    ALL_GB_SAVE_TYPES
  )

  if (R.isErr(result1)) {
    fail(result1.error)
  }
  const modifiedSaveFile1 = result1.data as G1SAVJP
  const secondNickname = modifiedSaveFile1.boxes[0].boxSlots[1]?.nickname

  modifiedSaveFile1.boxes[0].boxSlots[0] = undefined
  modifiedSaveFile1.updatedBoxSlots.push({ box: 0, boxSlot: 0 })
  modifiedSaveFile1.prepareForSaving()

  const result2 = buildUnknownSaveFile(
    emptyPathData,
    new Uint8Array(modifiedSaveFile1.bytes),
    ALL_GB_SAVE_TYPES
  )

  if (R.isErr(result2)) {
    fail(result2.error)
  }
  const modifiedSaveFile2 = result2.data as G1SAVJP

  expect(modifiedSaveFile2.boxes[0].boxSlots[0]?.nickname).toEqual(secondNickname)
  expect(modifiedSaveFile2.boxes[0].boxSlots[29]).toEqual(undefined)
})
