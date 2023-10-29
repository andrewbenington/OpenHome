import fs from 'fs'
import { TextDecoder } from 'node:util' // (ESM style imports)
import path from 'path'
import { bytesToPKM } from '../../../util/FileImport'
import { getMonGen345Identifier } from '../../../util/Lookup'
import { OHPKM } from '../OHPKM'
import { PK4 } from '../PK4'
;(global as any).TextDecoder = TextDecoder

test('gen 4 stat calculations', () => {
  const file = path.join(__dirname, './PKMFiles/Gen4', 'typhlosion.pkm')
  const fileBytes = fs.readFileSync(file)
  const bytes = new Uint8Array(fileBytes)
  const mon = bytesToPKM(bytes, 'pkm')
  expect(mon.stats).toStrictEqual({
    hp: 340,
    atk: 239,
    def: 169,
    spe: 251,
    spa: 224,
    spd: 204,
  })
})

const mightyenaOH = bytesToPKM(
  new Uint8Array(fs.readFileSync(path.join(__dirname, './PKMFiles/OH', 'mightyena.ohpkm'))),
  'OHPKM'
) as OHPKM

const slowpokeOH = bytesToPKM(
  new Uint8Array(fs.readFileSync(path.join(__dirname, './PKMFiles/OH', 'slowpoke-shiny.ohpkm'))),
  'OHPKM'
) as OHPKM

const typhlosionGen4 = bytesToPKM(
  new Uint8Array(fs.readFileSync(path.join(__dirname, './PKMFiles/Gen4', 'typhlosion.pkm'))),
  'PK4'
) as PK4

test('gen 4 EVs are updated', () => {
  const gen4pkm = new PK4(undefined, undefined, mightyenaOH)
  // mimicking ev reduction berries and ev gain
  gen4pkm.evs = {
    atk: 252,
    hp: 6,
    spa: 0,
    spe: 252,
    def: 0,
    spd: 0,
  }
  mightyenaOH.updateData(gen4pkm)
  expect(mightyenaOH.evs).toStrictEqual({
    atk: 252,
    hp: 6,
    spa: 0,
    spe: 252,
    def: 0,
    spd: 0,
  })
})

test('gen 4 ribbons are updated', () => {
  const gen4pkm = new PK4(undefined, undefined, mightyenaOH)
  // gaining Gen 4 ribbons
  gen4pkm.ribbons = [...gen4pkm.ribbons, 'Winning', 'Beauty (Sinnoh)', 'National']
  mightyenaOH.updateData(gen4pkm)
  expect(mightyenaOH.ribbons).toContain('Beauty (Sinnoh)')
  expect(mightyenaOH.ribbons).toContain('National')
  expect(mightyenaOH.ribbons).toContain('Winning')
  expect(mightyenaOH.ribbons).toContain('Kalos Champion')
  expect(mightyenaOH.ribbons).toContain('Alert')
  expect(mightyenaOH.ribbons).toContain('Careless')
})

test('gen 4 contest stats are updated', () => {
  const emeraldPKM = new PK4(undefined, undefined, mightyenaOH)
  // gaining cool contest points
  emeraldPKM.contest = {
    cool: 30,
    beauty: 255,
    smart: 255,
    tough: 255,
    cute: 255,
    sheen: 1,
  }
  mightyenaOH.updateData(emeraldPKM)
  expect(mightyenaOH.contest).toStrictEqual({
    cool: 30,
    beauty: 255,
    smart: 255,
    tough: 255,
    cute: 255,
    sheen: 1,
  })
})

test('gen 4 conversion to OHPKM and back is lossless', () => {
  const ohPKM = new OHPKM(undefined, typhlosionGen4)
  // gaining cool contest points
  const gen4PKM = new PK4(undefined, undefined, ohPKM)
  expect(typhlosionGen4.bytes).toEqual(gen4PKM.bytes)
})

test('pk4 and ohpkm have the same gen345Lookup key', () => {
  const ohPKM = new OHPKM(undefined, typhlosionGen4)
  expect(getMonGen345Identifier(ohPKM)).toEqual(getMonGen345Identifier(typhlosionGen4))
})

test('gen 6+ nickname accuracy', () => {
  const converted = new PK4(undefined, undefined, slowpokeOH)
  expect(converted.nickname).toBe(slowpokeOH.nickname)
})

test('gen 6+ shiny accuracy', () => {
  const converted = new PK4(undefined, undefined, slowpokeOH)
  if (!slowpokeOH.personalityValue) {
    throw Error('mon has no personality value')
  }
  expect(converted.isShiny).toBe(slowpokeOH.isShiny)
})

test('gen 6+ nature accuracy', () => {
  const converted = new PK4(undefined, undefined, slowpokeOH)
  expect(converted.nature).toBe(slowpokeOH.nature)
})
