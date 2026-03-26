import { bytesToPKM } from '@openhome-core/pkm/FileImport'
import { ConvertStrategies, ConvertStrategy } from '@pkm-rs/pkg'
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
var slowbroOhpkm: OHPKM

beforeAll(() => {
  blazikenOhpkm = bytesToPKM(
    new Uint8Array(fs.readFileSync(path.join(__dirname, './PKMFiles/OhpkmV2', 'blaziken.ohpkm'))),
    'OhpkmV2'
  ) as OHPKM

  blazikenPk3 = bytesToPKM(
    new Uint8Array(fs.readFileSync(path.join(__dirname, './PKMFiles/Gen3', 'blaziken.pkm'))),
    'PK3'
  ) as PK3

  slowbroOhpkm = bytesToPKM(
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
  const emeraldPKM = PK3.fromOhpkm(blazikenOhpkm, ConvertStrategies.getDefault())

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
  const emeraldPKM = PK3.fromOhpkm(blazikenOhpkm, ConvertStrategies.getDefault())

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
  const emeraldPKM = PK3.fromOhpkm(blazikenOhpkm, ConvertStrategies.getDefault())

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
  const gen3PKM = PK3.fromOhpkm(ohPKM, ConvertStrategies.getDefault())

  expect(blazikenPk3.toBytes()).toEqual(gen3PKM.toBytes())
})

test('pk3 and ohpkm have the same gen345Lookup key', () => {
  const ohPKM = new OHPKM(blazikenPk3)

  expect(getMonGen345Identifier(ohPKM)).toEqual(getMonGen345Identifier(blazikenPk3))
})

test('gen 3 nickname converted', () => {
  const gameDefaultStrategy: ConvertStrategy = {
    ...ConvertStrategies.getDefault(),
    'nickname.capitalization': 'GameDefault',
  }
  const converted = PK3.fromOhpkm(slowbroOhpkm, gameDefaultStrategy)

  expect(converted.nickname).toBe('SLOWBRO')
})

test('gen 3 nickname capitalization override', () => {
  const modernStrategy: ConvertStrategy = {
    ...ConvertStrategies.getDefault(),
    'nickname.capitalization': 'Modern',
  }
  const converted = PK3.fromOhpkm(slowbroOhpkm, modernStrategy)

  expect(converted.nickname).toBe('Slowbro')
})

test('gen 3 shiny accuracy', () => {
  const converted = PK3.fromOhpkm(slowbroOhpkm, ConvertStrategies.getDefault())

  expect(converted.isShiny()).toBe(slowbroOhpkm.isShiny())
})

test('gen 6+ nature accuracy', () => {
  const converted = PK3.fromOhpkm(slowbroOhpkm, ConvertStrategies.getDefault())

  expect(converted.nature.index).toEqual(slowbroOhpkm.nature.index)
})
