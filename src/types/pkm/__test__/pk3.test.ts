import fs from 'fs'
import { TextDecoder } from 'node:util' // (ESM style imports)
import path from 'path'
import { getMonGen345Identifier } from '../../../util/Lookup'
import { OHPKM } from '../../OHPKM'
import { bytesToPKM } from '../FileImport'
import { PK3 } from '../PK3'
;(global as any).TextDecoder = TextDecoder

test('gen 3 stat calculations', () => {
  const file = path.join(__dirname, './PKMFiles/Gen3', 'blaziken.pkm')
  const fileBytes = fs.readFileSync(file)
  const bytes = new Uint8Array(fileBytes)
  const mon = bytesToPKM(bytes, 'pkm')
  expect(mon.stats).toStrictEqual({
    hp: 282,
    atk: 359,
    def: 165,
    spe: 208,
    spa: 243,
    spd: 154,
  })
})

const blazikenOH = bytesToPKM(
  new Uint8Array(fs.readFileSync(path.join(__dirname, './PKMFiles/OH', 'blaziken.ohpkm'))),
  'OHPKM'
) as OHPKM

const blazikenGen3 = bytesToPKM(
  new Uint8Array(fs.readFileSync(path.join(__dirname, './PKMFiles/Gen3', 'blaziken.pkm'))),
  'PK3'
) as PK3

const slowpokeOH = bytesToPKM(
  new Uint8Array(fs.readFileSync(path.join(__dirname, './PKMFiles/OH', 'slowpoke-shiny.ohpkm'))),
  'OHPKM'
) as OHPKM

test('gen 3 EVs are updated', () => {
  const emeraldPKM = new PK3(undefined, undefined, blazikenOH)
  // mimicking ev reduction berries and ev gain
  emeraldPKM.evs = {
    atk: 252,
    hp: 6,
    spa: 0,
    spe: 252,
    def: 0,
    spd: 0,
  }
  blazikenOH.updateData(emeraldPKM)
  expect(blazikenOH.evs).toStrictEqual({
    atk: 252,
    hp: 6,
    spa: 0,
    spe: 252,
    def: 0,
    spd: 0,
  })
})

test('gen 3 ribbons are updated', () => {
  const emeraldPKM = new PK3(undefined, undefined, blazikenOH)
  // gaining Gen 3 ribbons
  emeraldPKM.ribbons = [
    ...emeraldPKM.ribbons,
    'Cool (Hoenn)',
    'Cool Super',
    'Cool Hyper',
    'Cool Master (Hoenn)',
    'Winning',
  ]
  blazikenOH.updateData(emeraldPKM)
  expect(blazikenOH.ribbons).toContain('Cool Master (Hoenn)')
  expect(blazikenOH.ribbons).toContain('Winning')
  expect(blazikenOH.ribbons).toContain('Effort')
  expect(blazikenOH.ribbons).toContain('Footprint')
})

test('gen 3 contest stats are updated', () => {
  const emeraldPKM = new PK3(undefined, undefined, blazikenOH)
  // gaining cool contest points
  emeraldPKM.contest = {
    cool: 30,
    beauty: 255,
    smart: 255,
    tough: 255,
    cute: 255,
    sheen: 1,
  }
  blazikenOH.updateData(emeraldPKM)
  expect(blazikenOH.contest).toStrictEqual({
    cool: 30,
    beauty: 255,
    smart: 255,
    tough: 255,
    cute: 255,
    sheen: 1,
  })
})

test('gen 3 conversion to OHPKM and back is lossless', () => {
  const ohPKM = new OHPKM(undefined, blazikenGen3)
  // gaining cool contest points
  const gen3PKM = new PK3(undefined, undefined, ohPKM)
  expect(blazikenGen3.bytes).toEqual(gen3PKM.bytes)
})

test('pk3 and ohpkm have the same gen345Lookup key', () => {
  const ohPKM = new OHPKM(undefined, blazikenGen3)
  expect(getMonGen345Identifier(ohPKM)).toEqual(getMonGen345Identifier(blazikenGen3))
})

test('gen 6+ nickname accuracy', () => {
  const converted = new PK3(undefined, undefined, slowpokeOH)
  expect(converted.nickname).toBe(slowpokeOH.nickname)
})

test('gen 6+ shiny accuracy', () => {
  const converted = new PK3(undefined, undefined, slowpokeOH)
  if (!slowpokeOH.personalityValue) {
    throw Error('mon has no personality value')
  }
  expect(converted.isShiny).toBe(slowpokeOH.isShiny)
})

test('gen 6+ nature accuracy', () => {
  const converted = new PK3(undefined, undefined, slowpokeOH)
  expect(converted.nature).toBe(slowpokeOH.nature)
})
