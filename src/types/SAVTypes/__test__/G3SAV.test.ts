import assert, { fail } from 'assert'
import * as E from 'fp-ts/lib/Either'
import fs from 'fs'
import path from 'path'
import { describe, expect, test } from 'vitest'
import { SpeciesLookup } from '../../../../pkm_rs_resources/pkg/pkm_rs_resources'
import { G3SAV } from '../G3SAV'
import { buildUnknownSaveFile } from '../load'
import { emptyPathData } from '../path'

const result = buildUnknownSaveFile(
  emptyPathData,
  new Uint8Array(fs.readFileSync(path.join(__dirname, 'SAVFiles', 'emerald.sav'))),
  {},
  [G3SAV]
)

assert(E.isRight(result))

const emeraldSaveFile = result.right as G3SAV

describe('G3SAV - Gen 3 Save File Read Test', () => {
  test('should load initial save data correctly', () => {
    expect(emeraldSaveFile.name).toBe('RoC')
  })

  test('should print the first Pokémon in the first box', () => {
    const firstPokemon = emeraldSaveFile.boxes[0].pokemon[0]

    if (firstPokemon) {
      // display_mon(firstPokemon)

      expect(firstPokemon.nickname).toBe('BULBASAUR')
      expect(firstPokemon.trainerID).toBe(56345)
      expect(firstPokemon.trainerName).toBe('RoC')
      expect(firstPokemon.moves[0]).toBe(33) // Tackle
      expect(firstPokemon.moves[1]).toBe(45) // Growl
      expect(firstPokemon.dexNum).toBe(1)
      expect(SpeciesLookup(firstPokemon.dexNum)?.name).toBe('Bulbasaur')
    } else {
      fail('No Pokémon found in the first box, first slot.')
    }

    const secondPokemon = emeraldSaveFile.boxes[1].pokemon[1]

    if (secondPokemon) {
      expect(secondPokemon.nickname).toBe('NIDORAN♂')
      expect(secondPokemon.trainerID).toBe(30706)
      expect(secondPokemon.trainerName).toBe('RoC')
    } else {
      fail('No Pokémon found in the second box, second slot.')
    }
  })
})
