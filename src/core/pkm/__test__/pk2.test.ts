import { G2SAV } from '@openhome-core/save/G2SAV'
import { emptyPathData } from '@openhome-core/save/util/path'
import { R } from '@openhome-core/util/functional'
import { getDefaultConvertStrategy } from '@pkm-rs/pkg'
import fs from 'fs'
import { TextDecoder } from 'node:util' // (ESM style imports)
import path from 'path'
import { assert, beforeAll, describe, expect, test } from 'vitest'
import { OHPKM } from '../OHPKM'
import PK2 from '../PK2'
import { initializeWasm } from './init'
;(global as any).TextDecoder = TextDecoder

beforeAll(initializeWasm)

function saveTestFilePath(dir: string, filename: string): string {
  return path.join(__dirname, 'save-files', dir, filename)
}

function pkmTestFilePath(dir: string, filename: string): string {
  return path.join(__dirname, 'pkm-files', dir, filename)
}

describe('gen 2 shininess preserved', () => {
  test('pk2 -> ohpkm', () => {
    const saveBytes = fs.readFileSync(saveTestFilePath('gen2', 'crystal-shinies.sav'))
    const save = new G2SAV(emptyPathData, new Uint8Array(saveBytes))

    const mon = save.getMonAt(0, 0)
    assert(mon !== undefined)

    expect(mon.isShiny()).toBe(true)

    const ohpkm = OHPKM.fromMonInSave(mon, save)

    expect(ohpkm.dvs).toStrictEqual(mon.dvs)
    expect(ohpkm.isShiny()).toBe(true)
  })

  test('ohpkm -> pk2', () => {
    const ohpkm = OHPKM.fromBytes(
      new Uint8Array(fs.readFileSync(pkmTestFilePath('ohpkm', 'pidgey-shiny.ohpkm'))).buffer
    )

    expect(ohpkm.isShiny()).toBe(true)

    const pk2 = R.assert(PK2.fromOhpkm(ohpkm, getDefaultConvertStrategy()))
    expect(pk2.isShiny()).toBe(true)
  })

  test('unown ohpkm -> pk2 preserves shiny and unown form when possible', () => {
    const ohpkm = OHPKM.fromBytes(
      new Uint8Array(fs.readFileSync(pkmTestFilePath('ohpkm', 'unown-v-shiny.ohpkm'))).buffer
    )

    expect(ohpkm.isShiny()).toBe(true)

    const pk2 = R.assert(PK2.fromOhpkm(ohpkm, getDefaultConvertStrategy()))
    expect(pk2.isShiny()).toBe(true)
  })
})
