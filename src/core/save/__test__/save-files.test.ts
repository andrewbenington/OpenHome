import { R } from '@openhome-core/util/functional'
import { ConvertStrategies } from '@pkm-rs/pkg'
import { PK7 } from '@pokemon-files/pkm'
import { fail } from 'assert'
import fs, { readFileSync } from 'fs'
import path, { resolve } from 'path'
import { OHPKM } from 'src/core/pkm/OHPKM'
import { beforeAll, describe, expect, test } from 'vitest'
import { BW2SAV } from '../BW2SAV'
import { BWSAV } from '../BWSAV'
import { DPSAV } from '../DPSAV'
import { G1SAV } from '../G1SAV'
import { G2SAV } from '../G2SAV'
import { G3SAV } from '../G3SAV'
import { Gen7AlolaSave } from '../Gen7AlolaSave'
import { LASAV } from '../Gen89/LASAV'
import { SwShSAV } from '../Gen89/SwShSAV'
import { HGSSSAV } from '../HGSSSAV'
import { ORASSAV } from '../ORASSAV'
import { PtSAV } from '../PtSAV'
import { G3RRSAV } from '../radicalred/G3RRSAV'
import { G3UBSAV } from '../unbound/G3UBSAV'
import { buildUnknownSaveFile } from '../util/load'
import { emptyPathData, PathData } from '../util/path'
import { XYSAV } from '../XYSAV'
import { initializeWasm } from './init'

beforeAll(initializeWasm)

const saveTypesByFilename = {
  'crystal.sav': 'Crystal',
  'ruby.sav': 'Ruby',
  'sapphire.sav': 'Sapphire',
  'emerald.sav': 'Emerald',
  'firered.sav': 'FireRed',
  'radicalred.sav': 'Radical Red',
  'unbound.sav': 'Unbound',
  'black.sav': 'Black',
  'white.sav': 'White',
  ultrasun: 'Ultra Sun',
  sword: 'Sword',
  legendsarceus: 'Legends: Arceus',
}

const allSaveTypes = [
  G1SAV,
  G2SAV,
  G3SAV,
  G3RRSAV,
  G3UBSAV,
  DPSAV,
  PtSAV,
  HGSSSAV,
  BWSAV,
  BW2SAV,
  XYSAV,
  ORASSAV,
  Gen7AlolaSave,
  SwShSAV,
  LASAV,
]

describe('Save file detection - single possibility', () => {
  for (const [fileName, gameName] of Object.entries(saveTypesByFilename)) {
    test(`${fileName} should be Pokémon ${gameName}`, () => {
      const result = buildUnknownSaveFile(
        emptyPathData,
        new Uint8Array(fs.readFileSync(path.join(__dirname, 'save-files', fileName))),
        allSaveTypes
      )

      if (R.isErr(result)) {
        throw new Error(result.err)
      }

      const saveFile = result.value

      expect(saveFile?.gameName).toBe(gameName)
    })
  }
})

describe('Handler trainers', () => {
  let ultraSunSave: Gen7AlolaSave
  let emeraldSave: G3SAV
  let saveBytes: Uint8Array

  beforeAll(() => {
    const savePath = resolve(__dirname, 'save-files/ultrasun')

    saveBytes = new Uint8Array(readFileSync(savePath))

    const parsedPath: PathData = {
      raw: 'save-files/ultrasun',
      name: 'ultrasun',
      dir: 'save-files',
      ext: '',
      separator: '/',
    }

    ultraSunSave = new Gen7AlolaSave(parsedPath, saveBytes)

    emeraldSave = new G3SAV(
      emptyPathData,
      readFileSync(path.join(__dirname, 'save-files', 'emerald.sav'))
    )

    if (emeraldSave === undefined) {
      fail(`Failed to build save file: got undefined`)
      return
    }
  })

  test('handler trainer data is preserved through OHPKM', () => {
    const pk3 = emeraldSave.getMonAt(5, 0)
    if (!pk3) {
      fail('No PK3 found in Emerald save at box 0 slot 0')
    }

    expect(pk3.trainerID).toBe(emeraldSave.tid)
    const original = OHPKM.fromMonInSave(pk3, emeraldSave)

    // Trade to Ultra Sun
    original.tradeToSave(ultraSunSave)
    // Ultra Sun trainer should be in handlers list
    expect(original.handlers.map((h) => h.id)).toContain(ultraSunSave.tid)
    expect(original.handlerName).toBe(ultraSunSave.name)
    expect(original.isCurrentHandler).toBeTruthy()

    // Ultra Sun trainer should be in handlers list
    const pk7 = PK7.fromOhpkm(original, ConvertStrategies.getDefault())
    expect(pk7.handlerName).toBe(ultraSunSave.name)
    expect(pk7.isCurrentHandler).toBeTruthy()

    // Trade back to Emerald
    original.tradeToSave(emeraldSave)
    expect(original.handlerName).toBe('')
    expect(original.handlerAffection).toBe(0)
    expect(original.handlerFriendship).toBe(0)
    expect(original.isCurrentHandler).toBe(false)
  })
})
