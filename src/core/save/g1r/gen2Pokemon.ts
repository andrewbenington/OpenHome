import { PK2 } from '@openhome-core/pkm'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { PkmConstructorOptions } from '@openhome-core/pkm/PKM'
import { R } from '@openhome-core/util/functional'
import { ConvertStrategy, Language, OriginGame } from '@pkm-rs/pkg'
import ids from './gen2Identifiers.json'
import { luaInteger, luaArray, luaString, LuaTable, luaOptionalTable, luaText } from './serializer'

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

export function gen2FromLua(pokemonData: LuaTable, origin: OriginGame): Gen2G1RMon {
  const dex = index(ids.species, luaText(pokemonData.get('species')))
  const bytes = new Uint8Array(35)
  bytes.set([1, dex, 255])
  const dataView = new DataView(bytes.buffer, 3)
  const luaNumberField = (key: string, max: number, fallback = 0) => luaInteger(pokemonData.get(key), max, fallback)
  dataView.setUint8(0, dex)
  const item = luaText(pokemonData.get('item'))
  dataView.setUint8(1, item ? index(ids.items, item) : 0)
  const moves = luaOptionalTable(pokemonData.get('moves'))
  for (const [key] of moves)
    if (typeof key !== 'number' || key < 1 || key > 4) throw new Error('Invalid move slot')
  for (let i = 0; i < 4; i++) {
    const entry = moves.get(i + 1)
    const move = entry instanceof Map ? entry : new Map()
    const name = typeof entry === 'string' ? luaText(entry) : luaText(move.get('id'))
    dataView.setUint8(2 + i, name ? index(ids.moves, name) : 0)
    const pp = move.get('pp') ?? luaOptionalTable(pokemonData.get('pp')).get(i + 1)
    dataView.setUint8(23 + i, luaInteger(pp, 63) | (luaInteger(move.get('ppUps'), 3) << 6))
  }
  dataView.setUint16(6, luaNumberField('otId', 65535))
  const exp = luaNumberField('experience', 0xffffff)
  dataView.setUint8(8, exp >>> 16)
  dataView.setUint16(9, exp & 65535)
  const se = luaOptionalTable(pokemonData.get('statExp')),
    dvs = luaOptionalTable(pokemonData.get('dvs'))
  fields.forEach((key, i) => dataView.setUint16(11 + i * 2, luaInteger(se.get(key), 65535)))
  dataView.setUint8(21, (luaInteger(dvs.get('attack'), 15) << 4) | luaInteger(dvs.get('defense'), 15))
  dataView.setUint8(22, (luaInteger(dvs.get('speed'), 15) << 4) | luaInteger(dvs.get('special'), 15))
  dataView.setUint8(27, pokemonData.get('isEgg') === true ? luaNumberField('eggSteps', 255) : luaNumberField('happiness', 255, 70))
  dataView.setUint8(28, luaNumberField('pokerus', 255))
  // The engine's unpacked caught fields take precedence over an older imported packed word.
  let caught = luaNumberField('caughtData', 65535)
  if (pokemonData.has('caughtTime') || pokemonData.has('caughtLocation')) {
    const gender = luaText(pokemonData.get('caughtByGender'), 'boy')
    caught =
      (((luaNumberField('caughtTime', 3) << 6) | (luaNumberField('caughtLevel', 100) & 63)) << 8) |
      (gender === 'girl' || gender === 'female' ? 128 : 0) |
      luaNumberField('caughtLocation', 127)
  }
  dataView.setUint16(29, caught)
  dataView.setUint8(31, luaNumberField('level', 100, 1))
  const mon = Gen2G1RMon.fromBytes(bytes.buffer)
  mon.gameOfOrigin = origin
  mon.language = Language.English
  mon.nickname = luaText(pokemonData.get('nickname')) || luaText(pokemonData.get('name')) || luaText(pokemonData.get('species'))
  mon.trainerName = luaText(pokemonData.get('ot'), 'TRAINER')
  mon.isEgg = pokemonData.get('isEgg') === true
  mon.currentHP = luaNumberField('hp', 65535, mon.isEgg ? 0 : mon.getStats().hp)
  mon.statusCondition = statuses[luaText(pokemonData.get('status'))] ?? 0
  if (mon.statusCondition === 7) mon.statusCondition = luaNumberField('statusTurns', 7, 7)
  return mon
}

export function gen2ToLua(mon: PK2, original?: LuaTable): LuaTable {
  const pokemonData: LuaTable = original ? structuredClone(original) : new Map()
  const species = ids.species[mon.nationalDex - 1]
  if (!species) throw new Error('Unsupported Gen 2 species')
  pokemonData.set('species', species)
  pokemonData.set('name', species)
  pokemonData.set('nickname', luaString(mon.nickname))
  pokemonData.set('ot', luaString(mon.trainerName))
  pokemonData.set('otId', mon.trainerID)
  pokemonData.set('experience', mon.exp)
  pokemonData.set('level', mon.getLevel())
  pokemonData.set('types', luaArray(ids.types[mon.nationalDex - 1]))
  const isEgg = mon instanceof Gen2G1RMon && mon.isEgg
  pokemonData.set('isEgg', isEgg)
  pokemonData.set('happiness', isEgg ? luaInteger(original?.get('happiness'), 255, 120) : mon.trainerFriendship)
  if (isEgg) pokemonData.set('eggSteps', mon.trainerFriendship)
  else pokemonData.delete('eggSteps')
  const itemIndex = mon.heldItemIndexGen2?.index ?? 0
  if (itemIndex) {
    const item = ids.items[itemIndex - 1]
    if (!item) throw new Error('Unsupported Gen 2 item')
    pokemonData.set('item', item)
  } else pokemonData.delete('item')
  pokemonData.set('pokerus', mon.pokerusByte)
  const raw = new DataView(mon.toBytes())
  pokemonData.set('caughtData', raw.getUint16(29))
  pokemonData.set('caughtTime', mon.metTimeOfDay)
  pokemonData.set('caughtLevel', Math.min(63, mon.metLevel))
  pokemonData.set('caughtLocation', mon.metLocationIndex)
  pokemonData.set('caughtByGender', mon.trainerGender ? 'girl' : 'boy')
  const dvs = new Map<string, number>(),
    statExp = new Map<string, number>()
  fields.forEach((key, i) => {
    dvs.set(key, mon.dvs[statsKeys[i]])
    statExp.set(key, mon.evsG12[statsKeys[i]])
  })
  pokemonData.set('dvs', dvs)
  pokemonData.set('statExp', statExp)
  mon.level = mon.getLevel()
  const stats = mon.getStats()
  pokemonData.set(
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
  pokemonData.set('maxHp', stats.hp)
  pokemonData.set('hp', isEgg ? 0 : Math.min(mon.currentHP, stats.hp))
  pokemonData.set('shiny', mon.isShiny())
  pokemonData.set('gender', mon.gender === 0 ? 'male' : mon.gender === 1 ? 'female' : 'unknown')
  if (mon.nationalDex === 201) pokemonData.set('unownLetter', mon.formIndex + 1)
  else pokemonData.delete('unownLetter')
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
  pokemonData.set('moves', moves)
  pokemonData.delete('pp')
  pokemonData.delete('ppRaw')
  pokemonData.delete('status')
  pokemonData.delete('statusTurns')
  if (mon.statusCondition & 7) {
    pokemonData.set('status', 'SLP')
    pokemonData.set('statusTurns', mon.statusCondition & 7)
  } else
    for (const [name, mask] of Object.entries(statuses).slice(1)) {
      if (mon.statusCondition & mask) {
        pokemonData.set('status', name)
        break
      }
    }
  return pokemonData
}
