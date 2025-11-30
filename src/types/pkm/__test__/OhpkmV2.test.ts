import { PK3 } from '@pokemon-files/pkm'
import fs from 'fs'
import path from 'path'
import { assert, beforeAll, describe, test } from 'vitest'
import { bytesToPKM } from '../../FileImport'
import { OHPKM } from '../OHPKM'
import { OhpkmV1 } from '../OhpkmV1'
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

describe('OHPKM V1 → V2 → V1 is lossless', () => {
  const files = fs
    .readdirSync(path.join(__dirname, 'PKMFiles', 'OH'))
    .filter((f) => f.endsWith('.ohpkm'))

  for (const file of files) {
    test(file, () => {
      const bytes = new Uint8Array(fs.readFileSync(path.join(__dirname, 'PKMFiles', 'OH', file)))

      const original = bytesToPKM(bytes, 'OhpkmV1') as OhpkmV1
      original.fixErrors()

      const v2 = new OHPKM(original)
      const roundTrip = new OhpkmV1(v2)

      const expected = new Uint8Array(original.toBytes())
      const actual = new Uint8Array(roundTrip.toBytes())

      zeroOutRanges(expected, actual, [AbsoluteWeightHeight, UnknownBytesRange, HandlerMemory])

      if (!expected.every((v, i) => v === actual[i])) {
        throw new Error(diffSpans(expected, actual))
      }
    })
  }
})

describe('OHPKM V1 WASM → V2 → V1 is lossless', async () => {
  await initializeWasm()

  const files = fs
    .readdirSync(path.join(__dirname, 'PKMFiles', 'OH'))
    .filter((f) => f.endsWith('.ohpkm'))

  for (const file of files) {
    const bytes = new Uint8Array(fs.readFileSync(path.join(__dirname, 'PKMFiles', 'OH', file)))
    const original = bytesToPKM(bytes, 'OhpkmV1') as OhpkmV1
    original.fixErrors()

    const v2FromV1Wasm = OHPKM.fromV1Wasm(original)
    const v2FromJs = new OHPKM(original)

    test(`pids match - ${file}`, () => {
      if (v2FromV1Wasm.personalityValue !== v2FromJs.personalityValue) {
        throw new Error(
          `PID mismatch: wasm=${v2FromV1Wasm.personalityValue} js=${v2FromJs.personalityValue}`
        )
      }
    })

    const bytesPerSectionWasm = v2FromV1Wasm.getSectionBytes() as Record<string, Uint8Array>
    const bytesPerSectionJs = v2FromJs.getSectionBytes() as Record<string, Uint8Array>

    for (const tag of Object.keys(bytesPerSectionJs) as Array<keyof typeof bytesPerSectionJs>) {
      const wasmBytes = bytesPerSectionWasm[tag]
      const jsBytes = bytesPerSectionJs[tag]

      if (!wasmBytes) {
        throw new Error(`Section ${tag} missing from WASM version`)
      }

      if (wasmBytes.length !== jsBytes.length) {
        throw new Error(
          `Section ${tag} length mismatch: WASM=${wasmBytes.length} JS=${jsBytes.length}`
        )
      }

      zeroOutRanges(jsBytes, wasmBytes, [AbsoluteWeightHeight, UnknownBytesRange, HandlerMemory])

      test(`${tag} bytes match - ${file}`, () => {
        if (!jsBytes.every((v, i) => v === wasmBytes[i])) {
          throw new Error(
            diffSpans(
              wasmBytes,
              jsBytes,
              10,
              'OHPKM.ts -> fromV1Wasm() -> from_v1_bytes  ',
              'OHPKM.ts -> new OhpkmV2()                  '
            )
          )
        }
      })
    }
  }
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
const AbsoluteWeightHeight: [number, number] = [0xac, 0xb3]
const UnknownBytesRange: [number, number] = [0x97, 0x97]
const HandlerMemory: [number, number] = [0xd9, 0xdd]

function zeroOutRanges(a: Uint8Array, b: Uint8Array, ignoreRanges: Array<[number, number]>) {
  for (const [start, end] of ignoreRanges) {
    for (let i = start; i <= end; i++) {
      if (i < a.length) a[i] = 0
      if (i < b.length) b[i] = 0
    }
  }
}
