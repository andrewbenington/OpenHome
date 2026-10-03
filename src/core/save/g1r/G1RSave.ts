import { Gen2G1RMon, gen2FromLua, gen2ToLua } from './gen2Pokemon'
import gen2Ids from './gen2Identifiers.json'
import { PK1, PK2, PK3 } from '@openhome-core/pkm'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { Errorable, R } from '@openhome-core/util/functional'
import {
  BinaryGender,
  ConvertStrategy,
  ExtraFormIndex,
  ItemGen1,
  ItemGen2,
  ItemGen3,
  Language,
  OriginGame,
  OriginGames,
} from '@pkm-rs/pkg'
import { Box, BoxAndSlot, OfficialSAV } from '../interfaces'
import { LookupType } from '../util'
import { PathData } from '../util/path'
import { gen3FromLua, gen3ToLua, gen1Species, gen1FromLua, gen1ToLua } from './pokemon'
import {
  luaByteString,
  encodeLuaSave,
  luaInteger,
  LuaTable,
  luaNumericEntries,
  luaOptionalTable,
  parseLuaSave,
  luaTable,
  luaText,
} from './serializer'

type LuaKind = 'gen1' | 'gen2' | 'gen3'
type LuaMon = PK1 | PK2 | PK3
type SourceMon = { kind: LuaKind; value: LuaTable; fingerprint: string }
const sources = new WeakMap<LuaMon, SourceMon>()
const parsed = new WeakMap<Uint8Array, LuaTable>()

function pokemonTypeMatches(kind: LuaKind, mon: LuaMon): boolean {
  if (kind === 'gen1') return mon instanceof PK1
  if (kind === 'gen2') return mon instanceof PK2
  return mon instanceof PK3
}

function serializePokemon(mon: LuaMon, original?: LuaTable): LuaTable {
  if (mon instanceof PK1) return gen1ToLua(mon, original)
  if (mon instanceof PK2) return gen2ToLua(mon, original)
  return gen3ToLua(mon, original)
}

function speciesIdentifier(kind: LuaKind, mon: LuaMon, value: LuaTable): string | number {
  if (kind === 'gen1') return gen1Species[mon.nationalDex - 1]
  if (kind === 'gen2') return gen2Ids.species[mon.nationalDex - 1]
  return luaInteger(value.get('species'), 411)
}

function dexFlagNames(kind: LuaKind): string[] {
  if (kind === 'gen1') return ['seen', 'owned']
  if (kind === 'gen2') return ['seen', 'caught']
  return ['seen', 'owned', 'caught']
}

function trainerGender(owner: LuaTable, kind: LuaKind): BinaryGender {
  if (kind === 'gen2') {
    return luaText(owner.get('gender'), 'male') === 'female'
      ? BinaryGender.Female
      : BinaryGender.Male
  }
  return luaInteger(owner.get('gender'), 1) ? BinaryGender.Female : BinaryGender.Male
}

function read(bytes: Uint8Array): LuaTable {
  const cached = parsed.get(bytes)
  if (cached) return cached
  const root = parseLuaSave(bytes)
  parsed.set(bytes, root)
  return root
}

const versions = {
  red: { kind: 'gen1', origin: OriginGame.Red },
  blue: { kind: 'gen1', origin: OriginGame.BlueGreen },
  yellow: { kind: 'gen1', origin: OriginGame.Yellow },
  gold: { kind: 'gen2', origin: OriginGame.Gold },
  silver: { kind: 'gen2', origin: OriginGame.Silver },
  crystal: { kind: 'gen2', origin: OriginGame.Crystal },
  firered: { kind: 'gen3', origin: OriginGame.FireRed },
  leafgreen: { kind: 'gen3', origin: OriginGame.LeafGreen },
} as const

function versionOf(root: LuaTable) {
  const version = luaText(root.get('version') ?? luaOptionalTable(root.get('meta')).get('version'))
  if (!Object.hasOwn(versions, version)) throw new Error('Unsupported G1R game version')
  return versions[version as keyof typeof versions]
}

function recognized(root: LuaTable, kind: LuaKind): boolean {
  if (versionOf(root).kind !== kind || !(root.get('party') instanceof Map)) return false
  if (kind === 'gen1') {
    return (
      luaOptionalTable(root.get('meta')).get('format') === 4 &&
      root.get('boxes') instanceof Map &&
      root.get('player') instanceof Map
    )
  }
  if (kind === 'gen2') {
    const format = luaInteger(root.get('format'), 8)
    return (
      format >= 1 &&
      root.get('generation') === 2 &&
      root.get('boxes') instanceof Map &&
      root.get('player') instanceof Map
    )
  }
  return (
    root.get('schemaVersion') === 1 &&
    root.get('storage') instanceof Map &&
    luaOptionalTable(root.get('storage')).get('boxes') instanceof Map &&
    typeof root.get('trainerId') === 'number' &&
    typeof root.get('name') === 'string'
  )
}

function detects(bytes: Uint8Array, kind: LuaKind): boolean {
  if (!/^\s*return\s*\{/.test(luaByteString(bytes.subarray(0, 128)))) return false
  try {
    return recognized(read(bytes), kind)
  } catch {
    return false
  }
}

function fingerprint(mon: LuaMon): string {
  return (
    luaByteString(new Uint8Array(mon.toBytes({ includeExtraFields: true }))) +
    '\u0000' +
    mon.nickname +
    '\u0000' +
    mon.trainerName +
    ':' +
    mon.currentHP +
    ':' +
    ('isEgg' in mon && mon.isEgg ? 'egg' : '')
  )
}

function identity(mon: LuaMon): string {
  // Gen 1 tracking can change the OT ID. DVs, species, experience and names survive it.
  return mon instanceof PK3
    ? `3:${mon.personalityValue}:${mon.trainerID}:${mon.secretID}`
    : `1:${mon.nationalDex}:${[mon.dvs.hp, mon.dvs.atk, mon.dvs.def, mon.dvs.spe, mon.dvs.spc].join(',')}:${mon.exp}:${mon.nickname}:${mon.trainerName}`
}

abstract class G1RecompSave<P extends LuaMon> extends OfficialSAV<P> {
  static detectionPriority = 1
  abstract convertOhpkm(ohpkm: OHPKM, strategy: ConvertStrategy): Errorable<P>
  abstract supportsItem(index: number): boolean
  readonly kind: LuaKind
  origin: OriginGame
  boxRows: number
  boxColumns: number
  filePath: PathData
  fileCreated?: Date
  money: number
  name: string
  tid: number
  sid: number
  trainerGender: BinaryGender
  language = Language.English
  displayID: string
  currentPCBox: number
  boxes: Box<P>[]
  bytes: Uint8Array
  invalid = false
  tooEarlyToOpen = false
  updatedBoxSlots: BoxAndSlot[] = []
  private root: LuaTable
  private snapshots: (string | undefined)[][]

  constructor(path: PathData, bytes: Uint8Array, kind: LuaKind) {
    super()
    this.kind = kind
    this.root = structuredClone(read(bytes))
    if (!recognized(this.root, kind)) throw new Error(`Unsupported ${kind} Lua save schema`)
    this.bytes = new Uint8Array(bytes)
    this.filePath = path
    this.origin = versionOf(this.root).origin
    this.boxRows = kind === 'gen3' ? 5 : 4
    this.boxColumns = kind === 'gen3' ? 6 : 5
    const owner = kind === 'gen3' ? this.root : luaTable(this.root.get('player'))
    this.name = luaText(owner.get('name'))
    this.tid = luaInteger(owner.get(kind === 'gen3' ? 'trainerId' : 'id'), 65535)
    this.sid = kind === 'gen3' ? luaInteger(owner.get('secretId'), 65535) : 0
    this.money = luaInteger((kind === 'gen2' ? owner : this.root).get('money'), 0xffffffff)
    this.trainerGender = trainerGender(owner, kind)
    this.displayID = this.tid.toString().padStart(5, '0')
    const storage = kind === 'gen3' ? luaTable(this.root.get('storage')) : this.root
    const boxCount = kind === 'gen1' ? 12 : 14
    const current = luaInteger(storage.get('currentBox'), boxCount, 1)
    if (!current) throw new Error('Lua currentBox must be one based')
    this.currentPCBox = current - 1
    const data = luaTable(storage.get('boxes'))
    luaNumericEntries(data, boxCount)
    this.boxes = Array.from({ length: boxCount }, (_, b) => {
      const boxData = luaOptionalTable(data.get(b + 1))
      const mons = kind === 'gen3' ? luaOptionalTable(boxData.get('mons')) : boxData
      const box = new Box<P>(
        kind === 'gen3'
          ? luaText(boxData.get('name'), `BOX ${b + 1}`)
          : kind === 'gen2'
            ? luaText(luaOptionalTable(this.root.get('boxNames')).get(b + 1), `Box ${b + 1}`)
            : `Box ${b + 1}`,
        this.boxSlotCount
      )
      const entries = luaNumericEntries(mons, this.boxSlotCount)
      entries.forEach(([slot, value], i) => {
        if (kind !== 'gen3' && slot !== i + 1)
          throw new Error('Gen 1 and Gen 2 boxes must be contiguous')
        try {
          const record = luaTable(value, 'Pokémon')
          const mon = (
            kind === 'gen1'
              ? gen1FromLua(record, this.origin)
              : kind === 'gen2'
                ? gen2FromLua(record, this.origin)
                : gen3FromLua(record, this)
          ) as P
          sources.set(mon, { kind, value: record, fingerprint: fingerprint(mon) })
          box.boxSlots[slot - 1] = mon
        } catch (error) {
          throw new Error(`Box ${b + 1}, slot ${slot}: ${String(error)}`)
        }
      })
      return box
    })
    this.snapshots = this.boxes.map((b) =>
      Array.from(b.boxSlots, (m) => (m ? fingerprint(m) : undefined))
    )
  }

  get gameNameFull() {
    return `${OriginGames.gameNameFull(this.origin)} (G1R)`
  }
  get gameNameShort() {
    return this.gameNameFull
  }

  protected preserveSource(result: Errorable<P>): Errorable<P> {
    if (R.isOk(result)) {
      const candidates = this.getAllMons().filter((m) => identity(m as P) === identity(result.data))
      if (candidates.length === 1) {
        const source = sources.get(candidates[0] as P)
        if (source) sources.set(result.data, source)
      }
    }
    return result
  }

  supportsMon(dex: number, form: number, extra?: ExtraFormIndex): boolean {
    return (
      extra === undefined &&
      dex >= 1 &&
      dex <= (this.kind === 'gen1' ? 151 : this.kind === 'gen2' ? 251 : 386) &&
      (form === 0 || (this.kind !== 'gen1' && dex === 201))
    )
  }

  getMonAt(box: number, slot: number) {
    return this.boxes[box]?.boxSlots[slot]
  }
  setMonAt(box: number, slot: number, mon: P | undefined): void {
    if (
      !Number.isInteger(box) ||
      !Number.isInteger(slot) ||
      !this.boxes[box] ||
      slot < 0 ||
      slot >= this.boxSlotCount
    ) {
      throw new Error('Invalid Lua box slot')
    }
    if (mon && !this.supportsMon(mon.nationalDex, mon.formIndex))
      throw new Error('Pokémon is not supported by this Lua save')
    this.boxes[box].boxSlots[slot] = mon
  }

  prepareForSaving(): void {
    const changed = this.boxes.map((box, b) =>
      Array.from(box.boxSlots, (mon) => (mon ? fingerprint(mon) : undefined)).some(
        (signature, slot) => signature !== this.snapshots[b][slot]
      )
    )
    if (!changed.some(Boolean)) return
    const next = structuredClone(this.root)
    const storage = this.kind === 'gen3' ? luaTable(next.get('storage')) : next
    const data = luaTable(storage.get('boxes'))
    const savedSources: [P, SourceMon][] = []
    const compacted = this.boxes.map((box) => [...box.boxSlots])
    this.boxes.forEach((box, b) => {
      if (!changed[b]) return
      const mons: LuaTable = new Map()
      box.boxSlots.forEach((mon, slot) => {
        if (!mon) return
        if (
          !pokemonTypeMatches(this.kind, mon) ||
          !this.supportsMon(mon.nationalDex, mon.formIndex)
        )
          throw new Error('Unsupported Pokémon format')
        const fp = fingerprint(mon)
        const source = sources.get(mon)
        const original = source?.kind === this.kind ? source.value : undefined
        const value =
          original && source?.fingerprint === fp
            ? structuredClone(original)
            : serializePokemon(mon, original)
        mons.set(this.kind === 'gen3' ? slot + 1 : mons.size + 1, value)
        savedSources.push([mon, { kind: this.kind, value, fingerprint: fp }])
        if (fp !== this.snapshots[b][slot] && !('isEgg' in mon && mon.isEgg)) {
          const dexName = this.kind === 'gen3' ? 'dex' : 'pokedex'
          const dex = luaOptionalTable(next.get(dexName))
          const species = speciesIdentifier(this.kind, mon, value)
          for (const key of dexFlagNames(this.kind)) {
            const flags = luaOptionalTable(dex.get(key))
            flags.set(species as string | number, true)
            dex.set(key, flags)
          }
          next.set(dexName, dex)
        }
      })
      if (this.kind !== 'gen3') {
        data.set(b + 1, mons)
        compacted[b] = box.boxSlots.filter((m): m is P => m !== undefined)
        compacted[b].length = this.boxSlotCount
      } else {
        const boxData = luaOptionalTable(data.get(b + 1))
        boxData.set('mons', mons)
        data.set(b + 1, boxData)
      }
    })
    const output = encodeLuaSave(next)
    // Publish the prepared state only after every conversion and serialization succeeds.
    this.root = next
    this.bytes = output
    this.boxes.forEach((box, b) => {
      box.boxSlots = compacted[b]
    })
    savedSources.forEach(([mon, source]) => sources.set(mon, source))
    this.snapshots = this.boxes.map((b) =>
      Array.from(b.boxSlots, (m) => (m ? fingerprint(m) : undefined))
    )
    this.updatedBoxSlots = []
  }
}

export class Gen1G1RSave extends G1RecompSave<PK1> {
  static pkmType = PK1
  static lookupType: LookupType = 'gen12'
  static saveTypeName = 'Pokémon Gen 1 G1R save'
  static saveTypeAbbreviation = 'Gen 1 G1R'
  static saveTypeID = 'GEN1_G1R'
  static fileIsSave(bytes: Uint8Array) {
    return detects(bytes, 'gen1')
  }
  static includesOrigin(origin: OriginGame) {
    return [OriginGame.Red, OriginGame.BlueGreen, OriginGame.Yellow].includes(origin)
  }
  constructor(path: PathData, bytes: Uint8Array) {
    super(path, bytes, 'gen1')
  }
  convertOhpkm(mon: OHPKM, strategy: ConvertStrategy) {
    if (mon.isEgg) return R.Err('Gen 1 G1R saves cannot store Eggs')
    return this.preserveSource(PK1.fromOhpkm(mon, strategy))
  }
  supportsItem(index: number) {
    return ItemGen1.fromModern(index) !== undefined
  }
}

export class Gen3G1RSave extends G1RecompSave<PK3> {
  static pkmType = PK3
  static lookupType: LookupType = 'gen345'
  static saveTypeName = 'Pokémon Gen 3 G1R save'
  static saveTypeAbbreviation = 'Gen 3 G1R'
  static saveTypeID = 'GEN3_G1R'
  static fileIsSave(bytes: Uint8Array) {
    return detects(bytes, 'gen3')
  }
  static includesOrigin(origin: OriginGame) {
    return [OriginGame.FireRed, OriginGame.LeafGreen].includes(origin)
  }
  constructor(path: PathData, bytes: Uint8Array) {
    super(path, bytes, 'gen3')
  }
  convertOhpkm(mon: OHPKM, strategy: ConvertStrategy) {
    return this.preserveSource(PK3.fromOhpkm(mon, strategy))
  }
  supportsItem(index: number) {
    return ItemGen3.fromModern(index) !== undefined
  }
}

export class Gen2G1RSave extends G1RecompSave<Gen2G1RMon> {
  static pkmType = Gen2G1RMon
  static lookupType: LookupType = 'gen12'
  static saveTypeName = 'Pokémon Gen 2 G1R save'
  static saveTypeAbbreviation = 'Gen 2 G1R'
  static saveTypeID = 'GEN2_G1R'
  static fileIsSave(bytes: Uint8Array) {
    return detects(bytes, 'gen2')
  }
  static includesOrigin(origin: OriginGame) {
    return [OriginGame.Gold, OriginGame.Silver, OriginGame.Crystal].includes(origin)
  }
  constructor(path: PathData, bytes: Uint8Array) {
    super(path, bytes, 'gen2')
  }
  convertOhpkm(mon: OHPKM, strategy: ConvertStrategy) {
    return this.preserveSource(Gen2G1RMon.fromOhpkm(mon, strategy))
  }
  supportsItem(index: number) {
    return ItemGen2.fromModern(index) !== undefined
  }
}
