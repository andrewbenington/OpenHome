import {
  AbilityFromString,
  AbilityToString,
  Ball,
  GameOfOrigin,
  GameOfOriginData,
  Gen7KantoLocations,
  ItemFromString,
  ItemToString,
  Languages,
  isAlola,
  isKanto,
} from 'pokemon-resources'
import {
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
  getFlag,
  setFlag,
  uint16ToBytesLittleEndian,
  uint32ToBytesLittleEndian,
} from '../../util/ByteLogic'
import { getHPGen3Onward, getLevelGen3Onward, getStatGen3Onward } from '../../util/StatCalc'
import { utf16BytesToString, utf16StringToBytes } from '../../util/Strings/StringConverter'
import { BasePKMData } from '../interfaces/base'
import { SanityChecksum } from '../interfaces/gen3'
import { Gen7OnData, LetsGoData, Size } from '../interfaces/gen7'
import { hyperTrainStats, marking, memory, pokedate, stats } from '../types'
import { OHPKM } from './OHPKM'
import { adjustMovePPBetweenFormats, writeIVsToBuffer } from './util'

export const LGPE_MOVE_MAX = 742

export class PB7
  implements
    BasePKMData,
    LetsGoData,
    Omit<
      Gen7OnData,
      'ribbons' | 'contest' | 'contestMemoryCount' | 'battleMemoryCount' | 'trainerMemory'
    >,
    SanityChecksum,
    Size
{
  public get fileSize() {
    return 232
  }

  get markingCount(): number {
    return 6
  }

  get markingColors(): number {
    return 2
  }

  bytes = new Uint8Array(232)

  constructor(bytes?: Uint8Array, encrypted?: boolean, other?: OHPKM) {
    if (bytes) {
      if (encrypted) {
        throw new Error('PB7 decryption not implemented')
      } else {
        this.bytes = bytes
      }
      // this.refreshChecksum();
    } else if (other) {
      this.encryptionConstant = other.encryptionConstant
      this.dexNum = other.dexNum
      this.exp = other.exp
      this.heldItem = other.heldItem
      this.trainerID = other.trainerID
      this.secretID = other.secretID
      this.ability = other.ability
      this.abilityNum = other.abilityNum
      this.personalityValue = other.personalityValue
      this.nature = other.nature
      this.isFatefulEncounter = other.isFatefulEncounter
      this.formNum = other.formNum
      this.gender = other.gender
      this.evs = other.evs
      this.avs = other.avs
      this.markings = other.markings
      this.pokerusByte = other.pokerusByte
      this.weight = other.weight
      this.height = other.height
      this.formArgument = other.formArgument
      this.nickname = other.nickname
      // filtering out moves that didnt exist yet
      const validMoves = other.moves.filter((move) => move <= LGPE_MOVE_MAX)
      const validMovePP = adjustMovePPBetweenFormats(this, other).filter(
        (_, i) => other.moves[i] <= LGPE_MOVE_MAX
      )
      const validMovePPUps = other.movePPUps.filter((_, i) => other.moves[i] <= LGPE_MOVE_MAX)
      const validRelearnMoves = other.relearnMoves.filter((_, i) => other.moves[i] <= LGPE_MOVE_MAX)
      this.moves = [validMoves[0], validMoves[1], validMoves[2], validMoves[3]]
      this.movePP = [validMovePP[0], validMovePP[1], validMovePP[2], validMovePP[3]]
      this.movePPUps = [validMovePPUps[0], validMovePPUps[1], validMovePPUps[2], validMovePPUps[3]]
      this.relearnMoves = [
        validRelearnMoves[0],
        validRelearnMoves[1],
        validRelearnMoves[2],
        validRelearnMoves[3],
      ]
      this.ivs = other.ivs
      this.isEgg = other.isEgg
      this.isNicknamed = other.isNicknamed
      this.handlerName = other.handlerName
      this.handlerGender = other.handlerGender
      this.isCurrentHandler = true
      this.handlerFriendship = other.handlerFriendship
      this.handlerMemory = other.handlerMemory
      this.fullness = other.fullness
      this.enjoyment = other.enjoyment
      this.trainerName = other.trainerName
      this.trainerFriendship = other.trainerFriendship
      this.eggDate = other.eggDate
      this.metDate = other.metDate
      this.eggLocationIndex = other.eggLocationIndex
      this.metLocationIndex = other.metLocationIndex
      this.ball =
        (other.ball && other.ball <= Ball.Poke) || other.ball === Ball.Premier
          ? other.ball
          : Ball.Poke
      this.metLevel = other.metLevel ?? this.level
      this.trainerGender = other.trainerGender
      this.hyperTraining = other.hyperTraining
      this.gameOfOrigin = other.gameOfOrigin
      this.language = other.language
      this.currentHP = this.stats.hp
    }
  }

  public get format() {
    return 'PB7'
  }

  public get encryptionConstant() {
    return bytesToUint32LittleEndian(this.bytes, 0x00)
  }

  public set encryptionConstant(value: number) {
    this.bytes.set(uint32ToBytesLittleEndian(value), 0x00)
  }

  public get sanity() {
    return bytesToUint16LittleEndian(this.bytes, 0x04)
  }

  public get checksum() {
    return bytesToUint16LittleEndian(this.bytes, 0x06)
  }

  public get dexNum() {
    return bytesToUint16LittleEndian(this.bytes, 0x08)
  }

  public set dexNum(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x08)
  }

  public get exp() {
    return bytesToUint32LittleEndian(this.bytes, 0x10)
  }

  public set exp(value: number) {
    this.bytes.set(uint32ToBytesLittleEndian(value), 0x10)
  }

  public get level() {
    return this.dexNum > 0 ? getLevelGen3Onward(this.dexNum, this.exp) : 0
  }

  public get heldItemIndex() {
    return bytesToUint16LittleEndian(this.bytes, 0x0a)
  }

  public set heldItemIndex(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x0a)
  }

  public get heldItem() {
    return ItemToString(this.heldItemIndex)
  }

  public set heldItem(value: string) {
    const itemIndex = ItemFromString(value)
    if (itemIndex > -1) {
      this.heldItemIndex = itemIndex
    }
  }

  public get trainerID() {
    return bytesToUint16LittleEndian(this.bytes, 0x0c)
  }

  public set trainerID(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x0c)
  }

  public get secretID() {
    return bytesToUint16LittleEndian(this.bytes, 0x0e)
  }

  public set secretID(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x0e)
  }

  public get displayID() {
    return isAlola(this.gameOfOrigin) || this.gameOfOrigin >= GameOfOrigin.LetsGoPikachu
      ? bytesToUint32LittleEndian(this.bytes, 0x0c) % 1000000
      : this.trainerID
  }

  public get abilityIndex() {
    return this.bytes[0x14]
  }

  public set abilityIndex(value: number) {
    this.bytes[0x14] = value
  }

  public get ability() {
    return AbilityToString(this.abilityIndex)
  }

  public set ability(value: string) {
    this.abilityIndex = AbilityFromString(value)
  }

  public get abilityNum() {
    return this.bytes[0x15] & 0b111
  }

  public set abilityNum(value: number) {
    this.bytes[0x15] = (this.bytes[0x15] & 0b11111000) | (value & 0b111)
  }

  public get favorite() {
    return getFlag(this.bytes, 0x15, 3)
  }

  public set favorite(value: boolean) {
    setFlag(this.bytes, 0x15, 3, value)
  }

  public get markings() {
    const markingsValue = bytesToUint16LittleEndian(this.bytes, 0x16)
    return [
      markingsValue & 3,
      (markingsValue >> 2) & 3,
      (markingsValue >> 4) & 3,
      (markingsValue >> 6) & 3,
      (markingsValue >> 8) & 3,
      (markingsValue >> 10) & 3,
    ] as any as [marking, marking, marking, marking, marking, marking]
  }

  public set markings(value: [marking, marking, marking, marking, marking, marking]) {
    let markingsValue = 0
    for (let i = 0; i < 6; i++) {
      const shift = i * 2
      markingsValue = (markingsValue & (0xffff ^ (3 << shift))) | (value[i] << shift)
    }
    this.bytes.set(uint16ToBytesLittleEndian(markingsValue), 0x16)
  }

  public get personalityValue() {
    return bytesToUint32LittleEndian(this.bytes, 0x18)
  }

  public set personalityValue(value: number) {
    this.bytes.set(uint32ToBytesLittleEndian(value), 0x18)
  }

  public get nature() {
    return this.bytes[0x1c]
  }

  public set nature(value: number) {
    this.bytes[0x1c] = value
  }

  public get isFatefulEncounter() {
    return getFlag(this.bytes, 0x1d, 0)
  }

  public set isFatefulEncounter(value: boolean) {
    setFlag(this.bytes, 0x1d, 0, value)
  }

  public get gender() {
    return (this.bytes[0x1d] >> 1) & 0b11
  }

  public set gender(value: number) {
    this.bytes[0x01d] = (this.bytes[0x01d] & 0b11111001) | ((value & 0b11) << 1)
  }

  public get formNum() {
    return this.bytes[0x1d] >> 3
  }

  public set formNum(value: number) {
    this.bytes[0x1d] = (this.bytes[0x1d] & 0b111) | (value << 3)
  }

  public get evs() {
    return {
      hp: this.bytes[0x1e],
      atk: this.bytes[0x1f],
      def: this.bytes[0x20],
      spe: this.bytes[0x21],
      spa: this.bytes[0x22],
      spd: this.bytes[0x23],
    }
  }

  public set evs(value: stats) {
    this.bytes[0x1e] = value.hp
    this.bytes[0x1f] = value.atk
    this.bytes[0x20] = value.def
    this.bytes[0x21] = value.spe
    this.bytes[0x22] = value.spa
    this.bytes[0x23] = value.spd
  }

  public get avs() {
    return {
      hp: this.bytes[0x24],
      atk: this.bytes[0x25],
      def: this.bytes[0x26],
      spe: this.bytes[0x27],
      spa: this.bytes[0x28],
      spd: this.bytes[0x29],
    }
  }

  public set avs(value: stats) {
    this.bytes[0x24] = value.hp
    this.bytes[0x25] = value.atk
    this.bytes[0x26] = value.def
    this.bytes[0x27] = value.spe
    this.bytes[0x28] = value.spa
    this.bytes[0x29] = value.spd
  }

  public get contest() {
    return {
      cool: 0,
      beauty: 0,
      cute: 0,
      smart: 0,
      tough: 0,
      sheen: 0,
    }
  }

  public get ribbons(): string[] {
    return []
  }

  public get resortEventStatus() {
    return this.bytes[0x2a]
  }

  public set resortEventStatus(value: number) {
    this.bytes[0x2a] = value
  }

  public get pokerusByte() {
    return this.bytes[0x2b]
  }

  public set pokerusByte(value: number) {
    this.bytes[0x2b] = value
  }

  public get height() {
    return this.bytes[0x3a]
  }

  public set height(value: number) {
    this.bytes[0x3a] = value
  }

  public get weight() {
    return this.bytes[0x3b]
  }

  public set weight(value: number) {
    this.bytes[0x3b] = value
  }

  public get formArgument() {
    return bytesToUint32LittleEndian(this.bytes, 0x3c)
  }

  public set formArgument(value: number) {
    this.bytes.set(uint32ToBytesLittleEndian(value), 0x3c)
  }

  public get nickname() {
    return utf16BytesToString(this.bytes, 0x40, 12)
  }

  public set nickname(value: string) {
    const utfBytes = utf16StringToBytes(value, 12)
    this.bytes.set(utfBytes, 0x40)
  }

  public get moves() {
    return [
      bytesToUint16LittleEndian(this.bytes, 0x5a),
      bytesToUint16LittleEndian(this.bytes, 0x5c),
      bytesToUint16LittleEndian(this.bytes, 0x5e),
      bytesToUint16LittleEndian(this.bytes, 0x60),
    ]
  }

  public set moves(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes.set(uint16ToBytesLittleEndian(value[i]), 0x5a + 2 * i)
    }
  }

  public get movePP() {
    return [this.bytes[0x62], this.bytes[0x63], this.bytes[0x64], this.bytes[0x65]]
  }

  public set movePP(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes[0x62 + i] = value[i]
    }
  }

  public get movePPUps() {
    return [this.bytes[0x66], this.bytes[0x67], this.bytes[0x68], this.bytes[0x69]]
  }

  public set movePPUps(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes[0x66 + i] = value[i]
    }
  }

  public get relearnMoves() {
    return [
      bytesToUint16LittleEndian(this.bytes, 0x6a),
      bytesToUint16LittleEndian(this.bytes, 0x6c),
      bytesToUint16LittleEndian(this.bytes, 0x6e),
      bytesToUint16LittleEndian(this.bytes, 0x70),
    ]
  }

  public set relearnMoves(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes.set(uint16ToBytesLittleEndian(value[i]), 0x6a + 2 * i)
    }
  }

  public get ivs() {
    const ivBytes = bytesToUint32LittleEndian(this.bytes, 0x74)
    return {
      hp: ivBytes & 0x1f,
      atk: (ivBytes >> 5) & 0x1f,
      def: (ivBytes >> 10) & 0x1f,
      spe: (ivBytes >> 15) & 0x1f,
      spa: (ivBytes >> 20) & 0x1f,
      spd: (ivBytes >> 25) & 0x1f,
    }
  }

  public set ivs(value: stats) {
    writeIVsToBuffer(value, this.bytes, 0x74, this.isEgg, this.isNicknamed)
  }

  public get isEgg() {
    return getFlag(this.bytes, 0x74, 30)
  }

  public set isEgg(value: boolean) {
    setFlag(this.bytes, 0x74, 30, value)
  }

  public get isNicknamed() {
    return getFlag(this.bytes, 0x74, 31)
  }

  public set isNicknamed(value: boolean) {
    setFlag(this.bytes, 0x74, 31, value)
  }

  public get handlerName() {
    return utf16BytesToString(this.bytes, 0x78, 12)
  }

  public set handlerName(value: string) {
    const utfBytes = utf16StringToBytes(value, 12)
    this.bytes.set(utfBytes, 0x78)
  }

  public get handlerGender() {
    return !!this.bytes[0x92]
  }

  public set handlerGender(value: boolean) {
    this.bytes[0x92] = value ? 1 : 0
  }

  public get isCurrentHandler() {
    return !!this.bytes[0x93]
  }

  public set isCurrentHandler(value: boolean) {
    this.bytes[0x92] = value ? 1 : 0
  }
  public get handlerFriendship() {
    return this.bytes[0xa2]
  }

  public set handlerFriendship(value: number) {
    this.bytes[0xa2] = value
  }

  public get handlerMemory() {
    return {
      intensity: this.bytes[0xa4],
      memory: this.bytes[0xa5],
      feeling: this.bytes[0xa6],
      textVariables: bytesToUint16LittleEndian(this.bytes, 0xa8),
    }
  }

  public set handlerMemory(value: memory) {
    this.bytes[0xa4] = value.intensity
    this.bytes[0xa5] = value.memory
    this.bytes[0xa6] = value.feeling
    this.bytes.set(uint16ToBytesLittleEndian(value.textVariables), 0xa8)
  }

  public get fieldEventFatigue1() {
    return this.bytes[0xac]
  }

  public set fieldEventFatigue1(value: number) {
    this.bytes[0xac] = value
  }

  public get fieldEventFatigue2() {
    return this.bytes[0xad]
  }

  public set fieldEventFatigue2(value: number) {
    this.bytes[0xad] = value
  }

  public get fullness() {
    return this.bytes[0xae]
  }

  public set fullness(value: number) {
    this.bytes[0xae] = value
  }

  public get enjoyment() {
    return this.bytes[0xaf]
  }

  public set enjoyment(value: number) {
    this.bytes[0xaf] = value
  }

  public get trainerName() {
    return utf16BytesToString(this.bytes, 0xb0, 12)
  }

  public set trainerName(value: string) {
    const utfBytes = utf16StringToBytes(value, 12)
    this.bytes.set(utfBytes, 0xb0)
  }

  public get trainerFriendship() {
    return this.bytes[0xca]
  }

  public set trainerFriendship(value: number) {
    this.bytes[0xca] = value
  }

  public get eggDate() {
    return this.bytes[0xd1]
      ? {
          year: this.bytes[0xd1] + 2000,
          month: this.bytes[0xd2],
          day: this.bytes[0xd3],
        }
      : undefined
  }

  public set eggDate(value: pokedate | undefined) {
    if (value) {
      this.bytes[0xd1] = value.year - 2000
      this.bytes[0xd2] = value.month
      this.bytes[0xd3] = value.day
    } else {
      this.bytes[0xd1] = 0
      this.bytes[0xd2] = 0
      this.bytes[0xd3] = 0
    }
  }

  public get metDate() {
    return {
      year: this.bytes[0xd4] + 2000,
      month: this.bytes[0xd5],
      day: this.bytes[0xd6],
    }
  }

  public set metDate(value: pokedate) {
    this.bytes[0xd4] = value.year - 2000
    this.bytes[0xd5] = value.month
    this.bytes[0xd6] = value.day
  }
  public get eggLocationIndex() {
    return bytesToUint16LittleEndian(this.bytes, 0xd8)
  }

  public set eggLocationIndex(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0xd8)
  }

  public get eggLocation() {
    if (!this.eggLocationIndex) {
      return undefined
    }
    if (!isAlola(this.gameOfOrigin)) {
      return this.gameOfOrigin <= GameOfOrigin.OmegaRuby ||
        (this.gameOfOrigin >= GameOfOrigin.Red && this.gameOfOrigin <= GameOfOrigin.Crystal)
        ? `from the ${GameOfOriginData[this.gameOfOrigin]?.region} region`
        : 'from a faraway place'
    }
    const locationBlock = Gen7KantoLocations[Math.floor(this.eggLocationIndex / 10000) * 10000]
    return `from ${locationBlock[this.eggLocationIndex % 10000]}`
  }

  public get metLocationIndex() {
    return bytesToUint16LittleEndian(this.bytes, 0xda)
  }

  public set metLocationIndex(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0xda)
  }

  public get metLocation() {
    if (!isKanto(this.gameOfOrigin)) {
      return this.gameOfOrigin <= GameOfOrigin.UltraMoon ||
        (this.gameOfOrigin >= GameOfOrigin.Red && this.gameOfOrigin <= GameOfOrigin.Crystal)
        ? `in the ${GameOfOriginData[this.gameOfOrigin]?.region} region`
        : 'in a faraway place'
    }
    const locationBlock =
      Gen7KantoLocations[Math.floor(this.metLocationIndex / 10000) * 10000] ?? Gen7KantoLocations[0]
    return `in ${locationBlock[this.metLocationIndex % 10000]}`
  }

  public get ball() {
    return this.bytes[0xdc]
  }

  public set ball(value: number) {
    this.bytes[0xdc] = value
  }

  public get metLevel() {
    return this.bytes[0xdd] & 0x7f
  }

  public set metLevel(value: number) {
    this.bytes[0xdd] = (this.bytes[0xdd] & 0x80) | (value & 0x7f)
  }

  public get trainerGender() {
    return getFlag(this.bytes, 0xdd, 7) ? 1 : 0
  }

  public set trainerGender(value: number) {
    setFlag(this.bytes, 0xdd, 7, !!value)
  }

  public get hyperTraining() {
    return {
      hp: getFlag(this.bytes, 0xde, 0),
      atk: getFlag(this.bytes, 0xde, 1),
      def: getFlag(this.bytes, 0xde, 2),
      spa: getFlag(this.bytes, 0xde, 3),
      spd: getFlag(this.bytes, 0xde, 4),
      spe: getFlag(this.bytes, 0xde, 5),
    }
  }

  public set hyperTraining(value: hyperTrainStats) {
    setFlag(this.bytes, 0xde, 0, value.hp)
    setFlag(this.bytes, 0xde, 1, value.atk)
    setFlag(this.bytes, 0xde, 2, value.def)
    setFlag(this.bytes, 0xde, 3, value.spa)
    setFlag(this.bytes, 0xde, 4, value.spd)
    setFlag(this.bytes, 0xde, 5, value.spe)
  }

  public get gameOfOrigin() {
    return this.bytes[0xdf]
  }

  public set gameOfOrigin(value: number) {
    this.bytes[0xdf] = value
  }

  public get languageIndex() {
    return this.bytes[0xe3]
  }

  public get language() {
    return Languages[this.languageIndex]
  }

  public set language(value: string) {
    const index = Languages.indexOf(value)
    if (index > -1) {
      this.bytes[0xe3] = index
    }
  }

  public get isShiny() {
    return (
      (this.trainerID ^
        this.secretID ^
        bytesToUint16LittleEndian(this.bytes, 0x18) ^
        bytesToUint16LittleEndian(this.bytes, 0x1a)) <
      16
    )
  }

  public get isSquareShiny() {
    return !(
      this.trainerID ^
      this.secretID ^
      bytesToUint16LittleEndian(this.bytes, 0x18) ^
      bytesToUint16LittleEndian(this.bytes, 0x1a)
    )
  }

  public get stats(): stats {
    return {
      hp: getHPGen3Onward(this),
      atk: getStatGen3Onward('Atk', this),
      def: getStatGen3Onward('Def', this),
      spe: getStatGen3Onward('Spe', this),
      spa: getStatGen3Onward('SpA', this),
      spd: getStatGen3Onward('SpD', this),
    }
  }

  public get statusCondition() {
    return this.bytes[0xe8]
  }

  public set statusCondition(value: number) {
    this.bytes[0xe8] = value
  }

  public get currentHP() {
    return this.bytes[0xf0]
  }

  public set currentHP(value: number) {
    this.bytes[0xf0] = value
  }
}
