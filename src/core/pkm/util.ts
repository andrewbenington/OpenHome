import { MonFormat, PKMInterface } from '@openhome-core/pkm/interfaces'
import {
  AbilityIndex,
  currentMetadataReader,
  extraFormTypeOverride,
  FormMetadata,
  metadataReaderFor,
  MetadataSource,
  MetadataSummaryLookup,
  PkmType,
  SpeciesAndForm,
} from '@pkm-rs/pkg'
import { FourMoves, Stats, StatsPreSplit } from '@pokemon-files/util'
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
} from '@pokemon-resources/index'
import Prando from 'prando'

export const getAbilityFromNumber = (
  dexNum: number,
  formNum: number,
  abilityNum: number
): AbilityIndex | undefined => {
  return MetadataSummaryLookup(dexNum, formNum)?.abilityByNum(abilityNum)
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

// recursively returns pre-evolution. if provided a mega form, returns the first pre-evolution
// of the base form.
export const getBaseMon = (dexNum: number, form?: number) => {
  let mon = SpeciesAndForm.tryNew(dexNum, form ?? 0)
  let metadata = mon?.getMetadata()

  if (metadata?.isMega) {
    metadata = metadata?.getMegaBaseForm() ?? metadata
  }

  while (metadata?.preEvolution) {
    mon = metadata.preEvolution
    metadata = mon?.getMetadata()
  }

  return mon
}

export const getPrevos = (dexNum: number, formIndex?: number) => {
  let mon = SpeciesAndForm.tryNew(dexNum, formIndex ?? 0)
  let metadata = mon?.getMetadata()

  const prevos: FormMetadata[] = []

  while (metadata?.preEvolution) {
    mon = metadata.preEvolution
    metadata = mon?.getMetadata()
    prevos.push(metadata)
  }

  return prevos
}

export const getTypes = (mon: PKMInterface): PkmType[] => {
  if (mon.extraFormIndex !== undefined) {
    const extraFormTypeIndices: PkmType[] | undefined = extraFormTypeOverride(mon.extraFormIndex)
    if (extraFormTypeIndices) {
      return extraFormTypeIndices
    }
  }

  const metadataReader =
    mon.format === 'OHPKM'
      ? currentMetadataReader(mon.dexNum, mon.formNum)
      : metadataReaderFor(MetadataSourceByFormat(mon.format), mon.dexNum, mon.formNum)

  if (!metadataReader) {
    return ['Normal']
  }

  const type1 = metadataReader.type1()
  const type2 = metadataReader.type2()

  return type2 ? [type1, type2] : [type1]
}

function MetadataSourceByFormat(format: MonFormat): MetadataSource {
  switch (format) {
    case 'PK1':
      return MetadataSource.Yellow
    case 'PK2':
      return MetadataSource.Crystal
    case 'PK3':
    case 'COLOPKM':
    case 'XDPKM':
      return MetadataSource.Emerald
    case 'PK4':
      return MetadataSource.HeartGoldSoulSilver
    case 'PK5':
      return MetadataSource.Black2White2
    case 'PK6':
      return MetadataSource.OmegaRubyAlphaSapphire
    case 'PK7':
      return MetadataSource.UltraSunUltraMoon
    case 'PB7':
      return MetadataSource.LetsGoPikachuEevee
    case 'PK8':
      return MetadataSource.SwordShield
    case 'PB8':
    case 'PB8LUMI':
      return MetadataSource.BrilliantDiamondShiningPearl
    case 'PA8':
      return MetadataSource.LegendsArceus
    case 'PK9':
    case 'PK3RR':
    case 'PK3UB':
      return MetadataSource.ScarletViolet
    case 'PA9':
      return MetadataSource.LegendsZa
    default:
      console.warn(`Unknown format ${format}, defaulting to Scarlet/Violet metadata source`)
      return MetadataSource.ScarletViolet
  }
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
    moves: FourMoves
    movePP: FourMoves
    movePPUps: FourMoves
    format: string
  },
  sourceFormatMon: {
    moves: FourMoves
    movePP: FourMoves
    movePPUps: FourMoves
    format: string
  }
) => {
  return sourceFormatMon.moves.map((move, i) => {
    const otherMaxPP = getMoveMaxPP(move, sourceFormatMon.format, sourceFormatMon.movePPUps[i]) ?? 0
    const thisMaxPP = getMoveMaxPP(move, destFormatMon.format, sourceFormatMon.movePPUps[i]) ?? 0
    const difference = otherMaxPP - thisMaxPP

    return sourceFormatMon.movePP[i] - difference
  }) as FourMoves
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

const HIDDEN_POWER_TYPES: PkmType[] = [
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
  type: PkmType
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
    type: HIDDEN_POWER_TYPES[typeIndex],
    power: basePower,
  }
}

function mostSignificantBit(value: number) {
  return value & 0b1000 ? 1 : 0
}

export function getHiddenPowerType(ivs: Stats): PkmType {
  const numerator =
    [0, ivs.spd, ivs.spa, ivs.spe, ivs.def, ivs.atk, ivs.hp].reduce(
      (prev, value) => (prev << 1) + (value & 1)
    ) * 15

  return HIDDEN_POWER_TYPES[Math.floor(numerator / 63)]
}

export function getHiddenPowerPower(ivs: Stats): number {
  const numerator =
    [0, ivs.spd, ivs.spa, ivs.spe, ivs.def, ivs.atk, ivs.hp].reduce(
      (prev, value) => (prev << 1) + ((value >> 1) & 1)
    ) * 40

  return Math.floor(numerator / 63) + 30
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
