import { R } from '@openhome-core/util/functional'
import { NationalDex } from '@pkm-rs/pkg'
import { fail } from 'assert'
import fs from 'fs'
import path from 'path'
import { describe, expect, test } from 'vitest'
import { DPSAV } from '../DPSAV'
import { G4SAV } from '../G4SAV'
import { HGSSSAV } from '../HGSSSAV'
import { PtSAV } from '../PtSAV'
import { buildUnknownSaveFile } from '../util/load'
import { emptyPathData } from '../util/path'
import { initializeWasm } from './init'

describe('Platinum save file read/write', async () => {
  await initializeWasm()
  const saveFilePath = path.join(__dirname, 'save-files', 'platinum.sav')
  const platinumSaveBytes = new Uint8Array(fs.readFileSync(saveFilePath))
  const saveFile = new PtSAV(emptyPathData, platinumSaveBytes)

  const TEST_BOX = 17
  const UNOWN_QUESTION_SLOT = 27

  test('save detected and built', () => {
    const result = buildUnknownSaveFile(
      emptyPathData,
      new Uint8Array(fs.readFileSync(saveFilePath)),
      [PtSAV]
    )

    if (!R.isOk(result)) {
      fail(`Failed to build save file: ${result.err}`)
    }

    if (result.value === undefined) {
      fail(`Failed to build save file: got undefined`)
    }
  })

  test('save has expected trainer name', () => {
    expect(saveFile.name).toBe('RoC')
  })

  test('unown ? in last box', () => {
    const lastPokemon = saveFile.boxes[TEST_BOX].boxSlots[UNOWN_QUESTION_SLOT]

    if (lastPokemon) {
      // display_mon(firstPokemon)

      expect(lastPokemon.nickname).toBe('UNOWN')
      expect(lastPokemon.trainerID).toBe(7251)
      expect(lastPokemon.trainerName).toBe('RoC')
      expect(lastPokemon.moves[0]).toBe(237) // Hidden Power
      expect(lastPokemon.moves[1]).toBe(0)
      expect(lastPokemon.dexNum).toBe(NationalDex.Unown)
      expect(lastPokemon.formeNum).toBe(27)
      expect(lastPokemon.exp).toBe(8000)
    } else {
      fail('No Pokémon found in the 18th box, 27th slot.')
    }
  })

  test('box 18 slot 29 is empty', () => {
    const EMPTY_SLOT = 28
    expect(saveFile.slotIsEmpty(TEST_BOX, EMPTY_SLOT)).toBe(true)
  })

  test('empty slot written correctly', () => {
    const INITIAL_EMPTY_SLOT = 28
    const UNCHANGED_EMPTY_SLOT = 29
    const emptySlotBytes = new Uint8Array(saveFile.getMonBytesAt(TEST_BOX, INITIAL_EMPTY_SLOT))

    expect(emptySlotBytes.length).toBe(136)
    expect(
      Array.from(G4SAV.emptySlotBytes()),
      'OpenHome empty slot bytes are identical to known empty slot'
    ).toEqual(Array.from(emptySlotBytes))
    // // move unown ? to empty slot
    saveFile.boxes[TEST_BOX].boxSlots[INITIAL_EMPTY_SLOT] =
      saveFile.boxes[TEST_BOX].boxSlots[UNOWN_QUESTION_SLOT]
    saveFile.boxes[TEST_BOX].boxSlots[UNOWN_QUESTION_SLOT] = undefined
    saveFile.updatedBoxSlots.push(
      { box: TEST_BOX, boxSlot: INITIAL_EMPTY_SLOT },
      { box: TEST_BOX, boxSlot: UNOWN_QUESTION_SLOT }
    )

    const saveWriter = saveFile.prepareWriter()
    const rebuiltSave = new PtSAV(emptyPathData, saveWriter.bytes)

    expect(
      rebuiltSave.slotIsEmpty(TEST_BOX, UNOWN_QUESTION_SLOT),
      'Slot formerly occupied by Unown ? is empty'
    ).toBe(true)
    expect(
      new Uint8Array(saveFile.getMonBytesAt(TEST_BOX, UNCHANGED_EMPTY_SLOT)),
      'Unchanged empty slot has expected bytes'
    ).toEqual(emptySlotBytes)
    expect(
      new Uint8Array(saveFile.getMonBytesAt(TEST_BOX, UNOWN_QUESTION_SLOT)),
      'Newly empty slot has expected bytes'
    ).toEqual(emptySlotBytes)
  })
})

describe('Pearl save file read/write', async () => {
  await initializeWasm()
  const saveFilePath = path.join(__dirname, 'save-files', 'pearl.sav')
  const saveBytes = new Uint8Array(fs.readFileSync(saveFilePath))
  const saveFile = new DPSAV(emptyPathData, saveBytes)

  const TEST_BOX = 17
  const UNOWN_QUESTION_SLOT = 27

  test('save detected and built', () => {
    const result = buildUnknownSaveFile(
      emptyPathData,
      new Uint8Array(fs.readFileSync(saveFilePath)),
      [DPSAV]
    )

    if (!R.isOk(result)) {
      fail(`Failed to build save file: ${result.err}`)
    }

    if (result.value === undefined) {
      fail(`Failed to build save file: got undefined`)
    }
  })

  test('save has expected trainer name', () => {
    expect(saveFile.name).toBe('RoC')
  })

  test('unown ? in last box', () => {
    const lastPokemon = saveFile.boxes[TEST_BOX].boxSlots[UNOWN_QUESTION_SLOT]

    if (lastPokemon) {
      // display_mon(firstPokemon)

      expect(lastPokemon.nickname).toBe('UNOWN')
      expect(lastPokemon.trainerID).toBe(7251)
      expect(lastPokemon.trainerName).toBe('RoC')
      expect(lastPokemon.moves[0]).toBe(237) // Hidden Power
      expect(lastPokemon.moves[1]).toBe(0)
      expect(lastPokemon.dexNum).toBe(NationalDex.Unown)
      expect(lastPokemon.formeNum).toBe(27)
      expect(lastPokemon.exp).toBe(8000)
    } else {
      fail('No Pokémon found in the 18th box, 27th slot.')
    }
  })

  test('box 18 slot 29 is empty', () => {
    const EMPTY_SLOT = 28
    expect(saveFile.slotIsEmpty(TEST_BOX, EMPTY_SLOT)).toBe(true)
  })

  test('empty slot written correctly', () => {
    const INITIAL_EMPTY_SLOT = 28
    const UNCHANGED_EMPTY_SLOT = 29
    const emptySlotBytes = new Uint8Array(saveFile.getMonBytesAt(TEST_BOX, INITIAL_EMPTY_SLOT))

    expect(emptySlotBytes.length).toBe(136)
    expect(
      Array.from(G4SAV.emptySlotBytes()),
      'OpenHome empty slot bytes are identical to known empty slot'
    ).toEqual(Array.from(emptySlotBytes))
    // // move unown ? to empty slot
    saveFile.boxes[TEST_BOX].boxSlots[INITIAL_EMPTY_SLOT] =
      saveFile.boxes[TEST_BOX].boxSlots[UNOWN_QUESTION_SLOT]
    saveFile.boxes[TEST_BOX].boxSlots[UNOWN_QUESTION_SLOT] = undefined
    saveFile.updatedBoxSlots.push(
      { box: TEST_BOX, boxSlot: INITIAL_EMPTY_SLOT },
      { box: TEST_BOX, boxSlot: UNOWN_QUESTION_SLOT }
    )

    const saveWriter = saveFile.prepareWriter()
    const rebuiltSave = new DPSAV(emptyPathData, saveWriter.bytes)

    expect(
      rebuiltSave.slotIsEmpty(TEST_BOX, UNOWN_QUESTION_SLOT),
      'Slot formerly occupied by Unown ? is empty'
    ).toBe(true)
    expect(
      new Uint8Array(saveFile.getMonBytesAt(TEST_BOX, UNCHANGED_EMPTY_SLOT)),
      'Unchanged empty slot has expected bytes'
    ).toEqual(emptySlotBytes)
    expect(
      new Uint8Array(saveFile.getMonBytesAt(TEST_BOX, UNOWN_QUESTION_SLOT)),
      'Newly empty slot has expected bytes'
    ).toEqual(emptySlotBytes)
  })
})

describe('HeartGold save file read/write', async () => {
  await initializeWasm()
  const saveFilePath = path.join(__dirname, 'save-files', 'heartgold.sav')
  const saveBytes = new Uint8Array(fs.readFileSync(saveFilePath))
  const saveFile = new HGSSSAV(emptyPathData, saveBytes)

  const TEST_BOX = 17
  const UNOWN_QUESTION_SLOT = 27

  test('save detected and built', () => {
    const result = buildUnknownSaveFile(
      emptyPathData,
      new Uint8Array(fs.readFileSync(saveFilePath)),

      [HGSSSAV]
    )

    if (!R.isOk(result)) {
      fail(`Failed to build save file: ${result.err}`)
    }

    if (result.value === undefined) {
      fail(`Failed to build save file: got undefined`)
    }
  })

  test('save has expected trainer name', () => {
    expect(saveFile.name).toBe('RoC')
  })

  test('unown ? in last box', () => {
    const lastPokemon = saveFile.boxes[TEST_BOX].boxSlots[UNOWN_QUESTION_SLOT]

    if (lastPokemon) {
      // display_mon(firstPokemon)

      expect(lastPokemon.nickname).toBe('UNOWN')
      expect(lastPokemon.trainerID).toBe(41896)
      expect(lastPokemon.trainerName).toBe('RoC')
      expect(lastPokemon.moves[0]).toBe(237) // Hidden Power
      expect(lastPokemon.moves[1]).toBe(0)
      expect(lastPokemon.dexNum).toBe(NationalDex.Unown)
      expect(lastPokemon.formeNum).toBe(27)
      expect(lastPokemon.exp).toBe(125)
    } else {
      fail('No Pokémon found in the 18th box, 27th slot.')
    }
  })

  test('box 18 slot 29 is empty', () => {
    const EMPTY_SLOT = 28
    expect(saveFile.slotIsEmpty(TEST_BOX, EMPTY_SLOT)).toBe(true)
  })

  test('empty slot written correctly', () => {
    const INITIAL_EMPTY_SLOT = 28
    const UNCHANGED_EMPTY_SLOT = 29
    const emptySlotBytes = new Uint8Array(saveFile.getMonBytesAt(TEST_BOX, INITIAL_EMPTY_SLOT))

    expect(emptySlotBytes.length).toBe(136)
    expect(
      Array.from(G4SAV.emptySlotBytes()),
      'OpenHome empty slot bytes are identical to known empty slot'
    ).toEqual(Array.from(emptySlotBytes))
    // // move unown ? to empty slot
    saveFile.boxes[TEST_BOX].boxSlots[INITIAL_EMPTY_SLOT] =
      saveFile.boxes[TEST_BOX].boxSlots[UNOWN_QUESTION_SLOT]
    saveFile.boxes[TEST_BOX].boxSlots[UNOWN_QUESTION_SLOT] = undefined
    saveFile.updatedBoxSlots.push(
      { box: TEST_BOX, boxSlot: INITIAL_EMPTY_SLOT },
      { box: TEST_BOX, boxSlot: UNOWN_QUESTION_SLOT }
    )

    const saveWriter = saveFile.prepareWriter()
    const rebuiltSave = new HGSSSAV(emptyPathData, saveWriter.bytes)

    expect(
      rebuiltSave.slotIsEmpty(TEST_BOX, UNOWN_QUESTION_SLOT),
      'Slot formerly occupied by Unown ? is empty'
    ).toBe(true)
    expect(
      new Uint8Array(saveFile.getMonBytesAt(TEST_BOX, UNCHANGED_EMPTY_SLOT)),
      'Unchanged empty slot has expected bytes'
    ).toEqual(emptySlotBytes)
    expect(
      new Uint8Array(saveFile.getMonBytesAt(TEST_BOX, UNOWN_QUESTION_SLOT)),
      'Newly empty slot has expected bytes'
    ).toEqual(emptySlotBytes)
  })
})
