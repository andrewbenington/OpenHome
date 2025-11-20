import { PK3 } from '@pokemon-files/pkm'
import fs from 'fs'
import path from 'path'
import { beforeAll, describe, expect, test } from 'vitest'
import { bytesToPKM } from '../../FileImport'
import { OHPKM } from '../OHPKM'
import OhpkmV2 from '../OhpkmV2'
import { initializeWasm } from './init'

beforeAll(initializeWasm)

var blazikenPk3: PK3
var blazikenPk3Bytes: Uint8Array

beforeAll(() => {
  blazikenPk3Bytes = new Uint8Array(
    fs.readFileSync(path.join(__dirname, './PKMFiles/Gen3', 'blaziken.pkm'))
  )

  blazikenPk3 = bytesToPKM(blazikenPk3Bytes, 'PK3') as PK3
})

test('gen 3 conversion to OHPKM V2 and back is lossless', () => {
  const ohPKM = new OhpkmV2(blazikenPk3)
  const gen3PKM = new PK3(ohPKM)
  gen3PKM.refreshChecksum()

  expect(new Uint8Array(blazikenPk3.toBytes())).toEqual(new Uint8Array(gen3PKM.toBytes()))
})

// test('OHPKM V1 conversion to OHPKM V2 and back is lossless', () => {
//   const v2 = new OhpkmV2(slowpokeOhpkm)
//   const ohpkm = new OHPKM(v2)

//   expect(new Uint8Array(slowpokeOhpkm.toBytes())).toEqual(new Uint8Array(ohpkm.toBytes()))
// })

describe('OHPKM V1 → V2 → V1 is lossless', () => {
  const files = fs
    .readdirSync(path.join(__dirname, 'PKMFiles', 'OH'))
    .filter((f) => f.endsWith('.ohpkm'))

  for (const file of files) {
    test(file, () => {
      const bytes = new Uint8Array(fs.readFileSync(path.join(__dirname, 'PKMFiles', 'OH', file)))
      const original = bytesToPKM(bytes, 'OHPKM') as OHPKM
      original.fixErrors()
      original.homeTracker = new Uint8Array(8)

      const v2 = new OhpkmV2(original)
      const roundTrip = new OHPKM(v2)

      const expected = new Uint8Array(original.toBytes())
      const actual = new Uint8Array(roundTrip.toBytes())

      zeroOutRanges(expected, actual, [AbsoluteWeightHeight])

      if (!expected.every((v, i) => v === actual[i])) {
        throw new Error(diffSpans(expected, actual))
      }
    })
  }
})

function diffSpans(a: Uint8Array, b: Uint8Array): string {
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

    out += `Mismatch 0x${start.toString(16)}-0x${end.toString(16)} (len=${end - start + 1})\n`
    out += `  expected: ${aHex.join(' ')}\n`
    out += `  actual:   ${bHex.join(' ')}\n\n`
  }

  if (out === '') {
    return 'No differences found (arrays match).'
  }

  return out.trim()
}
const AbsoluteWeightHeight: [number, number] = [0xac, 0xb3]

function zeroOutRanges(a: Uint8Array, b: Uint8Array, ignoreRanges: Array<[number, number]>) {
  for (const [start, end] of ignoreRanges) {
    for (let i = start; i <= end; i++) {
      if (i < a.length) a[i] = 0
      if (i < b.length) b[i] = 0
    }
  }
}
