import { R } from '@openhome-core/util/functional'
import { getDefaultConvertStrategy } from '@pkm-rs/pkg'
import fs from 'fs'
import { assert } from 'node:console'
import { TextDecoder } from 'node:util' // (ESM style imports)
import path from 'path'
import { beforeAll, expect, test } from 'vitest'
import { OHPKM } from '../OHPKM'
import PK1 from '../PK1'
import { initializeWasm } from './init'
;(global as any).TextDecoder = TextDecoder

beforeAll(initializeWasm)

function pkmTestFilePath(...pathElements: string[]): string {
  return path.join(__dirname, 'pkm-files', ...pathElements)
}

function pkmTestFileBytes(...pathElements: string[]): Uint8Array<ArrayBuffer> {
  return new Uint8Array(fs.readFileSync(pkmTestFilePath(...pathElements)))
}

test('gen 1 transfer shininess preserved', () => {
  const ohpkm = OHPKM.fromBytes(pkmTestFileBytes('ohpkm', 'pidgey-shiny.ohpkm').buffer)

  expect(ohpkm.isShiny()).toBe(true)

  const pk1 = R.assert(PK1.fromOhpkm(ohpkm, getDefaultConvertStrategy()))
  expect(pk1.isShiny()).toBe(true)
})

test('mons with the same species and trainer but different DVs are given differen PIDs', () => {
  const clefairy1 = PK1.fromBytes(pkmTestFileBytes('pk1', 'CLEFAIRY1.pk1').buffer)
  const clefairy2 = PK1.fromBytes(pkmTestFileBytes('pk1', 'CLEFAIRY2.pk1').buffer)

  assert(clefairy1.trainerID === clefairy2.trainerID)
  assert(clefairy1.trainerName === clefairy2.trainerName)

  assert(clefairy1.dvs.hp !== clefairy2.dvs.hp) // just checking one to make sure the DVs arent identical

  expect(OHPKM.fromMonUnknownSave(clefairy1).personalityValue).not.toBe(
    OHPKM.fromMonUnknownSave(clefairy2).personalityValue
  )
})
