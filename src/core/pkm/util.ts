import {
  bytesToUint32LittleEndian,
  getFlag,
  uint16ToBytesLittleEndian,
  writeUint32ToBuffer,
} from '@openhome/core/save/util/byteLogic'
import { AbilityIndex, MetadataLookup, SpeciesAndForme, SpeciesLookup } from '@pkm-rs/pkg'
import { PKM } from '@pokemon-files/pkm'
import { Stats, StatsPreSplit } from '@pokemon-files/util'
import { Item } from '@pokemon-resources/consts/Items'
import { NationalDex } from '@pokemon-resources/consts/NationalDex'
import {
  AttackCharacteristics,
  DefenseCharacteristics,
  HPCharacteristics,
  HPCharacteristicsPre6,
  Moves,
  SpecialAtkCharacteristics,
  SpecialDefCharacteristics,
  SpeedCharacteristics,
  Type,
} from '@pokemon-resources/index'
import Prando from 'prando'
import { PKMInterface } from 'src/types/interfaces'
import { OHPKM } from './OHPKM'

export const writeIVsToBuffer = (
  ivs: Stats,
  buffer: Uint8Array,
  offset: number,
  isEgg: boolean,
  isNicknamed: boolean
) => {
  let ivsValue = 0

  ivsValue = (ivsValue + (isNicknamed ? 1 : 0)) << 1
  ivsValue = (ivsValue + (isEgg ? 1 : 0)) << 5
  ivsValue = (ivsValue + (ivs.spd & 0x1f)) << 5
  ivsValue = (ivsValue + (ivs.spa & 0x1f)) << 5
  ivsValue = (ivsValue + (ivs.spe & 0x1f)) << 5
  ivsValue = (ivsValue + (ivs.def & 0x1f)) << 5
  ivsValue = (ivsValue + (ivs.atk & 0x1f)) << 5
  ivsValue += ivs.hp & 0x1f
  writeUint32ToBuffer(ivsValue, buffer, offset)
}

export const getAbilityFromNumber = (
  dexNum: number,
  formeNum: number,
  abilityNum: number
): AbilityIndex | undefined => {
  return MetadataLookup(dexNum, formeNum)?.abilityByNum(abilityNum)
}

export const generateTeraType = (prng: Prando, dexNum: number, formeNum: number) => {
  const formeMetadata = SpeciesAndForme.tryNew(dexNum, formeNum)
  if (!formeMetadata) {
    return 0
  }
  const baseMon = getBaseMon(dexNum, formeNum)

  const baseMonMetadata = baseMon?.getMetadata()
  if (!baseMonMetadata) {
    return 0
  }

  if (prng.nextInt(0, 1) === 1 && baseMonMetadata.type2Index) {
    return baseMonMetadata.type2Index
  }

  return baseMonMetadata.type1Index
}

export const ivsFromDVs = (dvs: StatsPreSplit) => {
  return {
    hp: dvs.hp * 2 + 1,
    atk: dvs.atk * 2 + 1,
    def: dvs.def * 2 + 1,
    spa: dvs.spc * 2 + 1,
    spd: dvs.spc * 2 + 1,
    spe: dvs.spe * 2 + 1,
  }
}

const gvFromIV = (iv: number) => {
  if (iv < 20) {
    return 0
  }
  if (iv < 26) {
    return 1
  }
  if (iv < 31) {
    return 2
  }
  return 3
}

export const gvsFromIVs = (ivs: Stats) => {
  return {
    hp: gvFromIV(ivs.hp),
    atk: gvFromIV(ivs.atk),
    def: gvFromIV(ivs.def),
    spa: gvFromIV(ivs.spa),
    spd: gvFromIV(ivs.spd),
    spe: gvFromIV(ivs.spe),
  }
}

export const dvsFromIVs = (ivs: Stats, isShiny: boolean) => {
  if (isShiny) {
    let atkDV = Math.ceil((ivs.atk - 1) / 2)

    if ((atkDV & 0b11) === 0b01) {
      atkDV += 1
    } else if (atkDV % 4 === 0) {
      atkDV += 2
    }
    const hpDV = (atkDV & 1) << 3

    return {
      hp: hpDV,
      atk: atkDV,
      def: 10,
      spc: 10,
      spe: 10,
    }
  }
  return {
    hp: Math.ceil((ivs.hp - 1) / 2),
    atk: Math.ceil((ivs.atk - 1) / 2),
    def: Math.ceil((ivs.def - 1) / 2),
    spc: Math.ceil(((ivs.spa + ivs.spd) / 2 - 1) / 2),
    spe: Math.ceil((ivs.spe - 1) / 2),
  }
}

export const generateIVs = (prng: Prando) => {
  return {
    hp: prng.nextInt(0, 31),
    atk: prng.nextInt(0, 31),
    def: prng.nextInt(0, 31),
    spa: prng.nextInt(0, 31),
    spd: prng.nextInt(0, 31),
    spe: prng.nextInt(0, 31),
  }
}

export const generateDVs = (prng: Prando, isShiny: boolean) => {
  if (isShiny) {
    let atkDV = prng.nextInt(0, 15)

    if ((atkDV & 0b11) === 0b01) {
      atkDV += 1
    } else if (atkDV % 4 === 0) {
      atkDV += 2
    }
    const hpDV = (atkDV & 1) << 3

    return {
      hp: hpDV,
      atk: atkDV,
      def: 10,
      spc: 10,
      spe: 10,
    }
  }
  return {
    hp: prng.nextInt(0, 15),
    atk: prng.nextInt(0, 15),
    def: prng.nextInt(0, 15),
    spc: prng.nextInt(0, 15),
    spe: prng.nextInt(0, 15),
  }
}

export const generatePersonalityValue = () => {
  return Math.floor(Math.random() * 2 ** 32)
}

// recursively returns pre-evolution. if provided a mega forme, returns the first pre-evolution
// of the base forme.
export const getBaseMon = (dexNum: number, forme?: number) => {
  let mon = SpeciesAndForme.tryNew(dexNum, forme ?? 0)
  let metadata = mon?.getMetadata()

  if (metadata?.isMega) {
    metadata = metadata?.getMegaBaseForme() ?? metadata
  }

  while (metadata?.preEvolution) {
    mon = metadata.preEvolution
    metadata = mon?.getMetadata()
  }

  return mon
}

export const formatHasColorMarkings = (format: string) => {
  return (
    (format.charAt(0) === 'p' && ['7', '8', '9'].includes(format.charAt(format.length - 1))) ||
    format === 'OHPKM'
  )
}

export const getTypes = (mon: PKMInterface): Type[] => {
  const metadata = mon.metadata
  if (!metadata) {
    return ['Normal']
  }

  const type1 = metadata.type1 as Type
  const type2 = metadata.type2 as Type | undefined

  if (
    mon.format === 'PK1' &&
    (mon.dexNum === NationalDex.Magnemite || mon.dexNum === NationalDex.Magneton)
  ) {
    return ['Electric']
  } else if (['PK1', 'PK2', 'PK3', 'COLOPKM', 'XDPKM', 'PK4', 'PK5'].includes(mon.format)) {
    if (type2 === 'Fairy') {
      return [type1]
    } else if (type1 === 'Fairy') {
      return type2 ? ['Normal', type2] : ['Normal']
    }
  }
  return type2 ? [type1, type2] : [type1]
}

export const getMoveMaxPP = (moveIndex: number, format: string, ppUps = 0) => {
  const move = Moves[moveIndex]

  if (!move) return undefined
  let baseMaxPP

  switch (format) {
    case 'PK1':
      baseMaxPP = move.pastGenPP?.G1 ?? move.pp
      break
    case 'PK2':
      baseMaxPP = move.pastGenPP?.G2 ?? move.pp
      break
    case 'PK3':
    case 'COLOPKM':
    case 'XDPKM':
      baseMaxPP = move?.pastGenPP?.G3 ?? move?.pp
      break
    case 'PK4':
      baseMaxPP = move.pastGenPP?.G4 ?? move.pp
      break
    case 'PK5':
      baseMaxPP = move.pastGenPP?.G5 ?? move.pp
      break
    case 'PK6':
      baseMaxPP = move.pastGenPP?.G6 ?? move.pp
      break
    case 'PK7':
      baseMaxPP = move.pastGenPP?.SMUSUM ?? move.pp
      break
    case 'PB7':
      baseMaxPP = move.pastGenPP?.LGPE ?? move.pp
      break
    case 'PK8':
    case 'PB8':
    case 'PK3RR':
    case 'PK3UB':
      baseMaxPP = move.pastGenPP?.G8 ?? move.pp
      break
    case 'PA8':
      baseMaxPP = move.pastGenPP?.LA ?? move.pp
      break
    case 'PK9':
      baseMaxPP = move.pp
      break
    default:
      baseMaxPP = move.pp
      break
  }
  if (baseMaxPP === 1) {
    return baseMaxPP
  }
  // gameboy games add less pp for 40pp moves
  if ((format === 'PK1' || format === 'PK2') && baseMaxPP === 40) {
    return baseMaxPP + Math.floor(ppUps * 7)
  }
  return baseMaxPP + Math.floor(ppUps * (baseMaxPP / 5))
}

export const adjustMovePPBetweenFormats = (
  destFormatMon: {
    moves: number[]
    movePP: number[]
    movePPUps: number[]
    format: string
  },
  sourceFormatMon: {
    moves: number[]
    movePP: number[]
    movePPUps: number[]
    format: string
  }
) => {
  return sourceFormatMon.moves.map((move, i) => {
    const otherMaxPP = getMoveMaxPP(move, sourceFormatMon.format, sourceFormatMon.movePPUps[i]) ?? 0
    const thisMaxPP = getMoveMaxPP(move, destFormatMon.format, sourceFormatMon.movePPUps[i]) ?? 0
    const adjustedMovePP = sourceFormatMon.movePP[i] - (otherMaxPP - thisMaxPP)

    return adjustedMovePP // lodash.max([adjustedMovePP, 0]) ?? 0
  }) as [number, number, number, number]
}

export const getSixDigitTID = (tid: number, sid: number) => {
  const bytes = new Uint8Array(4)

  bytes.set(uint16ToBytesLittleEndian(tid), 0)
  bytes.set(uint16ToBytesLittleEndian(sid), 2)
  return bytesToUint32LittleEndian(bytes, 0x0c) % 1000000
}

export function getCharacteristic(mon: PKMInterface) {
  const preGen6 = mon.encryptionConstant === undefined
  const tiebreaker = preGen6 ? mon.personalityValue : mon.encryptionConstant

  if (!mon.ivs || !tiebreaker) return ''
  const statFields = ['hp', 'atk', 'def', 'spe', 'spa', 'spd']
  const maxIV = Math.max(
    mon.ivs.hp,
    mon.ivs.atk,
    mon.ivs.def,
    mon.ivs.spa,
    mon.ivs.spd,
    mon.ivs.spe
  )
  const lastIndex = tiebreaker % 6 === 0 ? 5 : (tiebreaker % 6) - 1
  let determiningIV = 'hp'

  for (let i = tiebreaker % 6; i !== lastIndex; i = (i + 1) % 6) {
    if ((mon.ivs as any)[statFields[i]] === maxIV) {
      determiningIV = statFields[i]
      break
    }
  }
  switch (determiningIV) {
    case 'hp':
      return preGen6 ? HPCharacteristicsPre6[maxIV % 5] : HPCharacteristics[maxIV % 5]
    case 'atk':
      return AttackCharacteristics[maxIV % 5]
    case 'def':
      return DefenseCharacteristics[maxIV % 5]
    case 'spa':
      return SpecialAtkCharacteristics[maxIV % 5]
    case 'spd':
      return SpecialDefCharacteristics[maxIV % 5]
    default:
      return SpeedCharacteristics[maxIV % 5]
  }
}

// function getPLAMoveMasteredFlag(mon: PA8 | OHPKM, index: number) {
//   return getFlag(mon.masterFlagsLA, 0, index);
// }

export function getFlagsInRange(bytes: Uint8Array, offset: number, size: number) {
  const flags: number[] = []

  for (let i = 0; i < size * 8; i++) {
    if (getFlag(bytes, offset, i)) {
      flags.push(i)
    }
  }

  return flags
}

const hpTypes: Type[] = [
  'Fighting',
  'Flying',
  'Poison',
  'Ground',
  'Rock',
  'Bug',
  'Ghost',
  'Steel',
  'Fire',
  'Water',
  'Grass',
  'Electric',
  'Psychic',
  'Ice',
  'Dragon',
  'Dark',
]

export type HiddenPowerWithBP = {
  type: Type
  power: number
}

export function getHiddenPowerGen2(dvs: StatsPreSplit): HiddenPowerWithBP {
  const typeIndex = ((dvs.atk & 0b11) << 2) + (dvs.def & 0b11)

  const v = mostSignificantBit(dvs.spc)
  const w = mostSignificantBit(dvs.spe)
  const x = mostSignificantBit(dvs.def)
  const z = mostSignificantBit(dvs.atk)

  const numerator = 5 * ((z << 3) + (x << 2) + (w << 1) + v + (dvs.spc & 0x11))
  const basePower = Math.floor(numerator / 2) + 31

  return {
    type: hpTypes[typeIndex],
    power: basePower,
  }
}

function mostSignificantBit(value: number) {
  return value & 0b1000 ? 1 : 0
}

export function getHiddenPowerType(ivs: Stats): Type {
  const numerator =
    [0, ivs.spd, ivs.spa, ivs.spe, ivs.def, ivs.atk, ivs.hp].reduce(
      (prev, value) => (prev << 1) + (value & 1)
    ) * 15

  return hpTypes[Math.floor(numerator / 63)]
}

export function getHiddenPowerPower(ivs: Stats): number {
  const numerator =
    [0, ivs.spd, ivs.spa, ivs.spe, ivs.def, ivs.atk, ivs.hp].reduce(
      (prev, value) => (prev << 1) + ((value >> 1) & 1)
    ) * 40

  return Math.floor(numerator / 63) + 30
}

export type PKMFile = PKM | OHPKM

export function shinyLeafValues(shinyLeafNumber: number) {
  return {
    first: Boolean(shinyLeafNumber & 1),
    second: Boolean(shinyLeafNumber & 2),
    third: Boolean(shinyLeafNumber & 4),
    fourth: Boolean(shinyLeafNumber & 8),
    fifth: Boolean(shinyLeafNumber & 16),
    crown: Boolean(shinyLeafNumber & 32),
  }
}

export function isMegaStone(itemIndex?: number): boolean {
  return (
    itemIndex !== undefined &&
    ((itemIndex >= Item.Gengarite && itemIndex <= Item.Latiosite) ||
      (itemIndex >= Item.Swampertite && itemIndex <= Item.Beedrillite) ||
      (itemIndex >= Item.Clefablite && itemIndex <= Item.Falinksite) ||
      (itemIndex >= Item.RaichuniteX && itemIndex <= Item.Glimmoranite))
  )
}

export function isZCrystal(itemIndex: number) {
  return (
    (itemIndex >= Item.NormaliumZ && itemIndex <= Item.PikaniumZ) ||
    (itemIndex >= Item.DecidiumZ && itemIndex <= Item.PikashuniumZ_2) ||
    (itemIndex >= Item.SolganiumZ && itemIndex <= Item.KommoniumZ_2)
  )
}

export function isBattleFormeItem(nationalDex: number, itemIndex?: number) {
  return (
    (nationalDex === NationalDex.Necrozma &&
      (itemIndex === Item.UltranecroziumZ_1 || itemIndex === Item.UltranecroziumZ_2)) ||
    (nationalDex === NationalDex.Groudon && itemIndex === Item.RedOrb) ||
    (nationalDex === NationalDex.Kyogre && itemIndex === Item.BlueOrb) ||
    (nationalDex === NationalDex.Zacian && itemIndex === Item.RustedSword) ||
    (nationalDex === NationalDex.Zamazenta && itemIndex === Item.RustedShield)
  )
}

export function displayIndexAdder(itemIndex?: number) {
  if (itemIndex === Item.UltranecroziumZ_1 || itemIndex === Item.UltranecroziumZ_2) {
    return (x: number) => x + 3
  }
  return (x: number) => x + 1
}

export function hasMega(nationalDex: number) {
  const formes = SpeciesLookup(nationalDex)?.formes ?? []

  return formes.some((forme) => forme.isMega)
}
