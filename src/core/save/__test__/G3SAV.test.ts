import { R } from '@openhome-core/util/functional'
import { SpeciesLookup } from '@pkm-rs/pkg'
import { fail } from 'assert'
import fs from 'fs'
import path from 'path'
import { describe, expect, test } from 'vitest'
import { G3SAV } from '../G3SAV'
import { buildUnknownSaveFile } from '../util/load'
import { emptyPathData } from '../util/path'
import { initializeWasm } from './init'

describe('G3SAV - Gen 3 Save File Read Test', async () => {
  await initializeWasm()

  const result = buildUnknownSaveFile(
    emptyPathData,
    new Uint8Array(fs.readFileSync(path.join(__dirname, 'save-files', 'emerald.sav'))),

    [G3SAV]
  )

  if (!R.isOk(result)) {
    fail(`Failed to build save file: ${result.err}`)
    return
  }

  const emeraldSaveFile = result.value

  if (emeraldSaveFile === undefined) {
    fail(`Failed to build save file: got undefined`)
    return
  }

  test('should load initial save data correctly', () => {
    expect(emeraldSaveFile.name).toBe('RoC')
  })

  test('should print the first Pokémon in the first box', () => {
    const firstPokemon = emeraldSaveFile.boxes[0].boxSlots[0]

    if (firstPokemon) {
      // display_mon(firstPokemon)

      expect(firstPokemon.nickname).toBe('BULBASAUR')
      expect(firstPokemon.trainerID).toBe(56345)
      expect(firstPokemon.trainerName).toBe('RoC')
      expect(firstPokemon.moves[0]).toBe(33) // Tackle
      expect(firstPokemon.moves[1]).toBe(45) // Growl
      expect(firstPokemon.dexNum).toBe(1)
      expect(firstPokemon.exp).toBe(135)
      expect(SpeciesLookup(firstPokemon.dexNum)?.name).toBe('Bulbasaur')
    } else {
      fail('No Pokémon found in the first box, first slot.')
    }

    const secondPokemon = emeraldSaveFile.boxes[1].boxSlots[1]

    if (secondPokemon) {
      expect(secondPokemon.nickname).toBe('NIDORAN♂')
      expect(secondPokemon.trainerID).toBe(30706)
      expect(secondPokemon.trainerName).toBe('RoC')
    } else {
      fail('No Pokémon found in the second box, second slot.')
    }
  })
})
