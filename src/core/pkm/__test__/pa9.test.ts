import { PA9 } from '@openhome-core/pkm'
import { Moves } from '@openhome-core/resources'
import { R } from '@openhome-core/util/functional'
import { getDefaultConvertStrategy } from '@pkm-rs/pkg'
import fs from 'fs'
import { TextDecoder } from 'node:util' // (ESM style imports)
import { assert, beforeAll, describe, expect, test } from 'vitest'
import { OHPKM } from '../OHPKM'
import { initializeWasm } from './init'
import { pkmTestFilePath } from './Ohpkm.test'
;(global as any).TextDecoder = TextDecoder

function pa9FromTestFile(filename: string) {
  const bytes = new Uint8Array(fs.readFileSync(pkmTestFilePath('pa9', filename)))
  return PA9.fromBytes(bytes.buffer)
}

beforeAll(initializeWasm)

describe('legends z-a conversion to bytes and back is lossless', async () => {
  const files = fs.readdirSync(pkmTestFilePath('pa9')).filter((f) => f.endsWith('.pa9'))
  await initializeWasm()

  for (const file of files) {
    const original = pa9FromTestFile(file)
    const roundTrip = PA9.fromBytes(PA9.fromBytes(original.toBytes()).toBytes())

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

    test(`ribbons match - ${file}`, () => {
      expect(original.ribbons).toEqual(roundTrip.ribbons)
    })
  }
})

describe('legends z-a conversion to ohpkm and back is lossless', async () => {
  const files = fs.readdirSync(pkmTestFilePath('pa9')).filter((f) => f.endsWith('.pa9'))
  await initializeWasm()

  for (const file of files) {
    const bytes = new Uint8Array(fs.readFileSync(pkmTestFilePath('pa9', file)))
    const original = PA9.fromBytes(bytes.buffer)
    const roundTrip = R.assert(
      PA9.fromOhpkm(OHPKM.fromMonUnknownSave(original), getDefaultConvertStrategy())
    )

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

    test(`ribbons match - ${file}`, () => {
      expect(original.ribbons).toEqual(roundTrip.ribbons)
    })

    test(`tm flags match - ${file}`, () => {
      expect(original.tmFlagsLzaBase, 'Base').toEqual(roundTrip.tmFlagsLzaBase)
      expect(original.tmFlagsLzaDlc, 'Dlc').toEqual(roundTrip.tmFlagsLzaDlc)
    })

    test(`plus move flags match - ${file}`, () => {
      expect(Array.from(original.plusMoveFlags.getMoveIds()).map((id) => Moves[id].name)).toEqual(
        Array.from(roundTrip.plusMoveFlags.getMoveIds()).map((id) => Moves[id].name)
      )
    })
  }
})
