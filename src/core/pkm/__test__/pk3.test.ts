import { bytesToPKM } from '@openhome/core/pkm/FileImport'
import { PK3 } from '@pokemon-files/pkm'
import fs from 'fs'
import { TextDecoder } from 'node:util' // (ESM style imports)
import path from 'path'
import { beforeAll, expect, test } from 'vitest'
import { getMonGen345Identifier } from '../Lookup'
import { OHPKM } from '../OHPKM'
import { initializeWasm } from './init'
;(global as any).TextDecoder = TextDecoder

beforeAll(initializeWasm)

var blazikenOhpkm: OHPKM
var blazikenPk3: PK3
var slowpokeOhpkm: OHPKM

beforeAll(() => {
  blazikenOhpkm = bytesToPKM(
    new Uint8Array(fs.readFileSync(path.join(__dirname, './PKMFiles/OhpkmV2', 'blaziken.ohpkm'))),
    'OhpkmV2'
  ) as OHPKM

  blazikenPk3 = bytesToPKM(
    new Uint8Array(fs.readFileSync(path.join(__dirname, './PKMFiles/Gen3', 'blaziken.pkm'))),
    'PK3'
  ) as PK3

  slowpokeOhpkm = bytesToPKM(
    new Uint8Array(fs.readFileSync(path.join(__dirname, './PKMFiles/OhpkmV2', 'slowbro.ohpkm'))),
    'OhpkmV2'
  ) as OHPKM
})

test('gen 3 stat calculations', () => {
  const file = path.join(__dirname, './PKMFiles/Gen3', 'blaziken.pkm')
  const fileBytes = fs.readFileSync(file)
  const bytes = new Uint8Array(fileBytes)
  const mon = bytesToPKM(bytes, 'pkm')

  expect(mon.getStats()).toStrictEqual({
    hp: 282,
    atk: 359,
    def: 165,
    spe: 208,
    spa: 243,
    spd: 154,
  })
})

test('gen 3 EVs are updated', () => {
  const emeraldPKM = new PK3(blazikenOhpkm)

  // mimicking ev reduction berries and ev gain
  emeraldPKM.evs = {
    atk: 252,
    hp: 6,
    spa: 0,
    spe: 252,
    def: 0,
    spd: 0,
  }
  blazikenOhpkm.syncWithGameData(emeraldPKM)
  expect(blazikenOhpkm.evs).toStrictEqual({
    atk: 252,
    hp: 6,
    spa: 0,
    spe: 252,
    def: 0,
    spd: 0,
  })
})

test('gen 3 ribbons are updated', () => {
  const emeraldPKM = new PK3(blazikenOhpkm)

  // gaining Gen 3 ribbons
  emeraldPKM.ribbons = [
    ...emeraldPKM.ribbons,
    'Cool (Hoenn)',
    'Cool Super',
    'Cool Hyper',
    'Cool Master (Hoenn)',
    'Winning',
  ]
  blazikenOhpkm.syncWithGameData(emeraldPKM)
  expect(blazikenOhpkm.ribbons).toContain('Cool Master (Hoenn)')
  expect(blazikenOhpkm.ribbons).toContain('Winning')
  expect(blazikenOhpkm.ribbons).toContain('Effort')
  expect(blazikenOhpkm.ribbons).toContain('Footprint')
})

test('gen 3 contest stats are updated', () => {
  const emeraldPKM = new PK3(blazikenOhpkm)

  // gaining cool contest points
  emeraldPKM.contest = {
    cool: 30,
    beauty: 255,
    smart: 255,
    tough: 255,
    cute: 255,
    sheen: 1,
  }
  blazikenOhpkm.syncWithGameData(emeraldPKM)
  expect(blazikenOhpkm.contest).toStrictEqual({
    cool: 30,
    beauty: 255,
    smart: 255,
    tough: 255,
    cute: 255,
    sheen: 1,
  })
})

test('gen 3 conversion to OHPKM and back is lossless', () => {
  const ohPKM = new OHPKM(blazikenPk3)
  // gaining cool contest points
  const gen3PKM = new PK3(ohPKM)

  expect(blazikenPk3.toBytes()).toEqual(gen3PKM.toBytes())
})

test('pk3 and ohpkm have the same gen345Lookup key', () => {
  const ohPKM = new OHPKM(blazikenPk3)

  expect(getMonGen345Identifier(ohPKM)).toEqual(getMonGen345Identifier(blazikenPk3))
})

test('gen 6+ nickname accuracy', () => {
  const converted = new PK3(slowpokeOhpkm)

  expect(converted.nickname).toBe(slowpokeOhpkm.nickname)
})

test('gen 6+ shiny accuracy', () => {
  const converted = new PK3(slowpokeOhpkm)

  if (!slowpokeOhpkm.personalityValue) {
    throw Error('mon has no personality value')
  }
  expect(converted.isShiny()).toBe(slowpokeOhpkm.isShiny())
})

test('gen 6+ nature accuracy', () => {
  const converted = new PK3(slowpokeOhpkm)

  expect(converted.nature.index).toEqual(slowpokeOhpkm.nature.index)
})
