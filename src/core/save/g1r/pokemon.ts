import { PK1, PK3, toGen1PokemonIndex } from '@openhome-core/pkm'
import { Gen3Strings, Language, OriginGame } from '@pkm-rs/pkg'
import ids from './gen1Identifiers.json'
import { integer, luaArray, luaString, LuaTable, optionalTable, table, text } from './serializer'

export const gen1Species = ids.species
const statKeys = ['hp', 'atk', 'def', 'spe', 'spa', 'spd'] as const
const oldStatKeys = ['hp', 'attack', 'defense', 'speed', 'special'] as const
const oldPkmKeys = ['hp', 'atk', 'def', 'spe', 'spc'] as const
const contestKeys = ['cool', 'beauty', 'cute', 'smart', 'tough', 'sheen']
const statusCodes: Record<string, number> = { SLP: 7, PSN: 8, BRN: 16, FRZ: 32, PAR: 64, TOX: 128 }

function n(t: LuaTable, key: string | number, max: number, fallback = 0) {
  return integer(t.get(key), max, fallback)
}

function identifierIndex(values: string[], id: string, what: string): number {
  const index = values.indexOf(id) + 1
  if (index < 1) throw new Error(`Unsupported ${what}: ${id}`)
  return index
}

export function gen1FromLua(m: LuaTable, origin = OriginGame.Red): PK1 {
  const dex = identifierIndex(ids.species, text(m.get('species')), 'Red species')
  const raw = new Uint8Array(36)
  raw.set([1, toGen1PokemonIndex(dex), 255])
  const v = new DataView(raw.buffer, 3)
  v.setUint8(0, toGen1PokemonIndex(dex))
  v.setUint16(1, n(m, 'hp', 65535))
  v.setUint8(3, n(m, 'level', 100, 1))
  v.setUint8(4, statusCodes[text(m.get('status'))] ?? 0)
  const types = optionalTable(m.get('typeBytes'))
  v.setUint8(5, n(types, 1, 255))
  v.setUint8(6, n(types, 2, 255))
  v.setUint8(7, n(m, 'catchRate', 255))
  const moves = optionalTable(m.get('moves'))
  for (const [key] of moves)
    if (typeof key !== 'number' || key < 1 || key > 4) throw new Error('Invalid move slot')
  for (let i = 0; i < 4; i++) {
    const move = optionalTable(moves.get(i + 1))
    const id = text(move.get('id'))
    v.setUint8(8 + i, id ? identifierIndex(ids.moves, id, 'Red move') : 0)
    v.setUint8(29 + i, n(move, 'pp', 63) | (n(move, 'ppUps', 3) << 6))
  }
  v.setUint16(12, n(m, 'otId', 65535))
  const exp = n(m, 'exp', 0xffffff)
  v.setUint8(14, exp >>> 16)
  v.setUint16(15, exp & 65535)
  const statExp = optionalTable(m.get('statExp'))
  oldStatKeys.forEach((key, i) => v.setUint16(17 + i * 2, n(statExp, key, 65535)))
  const dvs = optionalTable(m.get('dvs'))
  v.setUint8(27, (n(dvs, 'attack', 15) << 4) | n(dvs, 'defense', 15))
  v.setUint8(28, (n(dvs, 'speed', 15) << 4) | n(dvs, 'special', 15))
  const mon = PK1.fromBytes(raw.buffer)
  mon.currentHP = n(m, 'hp', 65535, mon.getStats().hp)
  mon.trainerName = text(m.get('ot'), 'TRAINER')
  mon.nickname = text(m.get('nickname')) || text(m.get('species'))
  mon.language = Language.English
  mon.gameOfOrigin = origin
  return mon
}

export function gen1ToLua(mon: PK1, original?: LuaTable): LuaTable {
  const m = original ? structuredClone(original) : new Map()
  const species = ids.species[mon.nationalDex - 1]
  if (!species) throw new Error('Unsupported Red species')
  m.set('species', species)
  m.set('nickname', luaString(mon.nickname))
  m.set('ot', luaString(mon.trainerName))
  m.set('otId', mon.trainerID)
  m.set('exp', mon.exp)
  m.set('level', mon.getLevel())
  m.set('hp', mon.currentHP)
  m.set('catchRate', mon.heldItemIndexGen1?.index ?? 0)
  m.set('typeBytes', luaArray([mon.type1, mon.type2]))
  const dvs = new Map<string, number>()
  const statExp = new Map<string, number>()
  const stats = new Map<string, number>()
  const calculated = mon.getStats()
  oldStatKeys.forEach((key, i) => {
    dvs.set(key, mon.dvs[oldPkmKeys[i]])
    statExp.set(key, mon.evsG12[oldPkmKeys[i]])
    stats.set(key, calculated[oldPkmKeys[i]])
  })
  m.set('dvs', dvs)
  m.set('statExp', statExp)
  m.set('stats', stats)
  const moves: LuaTable = new Map()
  mon.moves.forEach((id, i) => {
    if (!id) return
    const name = ids.moves[id - 1]
    if (!name) throw new Error('Unsupported Red move')
    moves.set(
      moves.size + 1,
      new Map<string, string | number>([
        ['id', name],
        ['pp', mon.movePP[i]],
        ['ppUps', mon.movePPUps[i]],
      ])
    )
  })
  m.set('moves', moves)
  writeStatus(m, mon.statusCondition)
  return m
}

function writeStatus(m: LuaTable, status: number) {
  m.delete('status')
  m.delete('sleep')
  if (status & 7) {
    m.set('status', 'SLP')
    m.set('sleep', status & 7)
    return
  }
  for (const [name, bit] of Object.entries(statusCodes).slice(1)) {
    if (status & bit) {
      m.set('status', name)
      return
    }
  }
}

export function gen3FromLua(
  m: LuaTable,
  trainer: { tid: number; sid: number; name: string; origin?: OriginGame }
): PK3 {
  if (m.get('isBadEgg') === true) throw new Error('Bad Eggs are not supported in Lua saves')
  const raw = new Uint8Array(80)
  const v = new DataView(raw.buffer)
  const u16 = (o: number, val: number) => v.setUint16(o, val, true)
  const u32 = (o: number, val: number) => v.setUint32(o, val, true)
  const x = optionalTable(m.get('cartExtra'))
  const pid = n(m, 'personality', 0xffffffff)
  u32(0, pid)
  const otId = n(m, 'otId', 0xffffffff, trainer.tid)
  u16(4, otId & 65535)
  u16(
    6,
    n(m, 'otSecretId', 65535, otId > 65535 ? otId >>> 16 : otId === trainer.tid ? trainer.sid : 0)
  )
  const lang = n(m, 'language', 7, 2)
  const encoding = lang === 1 ? 'Jpn' : 'Int'
  raw.set(
    Gen3Strings.encodeTo10BytesSingleTerminator(
      text(m.get('nickname')) || text(m.get('name')),
      encoding
    ),
    8
  )
  if (x.has('nicknameBytes')) {
    const nickname = table(x.get('nicknameBytes'))
    for (let i = 0; i < 10; i++) raw[8 + i] = n(nickname, i + 1, 255, 255)
  }
  raw[18] = lang
  raw[19] = (n(x, 'flagsRaw', 255) & 248) | 2 | (m.get('isEgg') === true ? 4 : 0)
  raw.set(
    Gen3Strings.encodeTo7BytesSingleTerminator(
      text(m.get('otName') ?? m.get('ot'), trainer.name),
      encoding
    ),
    20
  )
  raw[27] = n(m, 'markings', 15)
  u16(30, n(x, 'unknown', 65535))
  const numbering = text(m.get('speciesNumbering'), 'internal')
  if (numbering !== 'internal' && numbering !== 'national')
    throw new Error('Unknown species numbering')
  const species = n(m, m.has('species') ? 'species' : 'speciesId', 411)
  u16(32, numbering === 'national' ? 1 : species)
  u16(34, n(m, m.has('item') ? 'item' : 'heldItem', 376))
  u32(36, n(m, 'exp', 0xffffffff))
  raw[40] = n(m, 'ppBonusesPacked', 255)
  raw[41] = n(
    m,
    m.get('isEgg') === true && m.has('eggCycles')
      ? 'eggCycles'
      : m.has('friendship')
        ? 'friendship'
        : 'happiness',
    255
  )
  u16(42, n(x, 'growthFiller', 65535))
  const moves = optionalTable(m.get('moves')),
    pp = optionalTable(m.get('pp'))
  for (const [key] of moves)
    if (typeof key !== 'number' || key < 1 || key > 4) throw new Error('Invalid move slot')
  for (let i = 0; i < 4; i++) {
    const move = moves.get(i + 1)
    const id =
      move instanceof Map ? (move.get('moveId') ?? move.get('id') ?? move.get('move')) : move
    u16(44 + i * 2, integer(id, 354))
    raw[52 + i] = integer(
      move instanceof Map ? (move.get('pp') ?? pp.get(i + 1)) : pp.get(i + 1),
      255
    )
  }
  const evs = optionalTable(m.get('evs')),
    ivs = optionalTable(m.get('ivs')),
    contest = optionalTable(x.get('contest'))
  statKeys.forEach((key, i) => {
    raw[56 + i] = n(evs, key, 255)
  })
  contestKeys.forEach((key, i) => {
    raw[62 + i] = n(contest, key, 255)
  })
  raw[68] = n(m, 'pokerus', 255)
  raw[69] = n(m, 'metLocation', 255)
  u16(
    70,
    n(m, 'metLevel', 127, n(m, 'level', 100)) |
      (n(m, 'metGame', 15, trainer.origin === OriginGame.LeafGreen ? 5 : 4) << 7) |
      (n(m, 'pokeball', 15, 4) << 11) |
      (n(m, 'otGender', 1) << 15)
  )
  let ivWord = m.get('isEgg') === true ? 0x40000000 : 0
  statKeys.forEach((key, i) => {
    ivWord |= n(ivs, key, 31) << (i * 5)
  })
  ivWord |= n(m, 'abilityNum', 1, pid % 2) << 31
  u32(72, ivWord)
  u32(
    76,
    n(
      x,
      'ribbons',
      0xffffffff,
      (x.get('championRibbon') === true ? 32768 : 0) +
        (x.get('modernFatefulEncounter') === true ? 0x80000000 : 0)
    )
  )
  let sum = 0
  for (let i = 32; i < 80; i += 2) sum += v.getUint16(i, true)
  u16(28, sum & 65535)
  const mon = PK3.fromBytes(raw.buffer)
  if (numbering === 'national') {
    if (species < 1 || species > 386) throw new Error('Unsupported FireRed species')
    mon.nationalDex = species
  }
  if (!mon.isValid()) throw new Error('Unsupported FireRed species')
  return mon
}

export function gen3ToLua(mon: PK3, original?: LuaTable): LuaTable {
  const m: LuaTable = original ? structuredClone(original) : new Map()
  const v = new DataView(mon.toBytes())
  const species = v.getUint16(32, true)
  const values: Record<string, string | number | boolean> = {
    species,
    speciesId: species,
    speciesNumbering: 'internal',
    personality: mon.personalityValue,
    nature: mon.personalityValue % 25,
    otId: mon.trainerID,
    otSecretId: mon.secretID,
    ot: luaString(mon.trainerName),
    otName: luaString(mon.trainerName),
    otGender: mon.trainerGender,
    nickname: luaString(mon.nickname),
    language: mon.language,
    isEgg: mon.isEgg,
    isBadEgg: false,
    markings: v.getUint8(27),
    item: v.getUint16(34, true),
    heldItem: v.getUint16(34, true),
    exp: mon.exp,
    friendship: mon.trainerFriendship,
    happiness: mon.trainerFriendship,
    ppBonusesPacked: v.getUint8(40),
    pokerus: mon.pokerusByte,
    metLocation: mon.metLocationIndex,
    metLevel: mon.metLevel,
    metGame: (v.getUint16(70, true) >>> 7) & 15,
    pokeball: mon.ball,
    abilityNum: mon.abilityNum,
    cartImport: true,
    level: mon.getLevel(),
  }
  Object.entries(values).forEach(([k, val]) => m.set(k, val))
  if (mon.isEgg) m.set('eggCycles', mon.trainerFriendship)
  else m.delete('eggCycles')
  const slots = mon.moves
    .map((id, i) => ({ id, pp: mon.movePP[i], ups: mon.movePPUps[i] }))
    .filter((s) => s.id !== 0)
  m.set('moves', luaArray(slots.map((s) => s.id)))
  m.set('pp', luaArray(slots.map((s) => s.pp)))
  m.set(
    'ppBonusesPacked',
    slots.reduce((packed, s, i) => packed | (s.ups << (i * 2)), 0)
  )
  m.set('ivs', new Map(Object.entries(mon.ivs)))
  m.set('evs', new Map(Object.entries(mon.evs)))
  const x = optionalTable(m.get('cartExtra'))
  x.set('contest', new Map(contestKeys.map((key, i) => [key, v.getUint8(62 + i)])))
  const ribbons = v.getUint32(76, true)
  x.set('ribbons', ribbons)
  x.set('championRibbon', !!(ribbons & 32768))
  x.set('modernFatefulEncounter', !!(ribbons & 0x80000000))
  x.set('flagsRaw', v.getUint8(19))
  x.set('unknown', v.getUint16(30, true))
  x.set('growthFiller', v.getUint16(42, true))
  if (mon.isEgg) x.set('nicknameBytes', luaArray(Array.from(new Uint8Array(v.buffer, 8, 10))))
  else x.delete('nicknameBytes')
  m.set('cartExtra', x)
  // The game's cartImport normalization derives its aliases, name, gender, ability and max PP.
  for (const key of [
    'name',
    'gender',
    'ability',
    'abilityId',
    'maxPp',
    'growthRate',
    'stats',
    'maxHp',
    'attack',
    'atk',
    'defense',
    'def',
    'speed',
    'spe',
    'spAtk',
    'spa',
    'spDef',
    'spd',
    'dvs',
  ])
    m.delete(key)
  m.set('hp', mon.getStats().hp)
  if (mon.isEgg) {
    m.set('name', 'EGG')
    m.set('nickname', 'EGG')
  }
  writeStatus(m, 0)
  return m
}
