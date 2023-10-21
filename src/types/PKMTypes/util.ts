import bigInt from 'big-integer'
import { max } from 'lodash'
import Prando from 'prando'
import { MOVE_DATA, NDex, POKEMON_DATA, Types } from '../../consts'
import { Nature } from '../../resources/gen/other/Natures'
import { stats, statsPreSplit } from '../../types/types'
import {
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
  uint16ToBytesLittleEndian,
  uint32ToBytesLittleEndian,
  writeUint32ToBuffer,
} from '../../util/ByteLogic'
import { getGen3To5Gender } from '../../util/GenderCalc'
import { BasePKMData } from '../interfaces/base'
import { hasGen3OnData } from '../interfaces/gen3'
import { PKM } from './PKM'

export const writeIVsToBuffer = (
  ivs: stats,
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

export const getAbilityFromNumber = (dexNum: number, formNum: number, abilityNum: number) => {
  if (!POKEMON_DATA[dexNum]?.formes[formNum]) {
    return 'None'
  }
  if (abilityNum === 4) {
    return (
      POKEMON_DATA[dexNum].formes[formNum].abilityH ?? POKEMON_DATA[dexNum].formes[formNum].ability1
    )
  }
  if (abilityNum === 2) {
    return (
      POKEMON_DATA[dexNum].formes[formNum].ability2 ?? POKEMON_DATA[dexNum].formes[formNum].ability1
    )
  }
  return POKEMON_DATA[dexNum].formes[formNum].ability1
}

export const getUnownLetterGen3 = (personalityValue: number) => {
  let letterValue = (personalityValue >> 24) & 0x3
  letterValue = ((personalityValue >> 16) & 0x3) | (letterValue << 2)
  letterValue = ((personalityValue >> 8) & 0x3) | (letterValue << 2)
  letterValue = (personalityValue & 0x3) | (letterValue << 2)
  return letterValue % 28
}

export const generateTeraType = (prng: Prando, dexNum: number, formNum: number) => {
  if (!POKEMON_DATA[dexNum]?.formes[formNum]) {
    return 0
  }
  const { types } = POKEMON_DATA[dexNum].formes[formNum]
  if (!types) {
    return 0
  }
  const typeIndex = prng.nextInt(0, types.length - 1)
  return Types.indexOf(types[typeIndex])
}

export const ivsFromDVs = (dvs: statsPreSplit) => {
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

export const gvsFromIVs = (ivs: stats) => {
  return {
    hp: gvFromIV(ivs.hp),
    atk: gvFromIV(ivs.atk),
    def: gvFromIV(ivs.def),
    spa: gvFromIV(ivs.spa),
    spd: gvFromIV(ivs.spd),
    spe: gvFromIV(ivs.spe),
  }
}

export const dvsFromIVs = (ivs: stats, isShiny: boolean) => {
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

// recursively returns prevo
export const getBaseMon = (dexNum: number, forme: number) => {
  let mon = { dexNumber: dexNum, formeNumber: forme }
  let prevo = POKEMON_DATA[dexNum]?.formes[forme]?.prevo
  while (prevo) {
    mon = prevo
    prevo = POKEMON_DATA[mon.dexNumber]?.formes[mon.formeNumber]?.prevo
  }
  return mon
}

export const formatHasColorMarkings = (format: string) => {
  return (
    (format.charAt(0) === 'p' && ['7', '8', '9'].includes(format.charAt(format.length - 1))) ||
    format === 'OHPKM'
  )
}

export const getTypes = (mon: BasePKMData) => {
  let types = POKEMON_DATA[mon.dexNum]?.formes[mon.formNum]?.types
  if (mon.format === 'PK1' && (mon.dexNum === NDex.MAGNEMITE || mon.dexNum === NDex.MAGNETON)) {
    types = ['Electric']
  } else if (['PK1', 'PK2', 'PK3', 'COLOPKM', 'XDPKM', 'PK4', 'PK5'].includes(mon.format)) {
    if (types?.includes('Fairy')) {
      if (types.length === 1 || types.includes('Flying')) {
        types = types.map((type) => (type === 'Fairy' ? 'Normal' : type))
      } else if (types[0] === 'Fairy') {
        return [types[1]]
      } else {
        return [types[0]]
      }
    }
  }
  return types ?? []
}

export const getMoveMaxPP = (moveIndex: number, format: string, ppUps = 0) => {
  const move = MOVE_DATA[moveIndex]
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
      baseMaxPP = move.pastGenPP?.G3 ?? move.pp
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
  destFormatMon: BasePKMData,
  sourceFormatMon: BasePKMData
) => {
  return sourceFormatMon.moves.map((move, i) => {
    const otherMaxPP = getMoveMaxPP(move, sourceFormatMon.format, sourceFormatMon.movePPUps[i]) ?? 0
    const thisMaxPP = getMoveMaxPP(move, destFormatMon.format, sourceFormatMon.movePPUps[i]) ?? 0
    const adjustedMovePP = sourceFormatMon.movePP[i] - (otherMaxPP - thisMaxPP)
    return max([adjustedMovePP, 0]) ?? 0
  }) as [number, number, number, number]
}

export const getSixDigitTID = (tid: number, sid: number) => {
  const bytes = new Uint8Array(4)
  bytes.set(uint16ToBytesLittleEndian(tid), 0)
  bytes.set(uint16ToBytesLittleEndian(sid), 2)
  return bytesToUint32LittleEndian(bytes, 0x0c) % 1000000
}

const getIsShinyPreGen6 = (trainerID: number, secretID: number, personalityValue: number) =>
  (trainerID ^ secretID ^ ((personalityValue >> 16) & 0xffff) ^ (personalityValue & 0xffff)) < 8

export const generatePersonalityValuePreservingAttributes = (
  mon: PKM,
  prng: Prando = new Prando()
) => {
  let personalityValue = 0
  let otherNature: Nature | undefined
  let otherAbilityNum = 4
  if (hasGen3OnData(mon)) {
    personalityValue = mon.personalityValue
    otherNature = mon.nature
    otherAbilityNum = mon.abilityNum
  } else {
    personalityValue = prng.nextInt(0, 0xffffffff)
  }

  if ('statNature' in mon) {
    otherNature = mon.statNature
  }
  // xoring the other three values with this to calculate upper half of personality value
  // will ensure shininess or non-shininess depending on original mon
  const otherGender = mon.gender
  let i = 0
  let newPersonalityValue = bigInt(personalityValue)
  const shouldCheckUnown = mon.dexNum === NDex.UNOWN
  while (i < 0x10000) {
    const newGender = getGen3To5Gender(newPersonalityValue.toJSNumber(), mon.dexNum)
    const newNature = newPersonalityValue.mod(25).toJSNumber()
    if (
      (!shouldCheckUnown || getUnownLetterGen3(newPersonalityValue.toJSNumber()) === mon.formNum) &&
      newGender === otherGender &&
      (otherAbilityNum === 4 ||
        shouldCheckUnown ||
        newPersonalityValue.and(1).add(1).toJSNumber() === otherAbilityNum) &&
      (otherNature === undefined || newNature === otherNature) &&
      getIsShinyPreGen6(mon.trainerID, mon.secretID, newPersonalityValue.toJSNumber()) ===
        mon.isShiny
    ) {
      return newPersonalityValue.toJSNumber()
    }
    i++
    const pvBytes = uint32ToBytesLittleEndian(personalityValue)
    let pvLower16, pvUpper16
    if (mon.dexNum === NDex.UNOWN) {
      pvLower16 = prng.nextInt(0, 0xffff)
      pvUpper16 = prng.nextInt(0, 0xffff)
      if (mon.isShiny) {
        pvUpper16 = ((mon.trainerID ^ mon.secretID ^ pvLower16) & 0xfcfc) | (pvUpper16 & 0x0303)
      }
    } else {
      pvLower16 = bytesToUint16LittleEndian(pvBytes, 0)
      pvUpper16 = bytesToUint16LittleEndian(pvBytes, 2)
      pvLower16 ^= i
      if (mon.isShiny) {
        pvUpper16 = mon.trainerID ^ mon.secretID ^ pvLower16
      }
    }
    pvBytes.set(uint16ToBytesLittleEndian(pvUpper16), 2)
    pvBytes.set(uint16ToBytesLittleEndian(pvLower16), 0)
    newPersonalityValue = bigInt(bytesToUint32LittleEndian(pvBytes, 0))
  }
  return personalityValue
}
