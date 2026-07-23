import { PK9, toHex } from '@openhome-core/pkm'
import fs from 'fs'
import { TextDecoder } from 'node:util' // (ESM style imports)
import { assert, beforeAll, describe, expect, test } from 'vitest'
import { initializeWasm } from './init'
import { pkmTestFilePath } from './Ohpkm.test'
;(global as any).TextDecoder = TextDecoder

beforeAll(initializeWasm)

describe('gen 9 conversion to bytes and back is lossless', async () => {
  const files = fs.readdirSync(pkmTestFilePath('pk9')).filter((f) => f.endsWith('.pk9'))
  await initializeWasm()

  for (const file of files) {
    const bytes = new Uint8Array(fs.readFileSync(pkmTestFilePath('pk9', file)))
    const original = PK9.fromBytes(bytes.buffer)
    const roundTrip = PK9.fromBytes(PK9.fromBytes(original.toBytes()).toBytes())

    test(`round trip game of origin match - ${file}`, () => {
      if (original.gameOfOrigin !== roundTrip.gameOfOrigin) {
        throw new Error(
          `Game of origin mismatch after round trip: original=${original.gameOfOrigin} roundTrip=${roundTrip.gameOfOrigin}`
        )
      }
    })

    roundTrip.refreshChecksum()
    test(`ability nums match - ${file}`, () => {
      assert(original.abilityNum === roundTrip.abilityNum)
    })

    test(`pids match - ${file}`, () => {
      if (original.nickname === 'KingK.Rool') {
        console.assert(roundTrip.personalityValue.toString(16) === '74116f9e')
      }
      if (original.personalityValue !== roundTrip.personalityValue) {
        throw new Error(
          `PID mismatch: original=${original.personalityValue} roundTrip=${roundTrip.personalityValue}`
        )
      }
    })

    test(`genders match - ${file}`, () => {
      assert(original.gender === roundTrip.gender)
    })

    test(`ribbons match - ${file}`, () => {
      expect(original.ribbons).toEqual(roundTrip.ribbons)
    })

    test(`moves match - ${file}`, () => {
      expect(original.moves, 'move indices').toEqual(roundTrip.moves)
      expect(original.movePP, 'move PP').toEqual(roundTrip.movePP)
      expect(original.movePPUps, 'move PP Ups').toEqual(roundTrip.movePPUps)
    })
  }
})

const file_path = 'test-files/pkm-files/pk9/z002 - Skeledirge (Goofy) - 814A7559FB6B.pk9'

describe('gen 9 conversion to OHPKM and back is lossless', async () => {
  await initializeWasm()

  test(`ENCRYPTED BYTES`, () => {
    const bytes = new Uint8Array(fs.readFileSync(file_path))
    const pk9 = PK9.fromBytes(bytes.buffer)

    assert(pk9.calculateChecksum() === pk9.checksum)

    console.log({ hex: toHex(new Uint8Array(pk9.toPCBytes())), checksum: pk9.calculateChecksum() })
  })
})
