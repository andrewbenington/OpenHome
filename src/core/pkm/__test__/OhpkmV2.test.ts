import { bytesToPKM } from '@openhome-core/pkm/FileImport'
import { PA8, PK3, PK8 } from '@pokemon-files/pkm'
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
    const original = bytesToPKM(bytes, 'PK3') as PK3
    original.refreshChecksum()

    const v2 = new OHPKM(original)
    test(`ohpkm v2 genders match - ${file}`, () => {
      assert(original.gender === v2.gender)
    })

    const roundTrip = new PK3(v2)
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

    const dialgaPa8 = new PA8(dialgaBytes.buffer)
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

    const mrMimeGalarPk8 = new PK8(mrMimeBytes.buffer)
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
