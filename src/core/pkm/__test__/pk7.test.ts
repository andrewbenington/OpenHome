import { PK3, PK4, PK5, PK7 } from '@openhome-core/pkm'
import {
  BW2_TRANSFER_RESTRICTIONS,
  GEN3_TRANSFER_RESTRICTIONS,
  HGSS_TRANSFER_RESTRICTIONS,
} from '@openhome-core/resources/consts/TransferRestrictions'
import { isRestricted } from '@openhome-core/save/util/TransferRestrictions'
import { R } from '@openhome-core/util/functional'
import { getDefaultConvertStrategy } from '@pkm-rs/pkg/pkm_rs'
import fs from 'fs'
import { TextDecoder } from 'node:util' // (ESM style imports)
import path from 'path'
import { beforeAll, describe, test } from 'vitest'
import { getMonGen345Identifier } from '../Lookup'
import { OHPKM } from '../OHPKM'
import { initializeWasm } from './init'
;(global as any).TextDecoder = TextDecoder

beforeAll(initializeWasm)

function pkmTestFilePath(...pathElements: string[]): string {
  return path.join(__dirname, 'pkm-files', ...pathElements)
}

describe('convert to gen 3 and back keeps 345 id', async () => {
  const files = fs.readdirSync(pkmTestFilePath('pk7')).filter((f) => f.endsWith('.pk7'))
  await initializeWasm()

  for (const file of files) {
    const bytes = new Uint8Array(fs.readFileSync(pkmTestFilePath('pk7', file)))
    const original = PK7.fromBytes(bytes.buffer)
    if (isRestricted(GEN3_TRANSFER_RESTRICTIONS, original.nationalDex, original.formIndex)) {
      continue
    }

    const ohpkm = OHPKM.fromMonUnknownSave(original)
    const pk3 = R.assert(PK3.fromOhpkm(ohpkm, getDefaultConvertStrategy()))

    test(`OHPKM and PK4 gen 3/4/5 id matches - ${file}`, () => {
      if (getMonGen345Identifier(ohpkm) !== getMonGen345Identifier(pk3)) {
        throw new Error(
          `Gen 3/4/5 identifier mismatch: OHPKM=${getMonGen345Identifier(ohpkm)} PK3=${getMonGen345Identifier(pk3)}`
        )
      }
    })
  }
})

describe('convert to gen 4 and back keeps 345 id', async () => {
  const files = fs.readdirSync(pkmTestFilePath('pk7')).filter((f) => f.endsWith('.pk7'))
  await initializeWasm()

  for (const file of files) {
    const bytes = new Uint8Array(fs.readFileSync(pkmTestFilePath('pk7', file)))
    const original = PK7.fromBytes(bytes.buffer)
    if (isRestricted(HGSS_TRANSFER_RESTRICTIONS, original.nationalDex, original.formIndex)) {
      continue
    }

    const ohpkm = OHPKM.fromMonUnknownSave(original)
    const pk4 = R.assert(PK4.fromOhpkm(ohpkm, getDefaultConvertStrategy()))

    test(`OHPKM and PK4 gen 3/4/5 id matches - ${file}`, () => {
      if (getMonGen345Identifier(ohpkm) !== getMonGen345Identifier(pk4)) {
        throw new Error(
          `Gen 3/4/5 identifier mismatch: OHPKM=${getMonGen345Identifier(ohpkm)} PK4=${getMonGen345Identifier(pk4)}`
        )
      }
    })
  }
})

describe('convert to gen 5 and back keeps 345 id', async () => {
  const files = fs.readdirSync(pkmTestFilePath('pk7')).filter((f) => f.endsWith('.pk7'))
  await initializeWasm()

  for (const file of files) {
    const bytes = new Uint8Array(fs.readFileSync(pkmTestFilePath('pk7', file)))
    const original = PK7.fromBytes(bytes.buffer)
    if (isRestricted(BW2_TRANSFER_RESTRICTIONS, original.nationalDex, original.formIndex)) {
      continue
    }

    const ohpkm = OHPKM.fromMonUnknownSave(original)
    const pk5 = R.assert(PK5.fromOhpkm(ohpkm, getDefaultConvertStrategy()))

    test(`OHPKM and PK5 gen 3/4/5 id matches - ${file}`, () => {
      if (getMonGen345Identifier(ohpkm) !== getMonGen345Identifier(pk5)) {
        throw new Error(
          `Gen 3/4/5 identifier mismatch: OHPKM=${getMonGen345Identifier(ohpkm)} PK5=${getMonGen345Identifier(pk5)}`
        )
      }
    })
  }
})
