import * as E from 'fp-ts/lib/Either'
import fs from 'fs'
import path from 'path'
import { describe, expect, test } from 'vitest'
import { BW2SAV } from '../BW2SAV'
import { BWSAV } from '../BWSAV'
import { DPSAV } from '../DPSAV'
import { G1SAV } from '../G1SAV'
import { G2SAV } from '../G2SAV'
import { G3SAV } from '../G3SAV'
import { LASAV } from '../Gen89/LASAV'
import { SwShSAV } from '../Gen89/SwShSAV'
import { HGSSSAV } from '../HGSSSAV'
import { buildUnknownSaveFile } from '../load'
import { ORASSAV } from '../ORASSAV'
import { emptyPathData } from '../path'
import { PtSAV } from '../PtSAV'
import { G3RRSAV } from '../radicalred/G3RRSAV'
import { SMSAV } from '../SMSAV'
import { G3UBSAV } from '../unbound/G3UBSAV'
import { USUMSAV } from '../USUMSAV'
import { XYSAV } from '../XYSAV'

const files = {
  'crystal.sav': 'Crystal',
  'ruby.sav': 'Ruby',
  'sapphire.sav': 'Sapphire',
  'emerald.sav': 'Emerald',
  'radicalred.sav': 'Radical Red',
  'black.sav': 'Black',
  'white.sav': 'White',
  ultrasun: 'Ultra Sun',
  sword: 'Sword',
  legendsarceus: 'Legends Arceus',
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
  SMSAV,
  USUMSAV,
  SwShSAV,
  LASAV,
]

describe('Save file detection', () => {
  for (const [fileName, gameName] of Object.entries(files)) {
    test(`${fileName} should be Pokémon ${gameName}`, () => {
      const result = buildUnknownSaveFile(
        emptyPathData,
        new Uint8Array(fs.readFileSync(path.join(__dirname, 'SAVFiles', fileName))),
        {},
        allSaveTypes
      )

      if (E.isLeft(result)) {
        throw new Error(result.left)
      }

      const saveFile = result.right

      expect(saveFile?.gameName).toBe(gameName)
    })
  }
})
