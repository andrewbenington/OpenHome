import PB8LUMI from '@openhome-core/save/luminescentplatinum/PB8LUMI'
import { ConvertStrategies, ConvertStrategy, ExtraFormIndex, OriginGame } from '@pkm-rs/pkg'
import { PA8, PK3, PK4, PK7, PK8, PK9 } from '@pokemon-files/pkm'
import { HyperTrainStats, Stats } from '@pokemon-files/util'
import { getFormatLocationString } from '@pokemon-resources/locations'
import fs from 'fs'
import path from 'path'
import { assert, beforeAll, describe, expect, test } from 'vitest'
import { NationalDex } from '../../../../packages/pokemon-resources/src/consts/NationalDex'
import { OHPKM } from '../OHPKM'
import { initializeWasm } from './init'

beforeAll(initializeWasm)

describe('gen 3 conversion to OHPKM V2 and back is lossless', async () => {
  const files = fs
    .readdirSync(path.join(__dirname, 'PKMFiles', 'Gen3'))
    .filter((f) => f.endsWith('.pkm'))
  await initializeWasm()

  for (const file of files) {
    const bytes = new Uint8Array(fs.readFileSync(path.join(__dirname, 'PKMFiles', 'Gen3', file)))
    const original = PK3.fromBytes(bytes.buffer)
    original.refreshChecksum()

    const v2 = new OHPKM(original)
    test(`ohpkm v2 genders match - ${file}`, () => {
      assert(original.gender === v2.gender)
    })

    test(`ohpkm v2 game of origin match - ${file}`, () => {
      assert(original.gameOfOrigin === v2.gameOfOrigin)
    })

    const roundTrip = PK3.fromOhpkm(v2, ConvertStrategies.getDefault())

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

    const expectedBytes = new Uint8Array(original.toBytes())
    const actualBytes = new Uint8Array(roundTrip.toBytes())

    test(`bytes match - ${file}`, () => {
      if (!expectedBytes.every((v, i) => v === actualBytes[i])) {
        throw new Error(diffSpans(expectedBytes, actualBytes))
      }
    })
  }
})

describe('evolution and form change update ohpkm', async () => {
  test(`dialga form change updates OHPKM form`, () => {
    const dialgaBytes = new Uint8Array(
      fs.readFileSync(path.join(__dirname, 'PKMFiles', 'LA', 'dialga.pa8'))
    )

    const dialgaPa8 = PA8.fromBytes(dialgaBytes.buffer)
    expect(dialgaPa8.dexNum).toEqual(NationalDex.Dialga)

    const dialgaOhpkm = new OHPKM(dialgaPa8)

    expect(dialgaOhpkm.formeNum).toEqual(0)

    dialgaPa8.formeNum = 1 // origin forme

    dialgaOhpkm.syncWithGameData(dialgaPa8)
    expect(dialgaOhpkm.formeNum).toEqual(1)
  })

  test(`galar mr mime evolution updates OHPKM species/form`, () => {
    const mrMimeBytes = new Uint8Array(
      fs.readFileSync(path.join(__dirname, 'PKMFiles', 'Gen8', 'mr-mime-galar.pk8'))
    )

    const mrMimeGalarPk8 = PK8.fromBytes(mrMimeBytes.buffer)
    expect(mrMimeGalarPk8.dexNum).toEqual(NationalDex.MrMime)
    expect(mrMimeGalarPk8.formeNum).toEqual(1)

    const mrMimeOhpkm = new OHPKM(mrMimeGalarPk8)

    expect(mrMimeOhpkm.dexNum).toEqual(NationalDex.MrMime)
    expect(mrMimeOhpkm.formeNum).toEqual(1)

    // simulate evolution
    const mrRime = mrMimeGalarPk8
    mrRime.dexNum = NationalDex.MrRime
    mrRime.formeNum = 0

    mrMimeOhpkm.syncWithGameData(mrRime)
    expect(mrMimeOhpkm.dexNum).toEqual(NationalDex.MrRime)
    expect(mrMimeOhpkm.formeNum).toEqual(0)
  })
})

describe('plugin form persistence', () => {
  test('pluginForm survives OHPKM serialization', () => {
    const starter = new OHPKM(new Uint8Array())
    starter.pluginOrigin = 'luminescent_platinum'
    starter.extraFormIndex = ExtraFormIndex.GengarStitched

    const bytes = starter.toBytes()
    const again = OHPKM.fromBytes(bytes)
    expect(again.pluginOrigin).toEqual('luminescent_platinum')
    expect(again.extraFormIndex).toEqual(ExtraFormIndex.GengarStitched)
  })

  test('PB8LUMI → OHPKM → bytes → OHPKM → PB8LUMI roundtrip', () => {
    const stitchedGengarBytes = new Uint8Array(
      fs.readFileSync(
        path.join(__dirname, 'PKMFiles', 'rom-hack', 'luminescent', 'stitched-gengar.pb8lumi')
      )
    )

    const original = PB8LUMI.fromBytes(stitchedGengarBytes.buffer)

    expect(original.pluginOrigin).toEqual('luminescent_platinum')
    expect(original.dexNum).toEqual(NationalDex.Gengar)
    expect(original.extraFormIndex).toEqual(ExtraFormIndex.GengarStitched)

    const ohpkm = new OHPKM(original)
    expect(ohpkm.pluginOrigin).toEqual('luminescent_platinum')

    const lumi = PB8LUMI.fromOhpkm(ohpkm, ConvertStrategies.getDefault())
    expect(lumi.pluginOrigin).toEqual('luminescent_platinum')
    expect(lumi.extraFormIndex).toEqual(ExtraFormIndex.GengarStitched)

    const ohFromLumi = new OHPKM(lumi)
    const roundBytes = ohFromLumi.toBytes()
    const ohAgain = OHPKM.fromBytes(roundBytes)
    expect(ohAgain.pluginOrigin).toEqual('luminescent_platinum')
    expect(ohAgain.extraFormIndex).toEqual(ExtraFormIndex.GengarStitched)

    const lumi2 = PB8LUMI.fromOhpkm(ohAgain, ConvertStrategies.getDefault())
    expect(lumi2.extraFormIndex).toEqual(ExtraFormIndex.GengarStitched)
  })
})

function sanitizeWasmStats(fromWasm: Stats): Stats {
  return {
    hp: fromWasm.hp,
    atk: fromWasm.atk,
    def: fromWasm.def,
    spa: fromWasm.spa,
    spd: fromWasm.spd,
    spe: fromWasm.spe,
  }
}

function sanitizeWasmHyperTraining(fromWasm: HyperTrainStats): HyperTrainStats {
  return {
    hp: fromWasm.hp,
    atk: fromWasm.atk,
    def: fromWasm.def,
    spa: fromWasm.spa,
    spd: fromWasm.spd,
    spe: fromWasm.spe,
  }
}

describe('move filter', () => {
  const HYDRO_PUMP = 56
  const RAIN_DANCE = 240
  const AQUA_TAIL = 401
  const DRAGON_DANCE = 349

  const FOCUS_ENERGY = 116
  const CRUNCH = 242
  const HURRICANE = 542

  test('non-filtered moves have no gaps', () => {
    const ohpkm = OHPKM.defaultWithSpecies(NationalDex.Gyarados, 0)
    ohpkm.moves = [AQUA_TAIL, RAIN_DANCE, HYDRO_PUMP, DRAGON_DANCE]
    ohpkm.movePP = [10, 5, 5, 20]
    ohpkm.movePPUps = [1, 2, 3, 1]

    const pa8 = PA8.fromOhpkm(ohpkm, ConvertStrategies.getDefault())
    expect(pa8.moves).toEqual([AQUA_TAIL, HYDRO_PUMP, 0, 0])
    expect(pa8.movePP).toEqual([10, 5, 0, 0])
    expect(pa8.movePPUps).toEqual([1, 3, 0, 0])
  })

  test('if no moves are compatible, use level-up moves', () => {
    const ohpkm = OHPKM.defaultWithSpecies(NationalDex.Gyarados, 0)
    ohpkm.exp = 80000 // level 40 (slow level-up group)
    ohpkm.moves = [RAIN_DANCE, DRAGON_DANCE, 0, 0]
    ohpkm.movePP = [5, 20, 0, 0]
    ohpkm.movePPUps = [1, 2, 0, 0]

    const pa8 = PA8.fromOhpkm(ohpkm, ConvertStrategies.getDefault())
    expect(pa8.moves).toEqual([FOCUS_ENERGY, CRUNCH, AQUA_TAIL, HURRICANE])
    expect(pa8.movePP).toEqual([20, 10, 10, 5])
    expect(pa8.movePPUps).toEqual([0, 0, 0, 0])
  })

  test('no changes made if all moves are compatible', () => {
    const ohpkm = OHPKM.defaultWithSpecies(NationalDex.Gyarados, 0)
    ohpkm.moves = [AQUA_TAIL, RAIN_DANCE, HYDRO_PUMP, DRAGON_DANCE]
    ohpkm.movePP = [10, 5, 5, 20]
    ohpkm.movePPUps = [1, 2, 3, 1]

    const pk9 = PK9.fromOhpkm(ohpkm, ConvertStrategies.getDefault())
    expect(pk9.moves).toEqual([AQUA_TAIL, RAIN_DANCE, HYDRO_PUMP, DRAGON_DANCE])
    expect(pk9.movePP).toEqual([10, 5, 5, 20])
    expect(pk9.movePPUps).toEqual([1, 2, 3, 1])
  })
})

describe('OHPKM conversion strategies', () => {
  test('hyper training conversion strategy', () => {
    const PERFECT_IVS_STRATEGY: ConvertStrategy = {
      'ivs.maxIfHyperTrained': true,
    }
    const IGNORE_HYPER_TRAINING_STRATEGY: ConvertStrategy = {
      'ivs.maxIfHyperTrained': false,
    }
    const ORIGINAL_IVS = { hp: 10, atk: 10, def: 10, spa: 10, spd: 10, spe: 10 }
    const HYPER_TRAINING = { hp: true, atk: false, def: true, spa: false, spd: true, spe: false }
    const HYPER_TRAINED_IVS = { hp: 31, atk: 10, def: 31, spa: 10, spd: 31, spe: 10 }

    const original = OHPKM.defaultWithSpecies(NationalDex.Pikachu, 0)
    original.ivs = ORIGINAL_IVS
    original.hyperTraining = HYPER_TRAINING

    let pk3 = PK3.fromOhpkm(original, PERFECT_IVS_STRATEGY)
    expect(sanitizeWasmStats(pk3.ivs), 'PK3 IVs are maxed when hyper trained').toEqual(
      HYPER_TRAINED_IVS
    )
    pk3 = PK3.fromOhpkm(original, IGNORE_HYPER_TRAINING_STRATEGY)
    expect(
      sanitizeWasmStats(pk3.ivs),
      'PK3 IVs are unchanged when ignoring hyper training'
    ).toEqual(ORIGINAL_IVS)

    let pk8 = PK8.fromOhpkm(original, PERFECT_IVS_STRATEGY)
    expect(sanitizeWasmStats(pk8.ivs), 'PK8 IVs are preserved (perfect ivs strategy)').toEqual(
      ORIGINAL_IVS
    )
    expect(
      sanitizeWasmHyperTraining(pk8.hyperTraining),
      'PK8 hyper training status is preserved (perfect ivs strategy)'
    ).toEqual(HYPER_TRAINING)

    pk8 = PK8.fromOhpkm(original, IGNORE_HYPER_TRAINING_STRATEGY)
    expect(
      sanitizeWasmStats(pk8.ivs),
      'PK8 IVs are preserved (ignore hyper training strategy)'
    ).toEqual(ORIGINAL_IVS)
    expect(
      sanitizeWasmHyperTraining(pk8.hyperTraining),
      'PK8 hyper training status is preserved (ignore hyper training strategy)'
    ).toEqual(HYPER_TRAINING)
  })

  test('nickname capitalization conversion strategy', () => {
    const GAME_DEFAULT_STRATEGY: ConvertStrategy = {
      'nickname.capitalization': 'GameDefault',
    }
    const MODERN_STRATEGY: ConvertStrategy = {
      'nickname.capitalization': 'Modern',
    }

    const original = OHPKM.defaultWithSpecies(NationalDex.Pikachu, 0)
    expect(original.nickname).toEqual('Pikachu')

    let pk3 = PK3.fromOhpkm(original, GAME_DEFAULT_STRATEGY)
    expect(pk3.nickname, 'PK3 species name is capitalized').toEqual('PIKACHU')
    pk3 = PK3.fromOhpkm(original, MODERN_STRATEGY)
    expect(pk3.nickname, 'Modern capitalization is used').toEqual('Pikachu')

    let pk8 = PK8.fromOhpkm(original, GAME_DEFAULT_STRATEGY)
    expect(pk8.nickname, 'PK8 species name is title case (game default)').toEqual('Pikachu')
    pk8 = PK8.fromOhpkm(original, MODERN_STRATEGY)
    expect(pk8.nickname, 'PK8 species name is title case (modern)').toEqual('Pikachu')
  })

  const LEGALITY_STRATEGY: ConvertStrategy = {
    'metData.originAndLocation': 'MaximizeLegality',
  }
  const LOCATION_MATCH_STRATEGY: ConvertStrategy = {
    'metData.originAndLocation': 'UseLocationNameMatch',
  }

  test('met data conversion strategy', () => {
    const original = OHPKM.defaultWithSpecies(NationalDex.Pikachu, 0)
    original.gameOfOrigin = OriginGame.AlphaSapphire

    let pk4 = PK4.fromOhpkm(original, LOCATION_MATCH_STRATEGY)
    expect(
      pk4.gameOfOrigin,
      'Alpha Sapphire converted to Sapphire in PK4 (location match strategy)'
    ).toEqual(OriginGame.Sapphire)
    expect(
      getFormatLocationString(pk4.metLocationIndex, 'PK4'),
      'Alpha Sapphire -> PK4 location is Hoenn with location match strategy'
    ).toContain('Hoenn')

    pk4 = PK4.fromOhpkm(original, LEGALITY_STRATEGY)
    expect(
      pk4.gameOfOrigin,
      'Alpha Sapphire converted to Sapphire in PK4 (legality strategy)'
    ).toEqual(OriginGame.Sapphire)
    expect(
      getFormatLocationString(pk4.metLocationIndex, 'PK4'),
      'Alpha Sapphire -> PK4 location is Pal Park with legality strategy'
    ).toContain('Pal Park')
  })

  test('met data is preserved for original format', () => {
    const original = OHPKM.defaultWithSpecies(NationalDex.Pikachu, 0)
    original.gameOfOrigin = OriginGame.Diamond
    original.metLocationIndex = 6 // Jubilife City

    let pk4 = PK4.fromOhpkm(original, LEGALITY_STRATEGY)
    expect(pk4.gameOfOrigin, 'Diamond origin preserved (legality strategy)').toEqual(
      OriginGame.Diamond
    )
    expect(
      getFormatLocationString(pk4.metLocationIndex, 'PK4'),
      'Diamond -> Original location preserved with legality strategy'
    ).toContain('Jubilife City')

    pk4 = PK4.fromOhpkm(original, LOCATION_MATCH_STRATEGY)
    expect(pk4.gameOfOrigin, 'Diamond origin preserved (location match strategy)').toEqual(
      OriginGame.Diamond
    )
    expect(
      getFormatLocationString(pk4.metLocationIndex, 'PK4'),
      'Diamond -> Original location preserved with location match strategy'
    ).toContain('Jubilife City')
  })

  test('met data is preserved for transferrable format', () => {
    const original = OHPKM.defaultWithSpecies(NationalDex.Pikachu, 0)
    original.gameOfOrigin = OriginGame.OmegaRuby
    original.metLocationIndex = 280 // Granite Cave

    let pk7 = PK7.fromOhpkm(original, LEGALITY_STRATEGY)
    expect(pk7.gameOfOrigin, 'Omega Ruby origin preserved (legality strategy)').toEqual(
      OriginGame.OmegaRuby
    )
    expect(
      pk7.metLocationIndex,
      'Omega Ruby -> PK7 location index preserved with legality strategy'
    ).toBe(280)

    pk7 = PK7.fromOhpkm(original, LOCATION_MATCH_STRATEGY)
    expect(pk7.gameOfOrigin, 'Omega Ruby origin preserved (location match strategy)').toEqual(
      OriginGame.OmegaRuby
    )
    expect(
      getFormatLocationString(pk7.metLocationIndex, 'PK7'),
      'Omega Ruby -> PK7 location index is Hoenn with location match strategy'
    ).toContain('Hoenn')
  })
})

describe('gen 3 ability during OHPKM conversion', () => {
  test('2nd ability is left alone if present in gen 3', () => {
    const withShellArmorBytes = new Uint8Array(
      fs.readFileSync(path.join(__dirname, 'PKMFiles', 'OhpkmV2', 'crawdaunt-shell-armor.ohpkm'))
    )
    const withShellArmor = OHPKM.fromBytes(withShellArmorBytes.buffer)
    expect(withShellArmor.abilityNum).toEqual(2)

    const shellArmorkpk3 = PK3.fromOhpkm(withShellArmor, ConvertStrategies.getDefault())

    expect(shellArmorkpk3.abilityNum, 'Shell Armor: Expected ability num from PID').toEqual(2)
    expect(shellArmorkpk3.ability?.index).toEqual(75) // Shell Armor

    withShellArmor.syncWithGameData(shellArmorkpk3)
    expect(withShellArmor.abilityNum, 'Ability num should not be updated from PK3').toEqual(2)
    expect(
      withShellArmor.abilityIndex.index,
      'Ability index should not be updated from PK3'
    ).toEqual(75)
  })
})

function diffSpans(
  a: Uint8Array,
  b: Uint8Array,
  radix = 16,
  expected = 'expected',
  actual = 'actual'
): string {
  const len = Math.max(a.length, b.length)
  let i = 0

  function hex(n: number) {
    return n.toString(16).padStart(2, '0')
  }

  let out = ''

  while (i < len) {
    if (a[i] === b[i]) {
      i++
      continue
    }

    const start = i
    while (i < len && a[i] !== b[i]) i++
    const end = i - 1

    const aHex = []
    const bHex = []

    for (let j = start; j <= end; j++) {
      aHex.push(a[j] !== undefined ? hex(a[j]) : '--')
      bHex.push(b[j] !== undefined ? hex(b[j]) : '--')
    }

    const prefix = radix === 16 ? '0x' : ''
    out += `Mismatch ${prefix}${start.toString(radix)}-${prefix}${end.toString(radix)} (len=${end - start + 1})\n`
    out += `  ${expected}: ${aHex.join(' ')}\n`
    out += `  ${actual}: ${bHex.join(' ')}\n\n`
  }

  if (out === '') {
    return 'No differences found (arrays match).'
  }

  return out.trim()
}
