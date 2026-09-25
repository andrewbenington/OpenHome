import { PK2 } from '@openhome-core/pkm'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { PkmConstructorOptions } from '@openhome-core/pkm/PKM'
import { R } from '@openhome-core/util/functional'
import { ConvertStrategy, Language, OriginGame } from '@pkm-rs/pkg'
import ids from './gen2Identifiers.json'
import { integer, luaArray, luaString, LuaTable, optionalTable, text } from './serializer'

// PK2 stores Egg status in the surrounding save's species list. G1R stores it on the mon.
export class Gen2G1RMon extends PK2 {
  isEgg = false
  constructor(value: ArrayBuffer | OHPKM, options: PkmConstructorOptions) {
    super(value, options)
    this.isEgg = value instanceof OHPKM && value.isEgg
  }
  static fromBytes(bytes: ArrayBuffer) {
    return new Gen2G1RMon(bytes, {})
  }
  static fromOhpkm(mon: OHPKM, strategy: ConvertStrategy) {
    return R.tryFrom(() => new Gen2G1RMon(mon, { strategy }))
  }
}

const fields = ['hp', 'attack', 'defense', 'speed', 'special'] as const
const statsKeys = ['hp', 'atk', 'def', 'spe', 'spc'] as const
const statuses: Record<string, number> = { SLP: 7, PSN: 8, BRN: 16, FRZ: 32, PAR: 64, TOX: 8 }

function index(list: string[], name: string): number {
  const found = list.indexOf(name) + 1
  if (!found || !name) throw new Error(`Unsupported Gen 2 identifier ${name}`)
  return found
}

export function gen2FromLua(m: LuaTable, origin: OriginGame): Gen2G1RMon {
  const dex = index(ids.species, text(m.get('species')))
  const bytes = new Uint8Array(35)
  bytes.set([1, dex, 255])
  const v = new DataView(bytes.buffer, 3)
  const n = (key: string, max: number, fallback = 0) => integer(m.get(key), max, fallback)
  v.setUint8(0, dex)
  const item = text(m.get('item'))
  v.setUint8(1, item ? index(ids.items, item) : 0)
  const moves = optionalTable(m.get('moves'))
  for (const [key] of moves)
    if (typeof key !== 'number' || key < 1 || key > 4) throw new Error('Invalid move slot')
  for (let i = 0; i < 4; i++) {
    const entry = moves.get(i + 1)
    const move = entry instanceof Map ? entry : new Map()
    const name = typeof entry === 'string' ? text(entry) : text(move.get('id'))
    v.setUint8(2 + i, name ? index(ids.moves, name) : 0)
    const pp = move.get('pp') ?? optionalTable(m.get('pp')).get(i + 1)
    v.setUint8(23 + i, integer(pp, 63) | (integer(move.get('ppUps'), 3) << 6))
  }
  v.setUint16(6, n('otId', 65535))
  const exp = n('experience', 0xffffff)
  v.setUint8(8, exp >>> 16)
  v.setUint16(9, exp & 65535)
  const se = optionalTable(m.get('statExp')),
    dvs = optionalTable(m.get('dvs'))
  fields.forEach((key, i) => v.setUint16(11 + i * 2, integer(se.get(key), 65535)))
  v.setUint8(21, (integer(dvs.get('attack'), 15) << 4) | integer(dvs.get('defense'), 15))
  v.setUint8(22, (integer(dvs.get('speed'), 15) << 4) | integer(dvs.get('special'), 15))
  v.setUint8(27, m.get('isEgg') === true ? n('eggSteps', 255) : n('happiness', 255, 70))
  v.setUint8(28, n('pokerus', 255))
  // The engine's unpacked caught fields take precedence over an older imported packed word.
  let caught = n('caughtData', 65535)
  if (m.has('caughtTime') || m.has('caughtLocation')) {
    const gender = text(m.get('caughtByGender'), 'boy')
    caught =
      (((n('caughtTime', 3) << 6) | (n('caughtLevel', 100) & 63)) << 8) |
      (gender === 'girl' || gender === 'female' ? 128 : 0) |
      n('caughtLocation', 127)
  }
  v.setUint16(29, caught)
  v.setUint8(31, n('level', 100, 1))
  const mon = Gen2G1RMon.fromBytes(bytes.buffer)
  mon.gameOfOrigin = origin
  mon.language = Language.English
  mon.nickname = text(m.get('nickname')) || text(m.get('name')) || text(m.get('species'))
  mon.trainerName = text(m.get('ot'), 'TRAINER')
  mon.isEgg = m.get('isEgg') === true
  mon.currentHP = n('hp', 65535, mon.isEgg ? 0 : mon.getStats().hp)
  mon.statusCondition = statuses[text(m.get('status'))] ?? 0
  if (mon.statusCondition === 7) mon.statusCondition = n('statusTurns', 7, 7)
  return mon
}

export function gen2ToLua(mon: PK2, original?: LuaTable): LuaTable {
  const m: LuaTable = original ? structuredClone(original) : new Map()
  const species = ids.species[mon.nationalDex - 1]
  if (!species) throw new Error('Unsupported Gen 2 species')
  m.set('species', species)
  m.set('name', species)
  m.set('nickname', luaString(mon.nickname))
  m.set('ot', luaString(mon.trainerName))
  m.set('otId', mon.trainerID)
  m.set('experience', mon.exp)
  m.set('level', mon.getLevel())
  m.set('types', luaArray(ids.types[mon.nationalDex - 1]))
  const isEgg = mon instanceof Gen2G1RMon && mon.isEgg
  m.set('isEgg', isEgg)
  m.set('happiness', isEgg ? integer(original?.get('happiness'), 255, 120) : mon.trainerFriendship)
  if (isEgg) m.set('eggSteps', mon.trainerFriendship)
  else m.delete('eggSteps')
  const itemIndex = mon.heldItemIndexGen2?.index ?? 0
  if (itemIndex) {
    const item = ids.items[itemIndex - 1]
    if (!item) throw new Error('Unsupported Gen 2 item')
    m.set('item', item)
  } else m.delete('item')
  m.set('pokerus', mon.pokerusByte)
  const raw = new DataView(mon.toBytes())
  m.set('caughtData', raw.getUint16(29))
  m.set('caughtTime', mon.metTimeOfDay)
  m.set('caughtLevel', Math.min(63, mon.metLevel))
  m.set('caughtLocation', mon.metLocationIndex)
  m.set('caughtByGender', mon.trainerGender ? 'girl' : 'boy')
  const dvs = new Map<string, number>(),
    statExp = new Map<string, number>()
  fields.forEach((key, i) => {
    dvs.set(key, mon.dvs[statsKeys[i]])
    statExp.set(key, mon.evsG12[statsKeys[i]])
  })
  m.set('dvs', dvs)
  m.set('statExp', statExp)
  mon.level = mon.getLevel()
  const stats = mon.getStats()
  m.set(
    'stats',
    new Map(
      Object.entries({
        hp: stats.hp,
        attack: stats.atk,
        defense: stats.def,
        speed: stats.spe,
        specialAttack: stats.spa,
        specialDefense: stats.spd,
      })
    )
  )
  m.set('maxHp', stats.hp)
  m.set('hp', isEgg ? 0 : Math.min(mon.currentHP, stats.hp))
  m.set('shiny', mon.isShiny())
  m.set('gender', mon.gender === 0 ? 'male' : mon.gender === 1 ? 'female' : 'unknown')
  if (mon.nationalDex === 201) m.set('unownLetter', mon.formIndex + 1)
  else m.delete('unownLetter')
  const moves: LuaTable = new Map()
  mon.moves.forEach((id, i) => {
    if (!id) return
    const name = ids.moves[id - 1]
    if (!name) throw new Error('Unsupported Gen 2 move')
    const maxPp = ids.pp[id - 1] + mon.movePPUps[i] * Math.floor(ids.pp[id - 1] / 5)
    moves.set(
      moves.size + 1,
      new Map<string, string | number>([
        ['id', name],
        ['pp', mon.movePP[i]],
        ['ppUps', mon.movePPUps[i]],
        ['maxPp', maxPp],
      ])
    )
  })
  m.set('moves', moves)
  m.delete('pp')
  m.delete('ppRaw')
  m.delete('status')
  m.delete('statusTurns')
  if (mon.statusCondition & 7) {
    m.set('status', 'SLP')
    m.set('statusTurns', mon.statusCondition & 7)
  } else
    for (const [name, mask] of Object.entries(statuses).slice(1)) {
      if (mon.statusCondition & mask) {
        m.set('status', name)
        break
      }
    }
  return m
}
