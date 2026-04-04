import PB8LUMI from '@openhome-core/save/luminescentplatinum/PB8LUMI'
import { ConvertStrategies, ConvertStrategy, ExtraFormIndex } from '@pkm-rs/pkg'
import { PA8, PK3, PK8 } from '@pokemon-files/pkm'
import { HyperTrainStats, Stats } from '@pokemon-files/util'
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
