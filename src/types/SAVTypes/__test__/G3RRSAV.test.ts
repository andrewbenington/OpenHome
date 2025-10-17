import { fail } from 'assert'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { PokemonData } from 'pokemon-species-data'
import { beforeAll, describe, expect, test } from 'vitest'
import { OHPKM } from '../../pkm/OHPKM'
import { PathData } from '../path'
import { G3RRSAV } from '../radicalred/G3RRSAV'

// function display_mon(mon: PK3RR | OHPKM) {
//   console.log('Boxmon:', {
//     nickname: mon.nickname,
//     // level: firstPokemon.level,
//     trainerName: mon.trainerName,
//     // trainerID: firstPokemon.trainerID,
//     heldItemIndex: mon.heldItemIndex,
//     languageIndex: mon.languageIndex,
//     dexNum: mon.dexNum,
//     formeNum: mon.formeNum,
//     moves: mon.moves,
//     gameOfOrigin: mon.gameOfOrigin,
//     species: PokemonData[mon.dexNum].name,
//   })
// }

describe('G3RRSAV - Radical Red Save File Read Test', () => {
  let radicalRedSave: G3RRSAV
  let saveBytes: Uint8Array

  beforeAll(() => {
    const savePath = resolve(__dirname, 'SAVFiles/radicalred.sav')

    saveBytes = new Uint8Array(readFileSync(savePath))

    const parsedPath: PathData = {
      raw: 'SAVFiles/radicalred.sav',
      name: 'radical red',
      dir: 'SAVFiles',
      ext: '.sav',
      separator: '/',
    }

    radicalRedSave = new G3RRSAV(parsedPath, saveBytes)
  })

  test('should load initial save data correctly', () => {
    expect(radicalRedSave.name).toBe('Radical')
  })

  test('should print the first Pokémon in the first box', () => {
    const firstPokemon = radicalRedSave.boxes[0].pokemon[0]

    if (firstPokemon) {
      // display_mon(firstPokemon)

      expect(firstPokemon.nickname).toBe('Von')
      expect(firstPokemon.trainerID).toBe(10334)
      expect(firstPokemon.trainerName).toBe('Radical')
      expect(firstPokemon.moves[0]).toBe(33) // Tackle
      expect(firstPokemon.moves[1]).toBe(336) // Howl
      expect(firstPokemon.dexNum).toBe(261)
      expect(PokemonData[firstPokemon.dexNum].name).toBe('Poochyena')
    } else {
      fail('No Pokémon found in the first box, first slot.')
    }

    const secondPokemon = radicalRedSave.boxes[1].pokemon[1]

    if (secondPokemon) {
      // display_mon(secondPokemon)

      expect(secondPokemon.nickname).toBe('Cin')
      expect(secondPokemon.trainerID).toBe(10334)
      expect(secondPokemon.trainerName).toBe('Radical')
    } else {
      fail('No Pokémon found in the second box, second slot.')
    }

    const sevii_lokix = radicalRedSave.boxes[0].pokemon[3]

    if (sevii_lokix) {
      // display_mon(sevii_lokix)

      expect(sevii_lokix.nickname).toBe('Lokix')
      expect(sevii_lokix.trainerID).toBe(10334)
      expect(sevii_lokix.trainerName).toBe('Radical')
    } else {
      fail('Sevii Lokix not found.')
    }

    const lastpokemon = radicalRedSave.boxes[0].pokemon[29]

    if (lastpokemon) {
      // display_mon(lastpokemon)

      expect(lastpokemon.nickname).toBe('Crabrawler')
      expect(lastpokemon.trainerID).toBe(10334)
      expect(lastpokemon.trainerName).toBe('Radical')
    } else {
      fail('No Pokémon found in the second box, second slot.')
    }

    const slowbroG = radicalRedSave.boxes[1].pokemon[5]

    if (slowbroG) {
      // display_mon(slowbroG)

      expect(slowbroG.nickname).toBe('Nobo')
      expect(slowbroG.trainerID).toBe(10334)
      expect(slowbroG.trainerName).toBe('Radical')
    } else {
      fail('No Pokémon found in the second box, second slot.')
    }
  })
})

describe('G3RRSAV - Radical Red Save File Write Test', () => {
  let radicalRedSave: G3RRSAV
  let saveBytes: Uint8Array

  beforeAll(() => {
    const savePath = resolve(__dirname, 'SAVFiles/radicalred.sav')

    saveBytes = new Uint8Array(readFileSync(savePath))

    const parsedPath: PathData = {
      raw: 'SAVFiles/radicalred.sav',
      name: 'radical red',
      dir: 'SAVFiles',
      ext: '.sav',
      separator: '/',
    }

    radicalRedSave = new G3RRSAV(parsedPath, saveBytes)
    const firstMon = radicalRedSave.boxes[0].pokemon[0]

    if (firstMon) {
      const newMon = new OHPKM(firstMon)

      newMon.nickname = 'ModTest'
      radicalRedSave.boxes[0].pokemon[0] = newMon
      // radicalRedSave.boxes[0].pokemon[0].heldItemIndex = 123;
      // radicalRedSave.boxes[0].pokemon[0].moves[0] = 101;

      radicalRedSave.updatedBoxSlots.push({ box: 0, index: 0 })
      radicalRedSave.prepareBoxesAndGetModified()
    }
  })

  test('should modify a Pokémon and save changes to a new file', () => {
    // Modify the nickname, held item, or other properties of the first Pokémon in the first box

    if (radicalRedSave.boxes[0].pokemon[0]) {
      const newSavePath = resolve(__dirname, 'SAVFiles/radicalred_modified.sav')

      writeFileSync(newSavePath, radicalRedSave.bytes)

      const fileExists = existsSync(newSavePath)

      expect(fileExists).toBe(true)
    } else {
      fail('No Pokémon found in the first box, first slot.')
    }
  })

  test('should check if modifications were made', () => {
    const parsedPath: PathData = {
      raw: 'SAVFiles/radicalred_modified.sav',
      name: 'radical red',
      dir: 'SAVFiles',
      ext: '.sav',
      separator: '/',
    }

    const newSavePath = resolve(__dirname, 'SAVFiles/radicalred_modified.sav')
    const fileExists = existsSync(newSavePath)

    expect(fileExists).toBe(true)

    const modifiedSaveBytes = new Uint8Array(readFileSync(newSavePath))
    const modifiedRadicalRedSave = new G3RRSAV(parsedPath, modifiedSaveBytes)

    expect(modifiedRadicalRedSave.boxes[0].pokemon[0]?.nickname).toBe('ModTest')
  })
})
