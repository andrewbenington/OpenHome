import { PK1, PK3 } from '@openhome-core/pkm'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { R } from '@openhome-core/util/functional'
import { ConvertStrategies } from '@pkm-rs/pkg'
import { expect, test } from 'vitest'
import { emptyPathData } from '../../util/path'
import { G1SAV } from '../../G1SAV'
import { buildUnknownSaveFile } from '../../util/load'
import { Gen3G1RSave, Gen1G1RSave, Gen2G1RSave } from '../G1RSave'
import { gen3FromLua } from '../pokemon'
import { encodeLua, luaArray, LuaTable, LuaValue, parseLua, table } from '../serializer'

function object(values: Record<string, LuaValue>): LuaTable {
  return new Map(Object.entries(values))
}

function redMon(): LuaTable {
  return object({
    species: 'ARBOK',
    nickname: 'SNAKE',
    ot: 'TEST',
    otId: 123,
    exp: 1000000,
    hp: 255,
    level: 100,
    catchRate: 0,
    dvs: object({ hp: 15, attack: 15, defense: 15, speed: 15, special: 15 }),
    statExp: object({ hp: 100, attack: 200, defense: 300, speed: 400, special: 500 }),
    moves: luaArray([object({ id: 'PSYCHIC_M', pp: 16, ppUps: 3 })]),
    typeBytes: luaArray([3, 3]),
    customMonData: object({ tag: 'keep me' }),
  })
}

function fireMon(): LuaTable {
  return object({
    species: 1,
    speciesId: 1,
    speciesNumbering: 'internal',
    personality: 123456,
    nickname: 'SEED',
    name: 'BULBASAUR',
    otName: 'TEST',
    otId: 123,
    otSecretId: 456,
    exp: 1000,
    language: 2,
    friendship: 150,
    abilityNum: 0,
    ppBonusesPacked: 3,
    moves: luaArray([33]),
    pp: luaArray([40]),
    ivs: object({ hp: 31, atk: 30, def: 29, spe: 28, spa: 27, spd: 26 }),
    evs: object({ hp: 1, atk: 2, def: 3, spe: 4, spa: 5, spd: 6 }),
    cartExtra: object({
      ribbons: 32768,
      growthFiller: 42,
      unknown: 17,
      contest: object({ cool: 1, beauty: 2, cute: 3, smart: 4, tough: 5, sheen: 6 }),
      custom: 'nested extra',
    }),
    customMonData: object({ tag: 'keep me' }),
  })
}

function fixture(kind: 'red' | 'firered'): LuaTable {
  const root = object({
    version: kind,
    money: 100,
    party: luaArray([redMon()]),
    modData: object({ bytes: '\x00\xff', ['__proto__']: 'ordinary data' }),
    story: object({ flag: true, progress: 42 }),
    meta: object({ format: 4 }),
  })
  if (kind === 'red') {
    root.set('player', object({ name: 'TEST', id: 123 }))
    root.set('currentBox', 1)
    root.set('boxes', luaArray([luaArray([redMon(), redMon()])]))
  } else {
    root.set('schemaVersion', 1)
    root.set('trainerId', 123)
    root.set('secretId', 456)
    root.set('name', 'TEST')
    root.set(
      'storage',
      object({
        currentBox: 14,
        items: luaArray([object({ id: 1, qty: 2 })]),
        boxes: new Map([
          [14, object({ name: 'LAST BOX', wallpaper: 7, mons: new Map([[30, fireMon()]]) })],
        ]),
      })
    )
  }
  return root
}

function gen2Fixture(version = 'crystal'): LuaTable {
  const mon = redMon()
  mon.set('species', 'TYRANITAR')
  mon.set('experience', 1250000)
  mon.delete('exp')
  mon.set('happiness', 170)
  mon.set('pokerus', 0x32)
  mon.set('item', 'LEFTOVERS')
  mon.set('caughtTime', 3)
  mon.set('caughtLevel', 30)
  mon.set('caughtLocation', 12)
  mon.set('caughtByGender', 'girl')
  mon.set('moves', luaArray([object({ id: 'CRUNCH', pp: 20, ppUps: 1 })]))
  return object({
    version,
    generation: 2,
    format: 8,
    party: luaArray([mon]),
    player: object({ name: 'KRIS', gender: 'female', id: 123, money: 789 }),
    currentBox: 14,
    boxes: new Map([[14, luaArray([mon])]]),
    boxNames: new Map([[14, 'SPECIAL']]),
    modData: object({ extra: 'keep' }),
  })
}

for (const version of [
  'red',
  'blue',
  'yellow',
  'gold',
  'silver',
  'crystal',
  'firered',
  'leafgreen',
]) {
  test(`${version} detected by generation and retains its version on save`, () => {
    const gen2 = ['gold', 'silver', 'crystal'].includes(version)
    const gen3 = ['firered', 'leafgreen'].includes(version)
    const root = gen2 ? gen2Fixture(version) : fixture(gen3 ? 'firered' : 'red')
    root.set('version', version)
    const bytes = encodeLua(root)
    const Save = gen2 ? Gen2G1RSave : gen3 ? Gen3G1RSave : Gen1G1RSave
    const loaded = R.assert(
      buildUnknownSaveFile(emptyPathData, bytes, [Gen1G1RSave, Gen2G1RSave, Gen3G1RSave])
    )
    expect(loaded).toBeInstanceOf(Save)
    expect(loaded.gameNameFull.toLowerCase()).toContain(
      version === 'leafgreen' ? 'leafgreen' : version
    )
    const box = gen2 || gen3 ? 13 : 0,
      slot = gen3 ? 29 : 0
    loaded.setMonAt(box, slot, undefined)
    expect(parseLua(loaded.prepareWriter().bytes).get('version')).toBe(version)
  })
}

test('Gen 2 preserves names, caught data, items, Pokerus, stats and unknown fields', () => {
  const root = gen2Fixture()
  const bytes = encodeLua(root)
  const save = new Gen2G1RSave(emptyPathData, bytes)
  expect(save.prepareWriter().bytes).toEqual(bytes)
  expect(save.money).toBe(789)
  expect(save.getBoxName(13)).toBe('SPECIAL')
  const mon = save.getMonAt(13, 0)
  if (!mon) throw new Error('missing mon')
  expect(mon.nationalDex).toBe(248)
  expect(mon.currentHP).toBe(255)
  expect(mon.trainerFriendship).toBe(170)
  expect(mon.pokerusByte).toBe(0x32)
  expect(mon.metTimeOfDay).toBe(3)
  expect(mon.metLevel).toBe(30)
  expect(mon.metLocationIndex).toBe(12)
  const converted = R.assert(
    save.convertOhpkm(OHPKM.fromMonInSave(mon, save), ConvertStrategies.getDefault())
  )
  converted.nickname = 'EDITED'
  save.setMonAt(13, 0, undefined)
  save.setMonAt(0, 0, converted)
  const after = parseLua(save.prepareWriter().bytes)
  expect(after.get('party')).toEqual(root.get('party'))
  expect(after.get('modData')).toEqual(root.get('modData'))
  expect(after.get('boxNames')).toEqual(root.get('boxNames'))
  const record = table(table(table(after.get('boxes')).get(1)).get(1))
  expect(record.get('customMonData')).toEqual(redMon().get('customMonData'))
  expect(record.get('item')).toBe('LEFTOVERS')
  expect(record.get('caughtByGender')).toBe('girl')
  expect(record.get('experience')).toBe(1250000)
  expect(table(table(after.get('pokedex')).get('caught')).get('TYRANITAR')).toBe(true)
  const reopened = new Gen2G1RSave(emptyPathData, save.bytes)
  expect(reopened.getMonAt(0, 0)?.nickname).toBe('EDITED')
  expect(reopened.getMonAt(0, 0)?.dvs).toEqual(mon.dvs)
})

test('Gen 2 eggs retain hatch cycles through OpenHome and do not become caught Pokémon', () => {
  const root = gen2Fixture('gold')
  const record = table(table(table(root.get('boxes')).get(14)).get(1))
  record.set('isEgg', true)
  record.set('eggSteps', 23)
  record.set('happiness', 120)
  const save = new Gen2G1RSave(emptyPathData, encodeLua(root))
  const egg = save.getMonAt(13, 0)
  if (!egg) throw new Error('missing egg')
  expect(egg.isEgg).toBe(true)
  const oh = OHPKM.fromMonInSave(egg, save)
  expect(oh.isEgg).toBe(true)
  const converted = R.assert(save.convertOhpkm(oh, ConvertStrategies.getDefault()))
  expect(converted.isEgg).toBe(true)
  converted.nickname = 'EGG'
  save.setMonAt(13, 0, undefined)
  save.setMonAt(0, 0, converted)
  const after = parseLua(save.prepareWriter().bytes)
  const output = table(table(table(after.get('boxes')).get(1)).get(1))
  expect(output.get('isEgg')).toBe(true)
  expect(output.get('eggSteps')).toBe(23)
  expect(output.get('happiness')).toBe(120)
  expect(after.has('pokedex')).toBe(false)
  const red = new Gen1G1RSave(emptyPathData, encodeLua(fixture('red')))
  expect(R.isErr(red.convertOhpkm(oh, ConvertStrategies.getDefault()))).toBe(true)
})

for (const [kind, Save, count] of [
  ['red', Gen1G1RSave, 2],
  ['firered', Gen3G1RSave, 1],
] as const) {
  test(`${kind} schema detection, no-op identity and storage dimensions`, () => {
    const bytes = encodeLua(fixture(kind))
    expect(Save.fileIsSave(bytes)).toBe(true)
    const save = R.assert(buildUnknownSaveFile(emptyPathData, bytes, [Gen1G1RSave, Gen3G1RSave]))
    expect(save.getAllMons()).toHaveLength(count)
    expect(save.getBoxCount()).toBe(kind === 'red' ? 12 : 14)
    expect(save.prepareWriter().bytes).toEqual(bytes)
    expect(save.gameNameFull).toContain('G1R')
  })

  test(`${kind} remove and reinsert preserves unrelated data and repeated saves`, () => {
    const root = fixture(kind)
    const bytes = encodeLua(root)
    const save = new Save(emptyPathData, bytes)
    const b = kind === 'red' ? 0 : 13,
      s = kind === 'red' ? 0 : 29
    const mon = save.getMonAt(b, s)
    expect(mon).toBeDefined()
    save.setMonAt(b, s, undefined)
    const output = save.prepareWriter().bytes
    const after = parseLua(output)
    for (const key of ['party', 'modData', 'story', 'meta'])
      expect(after.get(key)).toEqual(root.get(key))
    expect(new Save(emptyPathData, output).getAllMons()).toHaveLength(count - 1)
    expect(save.prepareWriter().bytes).toEqual(output)
    // Red compacts its list; FireRed preserves sparse slots.
    if (kind === 'red') expect(save.getMonAt(0, 0)).toBeDefined()
    else expect(save.getMonAt(13, 29)).toBeUndefined()
    save.setMonAt(b, kind === 'red' ? 1 : s, mon as never)
    expect(new Save(emptyPathData, save.prepareWriter().bytes).getAllMons()).toHaveLength(count)
  })

  test(`${kind} reject unsupported schemas and broken slots without partial import`, () => {
    const root = fixture(kind)
    root.set(
      kind === 'red' ? 'meta' : 'schemaVersion',
      kind === 'red' ? object({ format: 999 }) : 999
    )
    expect(Save.fileIsSave(encodeLua(root))).toBe(false)
    expect(() => new Save(emptyPathData, encodeLua(root))).toThrow()
    const good = fixture(kind)
    const storage = kind === 'red' ? good : table(good.get('storage'))
    table(storage.get('boxes')).set(99, new Map())
    expect(() => new Save(emptyPathData, encodeLua(good))).toThrow(/slot/)
  })
}

test('Red HP 255 survives native G1R loading', () => {
  const save = new Gen1G1RSave(emptyPathData, encodeLua(fixture('red')))
  expect(save.getMonAt(0, 0)?.currentHP).toBe(255)
  expect(save.getMonAt(0, 0)?.nationalDex).toBe(24)
})

test('G1R schema takes precedence when text happens to have cartridge save length', () => {
  const source = encodeLua(fixture('red'))
  const bytes = new Uint8Array(32768).fill(32)
  bytes.set(source)
  expect(G1SAV.fileIsSave(bytes)).toBe(true)
  const save = R.assert(buildUnknownSaveFile(emptyPathData, bytes, [G1SAV, Gen1G1RSave]))
  expect(save).toBeInstanceOf(Gen1G1RSave)
})

test('FireRed sparse box creation, Pokémon conversion, metadata and dex updates', () => {
  const root = fixture('firered')
  const save = new Gen3G1RSave(emptyPathData, encodeLua(root))
  const source = save.getMonAt(13, 29)
  if (!source) throw new Error('fixture missing')
  const oh = OHPKM.fromMonInSave(source, save)
  const mon = R.assert(save.convertOhpkm(oh, ConvertStrategies.getDefault()))
  mon.nickname = 'NEW NAME'
  save.setMonAt(13, 29, undefined)
  save.setMonAt(0, 4, mon)
  const result = parseLua(save.prepareWriter().bytes)
  const storage = table(result.get('storage'))
  expect(storage.get('items')).toEqual(table(root.get('storage')).get('items'))
  expect(storage.get('currentBox')).toBe(14)
  const record = table(table(table(table(storage.get('boxes')).get(1)).get('mons')).get(5))
  expect(record.get('customMonData')).toEqual(fireMon().get('customMonData'))
  expect(table(record.get('cartExtra')).get('custom')).toBe('nested extra')
  expect(record.get('cartImport')).toBe(true)
  expect(table(table(result.get('dex')).get('caught')).get(1)).toBe(true)
  const reopened = new Gen3G1RSave(emptyPathData, save.bytes)
  expect(reopened.getMonAt(0, 4)?.nickname).toBe('NEW NAME')
  expect(reopened.getMonAt(0, 4)?.ivs).toEqual(source.ivs)
  expect(reopened.getMonAt(13, 29)).toBeUndefined()
})

test('FireRed national numbering and eggs preserve personality and do not mark dex caught', () => {
  const root = fixture('firered')
  const m = fireMon()
  m.set('species', 252)
  m.set('speciesNumbering', 'national')
  m.set('isEgg', true)
  m.set('eggCycles', 20)
  const mon = gen3FromLua(m, { tid: 123, sid: 456, name: 'TEST' })
  expect(mon.nationalDex).toBe(252)
  expect(mon.isEgg).toBe(true)
  const save = new Gen3G1RSave(emptyPathData, encodeLua(root))
  save.setMonAt(0, 0, mon)
  const after = parseLua(save.prepareWriter().bytes)
  expect(after.has('dex')).toBe(false)
  const reopened = new Gen3G1RSave(emptyPathData, save.bytes)
  expect(reopened.getMonAt(0, 0)?.isEgg).toBe(true)
  expect(reopened.getMonAt(0, 0)?.trainerFriendship).toBe(20)
})

test('cross-generation transfer converts through OpenHome and writes native G1R', () => {
  const red = new Gen1G1RSave(emptyPathData, encodeLua(fixture('red')))
  const fire = new Gen3G1RSave(emptyPathData, encodeLua(fixture('firered')))
  const redMon = red.getMonAt(0, 0),
    fireMon = fire.getMonAt(13, 29)
  if (!redMon || !fireMon) throw new Error('fixture missing')
  const toFire = R.assert(
    fire.convertOhpkm(OHPKM.fromMonInSave(redMon, red), ConvertStrategies.getDefault())
  )
  const toRed = R.assert(
    red.convertOhpkm(OHPKM.fromMonInSave(fireMon, fire), ConvertStrategies.getDefault())
  )
  expect(toFire).toBeInstanceOf(PK3)
  expect(toRed).toBeInstanceOf(PK1)
  fire.setMonAt(0, 0, toFire)
  red.setMonAt(0, 2, toRed)
  expect(
    new Gen3G1RSave(emptyPathData, fire.prepareWriter().bytes).getMonAt(0, 0)?.nationalDex
  ).toBe(24)
  expect(
    new Gen1G1RSave(emptyPathData, red.prepareWriter().bytes).getMonAt(0, 2)?.nationalDex
  ).toBe(1)
})
