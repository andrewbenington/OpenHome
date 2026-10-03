import { PK1, PK3, toGen1PokemonIndex } from '@openhome-core/pkm'
import { Gen3Strings, Language, OriginGame } from '@pkm-rs/pkg'
import ids from './gen1Identifiers.json'
import { luaInteger, luaArray, luaString, LuaTable, luaOptionalTable, luaTable, luaText } from './serializer'

export const gen1Species = ids.species
const statKeys = ['hp', 'atk', 'def', 'spe', 'spa', 'spd'] as const
const oldStatKeys = ['hp', 'attack', 'defense', 'speed', 'special'] as const
const oldPkmKeys = ['hp', 'atk', 'def', 'spe', 'spc'] as const
const contestKeys = ['cool', 'beauty', 'cute', 'smart', 'tough', 'sheen']
const statusCodes: Record<string, number> = { SLP: 7, PSN: 8, BRN: 16, FRZ: 32, PAR: 64, TOX: 128 }

function luaNumberField(tableValue: LuaTable, key: string | number, max: number, fallback = 0) {
  return luaInteger(tableValue.get(key), max, fallback)
}

function identifierIndex(values: string[], id: string, what: string): number {
  const index = values.indexOf(id) + 1
  if (index < 1) throw new Error(`Unsupported ${what}: ${id}`)
  return index
}

export function gen1FromLua(pokemonData: LuaTable, origin = OriginGame.Red): PK1 {
  const dex = identifierIndex(ids.species, luaText(pokemonData.get('species')), 'Red species')
  const raw = new Uint8Array(36)
  raw.set([1, toGen1PokemonIndex(dex), 255])
  const dataView = new DataView(raw.buffer, 3)
  dataView.setUint8(0, toGen1PokemonIndex(dex))
  dataView.setUint16(1, luaNumberField(pokemonData, 'hp', 65535))
  dataView.setUint8(3, luaNumberField(pokemonData, 'level', 100, 1))
  dataView.setUint8(4, statusCodes[luaText(pokemonData.get('status'))] ?? 0)
  const types = luaOptionalTable(pokemonData.get('typeBytes'))
  dataView.setUint8(5, luaNumberField(types, 1, 255))
  dataView.setUint8(6, luaNumberField(types, 2, 255))
  dataView.setUint8(7, luaNumberField(pokemonData, 'catchRate', 255))
  const moves = luaOptionalTable(pokemonData.get('moves'))
  for (const [key] of moves)
    if (typeof key !== 'number' || key < 1 || key > 4) throw new Error('Invalid move slot')
  for (let i = 0; i < 4; i++) {
    const move = luaOptionalTable(moves.get(i + 1))
    const id = luaText(move.get('id'))
    dataView.setUint8(8 + i, id ? identifierIndex(ids.moves, id, 'Red move') : 0)
    dataView.setUint8(29 + i, luaNumberField(move, 'pp', 63) | (luaNumberField(move, 'ppUps', 3) << 6))
  }
  dataView.setUint16(12, luaNumberField(pokemonData, 'otId', 65535))
  const exp = luaNumberField(pokemonData, 'exp', 0xffffff)
  dataView.setUint8(14, exp >>> 16)
  dataView.setUint16(15, exp & 65535)
  const statExp = luaOptionalTable(pokemonData.get('statExp'))
  oldStatKeys.forEach((key, i) => dataView.setUint16(17 + i * 2, luaNumberField(statExp, key, 65535)))
  const dvs = luaOptionalTable(pokemonData.get('dvs'))
  dataView.setUint8(27, (luaNumberField(dvs, 'attack', 15) << 4) | luaNumberField(dvs, 'defense', 15))
  dataView.setUint8(28, (luaNumberField(dvs, 'speed', 15) << 4) | luaNumberField(dvs, 'special', 15))
  const mon = PK1.fromBytes(raw.buffer)
  mon.currentHP = luaNumberField(pokemonData, 'hp', 65535, mon.getStats().hp)
  mon.trainerName = luaText(pokemonData.get('ot'), 'TRAINER')
  mon.nickname = luaText(pokemonData.get('nickname')) || luaText(pokemonData.get('species'))
  mon.language = Language.English
  mon.gameOfOrigin = origin
  return mon
}

export function gen1ToLua(mon: PK1, original?: LuaTable): LuaTable {
  const pokemonData = original ? structuredClone(original) : new Map()
  const species = ids.species[mon.nationalDex - 1]
  if (!species) throw new Error('Unsupported Red species')
  pokemonData.set('species', species)
  pokemonData.set('nickname', luaString(mon.nickname))
  pokemonData.set('ot', luaString(mon.trainerName))
  pokemonData.set('otId', mon.trainerID)
  pokemonData.set('exp', mon.exp)
  pokemonData.set('level', mon.getLevel())
  pokemonData.set('hp', mon.currentHP)
  pokemonData.set('catchRate', mon.heldItemIndexGen1?.index ?? 0)
  pokemonData.set('typeBytes', luaArray([mon.type1, mon.type2]))
  const dvs = new Map<string, number>()
  const statExp = new Map<string, number>()
  const stats = new Map<string, number>()
  const calculated = mon.getStats()
  oldStatKeys.forEach((key, i) => {
    dvs.set(key, mon.dvs[oldPkmKeys[i]])
    statExp.set(key, mon.evsG12[oldPkmKeys[i]])
    stats.set(key, calculated[oldPkmKeys[i]])
  })
  pokemonData.set('dvs', dvs)
  pokemonData.set('statExp', statExp)
  pokemonData.set('stats', stats)
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
  pokemonData.set('moves', moves)
  writeStatus(pokemonData, mon.statusCondition)
  return pokemonData
}

function writeStatus(pokemonData: LuaTable, status: number) {
  pokemonData.delete('status')
  pokemonData.delete('sleep')
  if (status & 7) {
    pokemonData.set('status', 'SLP')
    pokemonData.set('sleep', status & 7)
    return
  }
  for (const [name, bit] of Object.entries(statusCodes).slice(1)) {
    if (status & bit) {
      pokemonData.set('status', name)
      return
    }
  }
}

export function gen3FromLua(
  pokemonData: LuaTable,
  trainer: { tid: number; sid: number; name: string; origin?: OriginGame }
): PK3 {
  if (pokemonData.get('isBadEgg') === true) throw new Error('Bad Eggs are not supported in Lua saves')
  const raw = new Uint8Array(80)
  const dataView = new DataView(raw.buffer)
  const u16 = (o: number, val: number) => dataView.setUint16(o, val, true)
  const u32 = (o: number, val: number) => dataView.setUint32(o, val, true)
  const cartExtra = luaOptionalTable(pokemonData.get('cartExtra'))
  const pid = luaNumberField(pokemonData, 'personality', 0xffffffff)
  u32(0, pid)
  const otId = luaNumberField(pokemonData, 'otId', 0xffffffff, trainer.tid)
  u16(4, otId & 65535)
  u16(
    6,
    luaNumberField(pokemonData, 'otSecretId', 65535, otId > 65535 ? otId >>> 16 : otId === trainer.tid ? trainer.sid : 0)
  )
  const lang = luaNumberField(pokemonData, 'language', 7, 2)
  const encoding = lang === 1 ? 'Jpn' : 'Int'
  raw.set(
    Gen3Strings.encodeTo10BytesSingleTerminator(
      luaText(pokemonData.get('nickname')) || luaText(pokemonData.get('name')),
      encoding
    ),
    8
  )
  if (cartExtra.has('nicknameBytes')) {
    const nickname = luaTable(cartExtra.get('nicknameBytes'))
    for (let i = 0; i < 10; i++) raw[8 + i] = luaNumberField(nickname, i + 1, 255, 255)
  }
  raw[18] = lang
  raw[19] = (luaNumberField(cartExtra, 'flagsRaw', 255) & 248) | 2 | (pokemonData.get('isEgg') === true ? 4 : 0)
  raw.set(
    Gen3Strings.encodeTo7BytesSingleTerminator(
      luaText(pokemonData.get('otName') ?? pokemonData.get('ot'), trainer.name),
      encoding
    ),
    20
  )
  raw[27] = luaNumberField(pokemonData, 'markings', 15)
  u16(30, luaNumberField(cartExtra, 'unknown', 65535))
  const numbering = luaText(pokemonData.get('speciesNumbering'), 'internal')
  if (numbering !== 'internal' && numbering !== 'national')
    throw new Error('Unknown species numbering')
  const species = luaNumberField(pokemonData, pokemonData.has('species') ? 'species' : 'speciesId', 411)
  u16(32, numbering === 'national' ? 1 : species)
  u16(34, luaNumberField(pokemonData, pokemonData.has('item') ? 'item' : 'heldItem', 376))
  u32(36, luaNumberField(pokemonData, 'exp', 0xffffffff))
  raw[40] = luaNumberField(pokemonData, 'ppBonusesPacked', 255)
  raw[41] = luaNumberField(
    pokemonData,
    pokemonData.get('isEgg') === true && pokemonData.has('eggCycles')
      ? 'eggCycles'
      : pokemonData.has('friendship')
        ? 'friendship'
        : 'happiness',
    255
  )
  u16(42, luaNumberField(cartExtra, 'growthFiller', 65535))
  const moves = luaOptionalTable(pokemonData.get('moves')),
    pp = luaOptionalTable(pokemonData.get('pp'))
  for (const [key] of moves)
    if (typeof key !== 'number' || key < 1 || key > 4) throw new Error('Invalid move slot')
  for (let i = 0; i < 4; i++) {
    const move = moves.get(i + 1)
    const id =
      move instanceof Map ? (move.get('moveId') ?? move.get('id') ?? move.get('move')) : move
    u16(44 + i * 2, luaInteger(id, 354))
    raw[52 + i] = luaInteger(
      move instanceof Map ? (move.get('pp') ?? pp.get(i + 1)) : pp.get(i + 1),
      255
    )
  }
  const evs = luaOptionalTable(pokemonData.get('evs')),
    ivs = luaOptionalTable(pokemonData.get('ivs')),
    contest = luaOptionalTable(cartExtra.get('contest'))
  statKeys.forEach((key, i) => {
    raw[56 + i] = luaNumberField(evs, key, 255)
  })
  contestKeys.forEach((key, i) => {
    raw[62 + i] = luaNumberField(contest, key, 255)
  })
  raw[68] = luaNumberField(pokemonData, 'pokerus', 255)
  raw[69] = luaNumberField(pokemonData, 'metLocation', 255)
  u16(
    70,
    luaNumberField(pokemonData, 'metLevel', 127, luaNumberField(pokemonData, 'level', 100)) |
      (luaNumberField(pokemonData, 'metGame', 15, trainer.origin === OriginGame.LeafGreen ? 5 : 4) << 7) |
      (luaNumberField(pokemonData, 'pokeball', 15, 4) << 11) |
      (luaNumberField(pokemonData, 'otGender', 1) << 15)
  )
  let ivWord = pokemonData.get('isEgg') === true ? 0x40000000 : 0
  statKeys.forEach((key, i) => {
    ivWord |= luaNumberField(ivs, key, 31) << (i * 5)
  })
  ivWord |= luaNumberField(pokemonData, 'abilityNum', 1, pid % 2) << 31
  u32(72, ivWord)
  u32(
    76,
    luaNumberField(
      cartExtra,
      'ribbons',
      0xffffffff,
      (cartExtra.get('championRibbon') === true ? 32768 : 0) +
        (cartExtra.get('modernFatefulEncounter') === true ? 0x80000000 : 0)
    )
  )
  let sum = 0
  for (let i = 32; i < 80; i += 2) sum += dataView.getUint16(i, true)
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
  const pokemonData: LuaTable = original ? structuredClone(original) : new Map()
  const dataView = new DataView(mon.toBytes())
  const species = dataView.getUint16(32, true)
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
    markings: dataView.getUint8(27),
    item: dataView.getUint16(34, true),
    heldItem: dataView.getUint16(34, true),
    exp: mon.exp,
    friendship: mon.trainerFriendship,
    happiness: mon.trainerFriendship,
    ppBonusesPacked: dataView.getUint8(40),
    pokerus: mon.pokerusByte,
    metLocation: mon.metLocationIndex,
    metLevel: mon.metLevel,
    metGame: (dataView.getUint16(70, true) >>> 7) & 15,
    pokeball: mon.ball,
    abilityNum: mon.abilityNum,
    cartImport: true,
    level: mon.getLevel(),
  }
  Object.entries(values).forEach(([k, val]) => pokemonData.set(k, val))
  if (mon.isEgg) pokemonData.set('eggCycles', mon.trainerFriendship)
  else pokemonData.delete('eggCycles')
  const slots = mon.moves
    .map((id, i) => ({ id, pp: mon.movePP[i], ups: mon.movePPUps[i] }))
    .filter((s) => s.id !== 0)
  pokemonData.set('moves', luaArray(slots.map((s) => s.id)))
  pokemonData.set('pp', luaArray(slots.map((s) => s.pp)))
  pokemonData.set(
    'ppBonusesPacked',
    slots.reduce((packed, s, i) => packed | (s.ups << (i * 2)), 0)
  )
  pokemonData.set('ivs', new Map(Object.entries(mon.ivs)))
  pokemonData.set('evs', new Map(Object.entries(mon.evs)))
  const cartExtra = luaOptionalTable(pokemonData.get('cartExtra'))
  cartExtra.set('contest', new Map(contestKeys.map((key, i) => [key, dataView.getUint8(62 + i)])))
  const ribbons = dataView.getUint32(76, true)
  cartExtra.set('ribbons', ribbons)
  cartExtra.set('championRibbon', !!(ribbons & 32768))
  cartExtra.set('modernFatefulEncounter', !!(ribbons & 0x80000000))
  cartExtra.set('flagsRaw', dataView.getUint8(19))
  cartExtra.set('unknown', dataView.getUint16(30, true))
  cartExtra.set('growthFiller', dataView.getUint16(42, true))
  if (mon.isEgg) cartExtra.set('nicknameBytes', luaArray(Array.from(new Uint8Array(dataView.buffer, 8, 10))))
  else cartExtra.delete('nicknameBytes')
  pokemonData.set('cartExtra', cartExtra)
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
    pokemonData.delete(key)
  pokemonData.set('hp', mon.getStats().hp)
  if (mon.isEgg) {
    pokemonData.set('name', 'EGG')
    pokemonData.set('nickname', 'EGG')
  }
  writeStatus(pokemonData, 0)
  return pokemonData
}
