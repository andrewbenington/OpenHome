import { ConvertStrategies } from '@pkm-rs/pkg/pkm_rs'
import { PK8 } from '@pokemon-files/pkm'
import fs from 'fs'
import { TextDecoder } from 'node:util' // (ESM style imports)
import path from 'path'
import { assert, beforeAll, describe, expect, test } from 'vitest'
import { OHPKM } from '../OHPKM'
import { initializeWasm } from './init'
;(global as any).TextDecoder = TextDecoder

beforeAll(initializeWasm)

function pkmTestFilePath(...pathElements: string[]): string {
  return path.join(__dirname, 'pkm-files', ...pathElements)
}

describe('gen 8 conversion to bytes and back is lossless', async () => {
  const files = fs.readdirSync(pkmTestFilePath('pk8')).filter((f) => f.endsWith('.pk8'))
  await initializeWasm()

  for (const file of files) {
    const bytes = new Uint8Array(fs.readFileSync(pkmTestFilePath('pk8', file)))
    const original = PK8.fromBytes(bytes.buffer)
    const roundTrip = PK8.fromBytes(PK8.fromBytes(original.toBytes()).toBytes())

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

describe('gen 8 conversion to OHPKM and back is lossless', async () => {
  const files = fs.readdirSync(pkmTestFilePath('pk8')).filter((f) => f.endsWith('.pk8'))
  await initializeWasm()

  for (const file of files) {
    const bytes = new Uint8Array(fs.readFileSync(pkmTestFilePath('pk8', file)))
    const original = PK8.fromBytes(bytes.buffer)
    const ohpkm = OHPKM.fromMonUnknownSave(original)

    test(`ohpkm pid matches - ${file}`, () => {
      expect(ohpkm.personalityValue).toBe(original.personalityValue)
    })

    const roundTrip = PK8.fromOhpkm(ohpkm, ConvertStrategies.getDefault())

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
