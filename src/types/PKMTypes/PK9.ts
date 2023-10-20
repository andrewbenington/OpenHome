import { Ball, GameOfOrigin, GameOfOriginData, Languages, isPaldea } from '../../consts'
import SVMetLocation from '../../consts/MetLocation/SV'
import { Gen9Ribbons } from '../../consts/Ribbons'
import { ItemFromString, ItemToString } from '../../resources/gen/items/Items'
import { AbilityFromString, AbilityToString } from '../../resources/gen/other/Abilities'
import {
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
  getFlag,
  setFlag,
  uint16ToBytesLittleEndian,
  uint32ToBytesLittleEndian,
} from '../../util/ByteLogic'
import { natDexToSV, svToNatDex } from '../../util/ConvertPokemonID'
import { getHPGen3Onward, getLevelGen3Onward, getStatGen3Onward } from '../../util/StatCalc'
import { utf16BytesToString, utf16StringToBytes } from '../../util/Strings/StringConverter'
import { BasePKMData } from '../interfaces/base'
import { SanityChecksum } from '../interfaces/gen3'
import { Gen8OnData } from '../interfaces/gen8'
import { Gen9OnlyData } from '../interfaces/gen9'
import { contestStats, hyperTrainStats, marking, memory, pokedate, stats } from '../types'
import { OHPKM } from './OHPKM'
import { adjustMovePPBetweenFormats, writeIVsToBuffer } from './util'

const SV_MOVE_MAX = 904

export class PK9 implements BasePKMData, Gen8OnData, Gen9OnlyData, SanityChecksum {
  public get fileSize() {
    return 344
  }

  get markingCount(): number {
    return 6
  }

  get markingColors(): number {
    return 2
  }

  bytes = new Uint8Array(344)

  constructor(bytes?: Uint8Array, encrypted?: boolean, other?: OHPKM) {
    if (bytes) {
      if (encrypted) {
        throw new Error('PK9 decryption not implemented')
      } else {
        this.bytes = bytes
      }
      // this.refreshChecksum();
    } else if (other) {
      this.encryptionConstant = other.encryptionConstant
      this.dexNum = other.dexNum
      this.heldItemIndex = 0
      this.trainerID = other.trainerID
      this.secretID = other.secretID
      this.exp = other.exp
      this.ability = other.ability
      this.abilityNum = other.abilityNum
      this.favorite = other.favorite
      this.canGigantamax = other.canGigantamax ?? false
      if (other.markings) {
        other.markings?.forEach((value, index) => {
          const temp = this.markings
          temp[index] = value
          this.markings = temp
        })
      }
      this.personalityValue = other.personalityValue
      this.nature = other.nature
      this.statNature = other.statNature
      this.isFatefulEncounter = other.isFatefulEncounter
      this.gender = other.gender
      this.formNum = other.formNum
      this.evs = other.evs
      this.contest = other.contest
      this.pokerusByte = other.pokerusByte
      this.ribbons = other.ribbons
      this.contestMemoryCount = other.contestMemoryCount
      this.battleMemoryCount = other.battleMemoryCount
      this.height = other.height
      this.weight = other.weight
      this.nickname = other.nickname
      // filtering out moves that didnt exist yet
      const validMoves = other.moves.filter((move) => move <= SV_MOVE_MAX)
      const validMovePP = adjustMovePPBetweenFormats(this, other).filter(
        (_, i) => other.moves[i] <= SV_MOVE_MAX
      )
      const validMovePPUps = other.movePPUps.filter((_, i) => other.moves[i] <= SV_MOVE_MAX)
      const validRelearnMoves = other.relearnMoves.filter((_, i) => other.moves[i] <= SV_MOVE_MAX)
      this.moves = [validMoves[0], validMoves[1], validMoves[2], validMoves[3]]
      this.movePP = [validMovePP[0], validMovePP[1], validMovePP[2], validMovePP[3]]
      this.movePPUps = [validMovePPUps[0], validMovePPUps[1], validMovePPUps[2], validMovePPUps[3]]
      this.relearnMoves = [
        validRelearnMoves[0],
        validRelearnMoves[1],
        validRelearnMoves[2],
        validRelearnMoves[3],
      ]
      this.currentHP = other.currentHP
      this.ivs = other.ivs
      this.isEgg = other.isEgg
      this.isNicknamed = other.isNicknamed
      this.statusCondition = other.statusCondition
      this.handlerName = other.handlerName
      this.handlerGender = other.handlerGender
      this.handlerLanguage = other.handlerLanguage
      this.isCurrentHandler = other.isCurrentHandler
      this.handlerID = other.handlerID
      this.handlerFriendship = other.handlerFriendship
      this.handlerMemory = other.handlerMemory
      this.gameOfOrigin = other.gameOfOrigin
      this.gameOfOriginBattle = other.gameOfOriginBattle
      this.language = other.language
      this.formArgument = other.formArgument
      this.affixedRibbon = other.affixedRibbon
      this.tmFlagsSVDLC = other.tmFlagsSVDLC
      this.trainerName = other.trainerName
      this.trainerFriendship = other.trainerFriendship
      this.trainerMemory = other.trainerMemory
      this.eggDate = other.eggDate
      this.metDate = other.metDate
      this.eggLocationIndex = other.eggLocationIndex
      this.metLocationIndex = other.metLocationIndex
      this.ball = other.ball < Ball.Strange ? other.ball : Ball.Poke
      this.metLevel = other.metLevel
      this.trainerGender = other.trainerGender
      this.hyperTraining = other.hyperTraining
      this.homeTracker = other.homeTracker
      this.tmFlagsSV = other.tmFlagsSV
      this.statusCondition = other.statusCondition
      this.teraTypeOriginal = other.teraTypeOriginal
      this.teraTypeOverride = other.teraTypeOverride
    }
  }

  public get format() {
    return 'PK8'
  }

  public get encryptionConstant() {
    return bytesToUint32LittleEndian(this.bytes, 0x00)
  }

  public set encryptionConstant(value: number) {
    this.bytes.set(uint32ToBytesLittleEndian(value), 0x0)
  }

  public get sanity() {
    return bytesToUint16LittleEndian(this.bytes, 0x04)
  }

  public get checksum() {
    return bytesToUint16LittleEndian(this.bytes, 0x06)
  }

  public set checksum(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x6)
  }

  public get dexNum() {
    return svToNatDex(bytesToUint16LittleEndian(this.bytes, 0x08))
  }

  public set dexNum(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(natDexToSV(value)), 0x08)
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
    return bytesToUint32LittleEndian(this.bytes, 0x0c) % 1000000
  }

  public get exp() {
    return bytesToUint32LittleEndian(this.bytes, 0x10)
  }

  public set exp(value: number) {
    this.bytes.set(uint32ToBytesLittleEndian(value), 0x10)
  }

  public get level() {
    return getLevelGen3Onward(this.dexNum, this.exp)
  }

  public get abilityIndex() {
    return bytesToUint16LittleEndian(this.bytes, 0x14)
  }

  public set abilityIndex(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x14)
  }

  public get ability() {
    return AbilityToString(this.abilityIndex)
  }

  public set ability(value: string) {
    const abilityIndex = AbilityFromString(value)
    if (abilityIndex > -1) {
      this.abilityIndex = abilityIndex
    }
  }

  public get abilityNum() {
    return this.bytes[0x16] & 7
  }

  public set abilityNum(value: number) {
    this.bytes[0x16] = (this.bytes[0x16] & ~7) | (value & 7)
  }

  public get favorite() {
    return !!(this.bytes[0x16] & 8)
  }

  public set favorite(value: boolean) {
    this.bytes[0x16] = (this.bytes[0x16] & ~8) | (value ? 8 : 0)
  }

  public get canGigantamax() {
    return !!(this.bytes[0x16] & 16)
  }

  public set canGigantamax(value: boolean) {
    this.bytes[0x16] = (this.bytes[0x16] & ~16) | (value ? 16 : 0)
  }

  public get markings() {
    const markingsValue = bytesToUint16LittleEndian(this.bytes, 0x18)
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
    this.bytes.set(uint16ToBytesLittleEndian(markingsValue), 0x18)
  }

  public get personalityValue() {
    return bytesToUint32LittleEndian(this.bytes, 0x1c)
  }

  public set personalityValue(value: number) {
    this.bytes.set(uint32ToBytesLittleEndian(value), 0x1c)
  }

  public get nature() {
    return this.bytes[0x20]
  }

  public set nature(value: number) {
    this.bytes[0x20] = value
  }

  public get statNature() {
    return this.bytes[0x21]
  }

  public set statNature(value: number) {
    this.bytes[0x21] = value
  }

  public get isFatefulEncounter() {
    return getFlag(this.bytes, 0x22, 0)
  }

  public set isFatefulEncounter(value: boolean) {
    setFlag(this.bytes, 0x22, 0, value)
  }

  public get gender() {
    return (this.bytes[0x22] >> 1) & 0x3
  }

  public set gender(value: number) {
    this.bytes[0x22] = (this.bytes[0x22] & 0xf9) | (value << 1)
  }

  public get formNum() {
    return bytesToUint16LittleEndian(this.bytes, 0x24)
  }

  public set formNum(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x24)
  }

  public get evs() {
    return {
      hp: this.bytes[0x26],
      atk: this.bytes[0x27],
      def: this.bytes[0x28],
      spa: this.bytes[0x29],
      spd: this.bytes[0x2a],
      spe: this.bytes[0x2b],
    }
  }

  public set evs(value: stats) {
    this.bytes[0x26] = value.hp
    this.bytes[0x27] = value.atk
    this.bytes[0x28] = value.def
    this.bytes[0x29] = value.spa
    this.bytes[0x2a] = value.spd
    this.bytes[0x2b] = value.spe
  }

  public get contest() {
    return {
      cool: this.bytes[0x2c],
      beauty: this.bytes[0x2d],
      cute: this.bytes[0x2e],
      smart: this.bytes[0x2f],
      tough: this.bytes[0x30],
      sheen: this.bytes[0x31],
    }
  }

  public set contest(value: contestStats) {
    this.bytes[0x2c] = value.cool
    this.bytes[0x2d] = value.beauty
    this.bytes[0x2e] = value.cute
    this.bytes[0x2f] = value.smart
    this.bytes[0x30] = value.tough
    this.bytes[0x31] = value.sheen
  }

  public get pokerusByte() {
    return this.bytes[0x32]
  }

  public set pokerusByte(value: number) {
    this.bytes[0x32] = value
  }

  public get ribbonBytes() {
    const rBytes = new Uint8Array(16)
    rBytes.set(this.bytes.slice(0x34, 0x3a), 0)
    rBytes.set(this.bytes.slice(0x40, 0x48), 8)
    return rBytes
  }

  public set ribbonBytes(value: Uint8Array) {
    this.bytes.set(value.slice(0, 8), 0x34)
    this.bytes.set(value.slice(8, 16), 0x40)
  }

  public get ribbons() {
    const ribbons: string[] = []
    for (let i = 0; i <= Gen9Ribbons.length; i++) {
      if (getFlag(this.bytes, i >= 64 ? 0x40 : 0x34, i % 64)) {
        ribbons.push(Gen9Ribbons[i])
      }
    }
    return ribbons
  }

  public set ribbons(value: string[]) {
    value.forEach((ribbon) => {
      const index = Gen9Ribbons.indexOf(ribbon)
      if (index > 0) {
        setFlag(this.bytes, index >= 64 ? 0x40 : 0x34, index - 64, true)
      }
    })
  }

  public get contestMemoryCount() {
    return this.bytes[0x3c]
  }

  public set contestMemoryCount(value: number) {
    this.bytes[0x3c] = value
  }

  public get battleMemoryCount() {
    return this.bytes[0x3d]
  }

  public set battleMemoryCount(value: number) {
    this.bytes[0x3d] = value
  }

  public get height() {
    return this.bytes[0x48]
  }

  public set height(value: number) {
    this.bytes[0x48] = value
  }

  public get weight() {
    return this.bytes[0x49]
  }

  public set weight(value: number) {
    this.bytes[0x49] = value
  }

  public get scale() {
    return this.bytes[0x4a]
  }

  public set scale(value: number) {
    this.bytes[0x4a] = value
  }

  public get tmFlagsSVDLC() {
    return this.bytes.slice(0x4b, 0x4b + 13)
  }

  public set tmFlagsSVDLC(value: Uint8Array) {
    this.bytes.set(value.slice(0, 13), 0x4b)
  }

  public get nicknameBytes() {
    return this.bytes.slice(0x58, 26)
  }

  public get nickname() {
    return utf16BytesToString(this.bytes, 0x58, 12)
  }

  public set nickname(value: string) {
    const utfBytes = utf16StringToBytes(value, 12)
    this.bytes.set(utfBytes, 0x58)
  }

  public get moves() {
    return [
      bytesToUint16LittleEndian(this.bytes, 0x72),
      bytesToUint16LittleEndian(this.bytes, 0x74),
      bytesToUint16LittleEndian(this.bytes, 0x76),
      bytesToUint16LittleEndian(this.bytes, 0x78),
    ]
  }

  public set moves(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes.set(uint16ToBytesLittleEndian(value[i]), 0x72 + 2 * i)
    }
  }

  public get movePP() {
    return [this.bytes[0x7a], this.bytes[0x7b], this.bytes[0x7c], this.bytes[0x7d]]
  }

  public set movePP(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes[0x7a + i] = value[i]
    }
  }

  public get movePPUps() {
    return [this.bytes[0x7e], this.bytes[0x7f], this.bytes[0x80], this.bytes[0x81]]
  }

  public set movePPUps(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes[0x7e + i] = value[i]
    }
  }

  public get relearnMoves() {
    return [
      bytesToUint16LittleEndian(this.bytes, 0x82),
      bytesToUint16LittleEndian(this.bytes, 0x84),
      bytesToUint16LittleEndian(this.bytes, 0x86),
      bytesToUint16LittleEndian(this.bytes, 0x88),
    ]
  }

  public set relearnMoves(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes.set(uint16ToBytesLittleEndian(value[i]), 0x82 + 2 * i)
    }
  }

  public get currentHP() {
    return bytesToUint16LittleEndian(this.bytes, 0x8a)
  }

  public set currentHP(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x8a)
  }

  public get ivs() {
    const ivBytes = bytesToUint32LittleEndian(this.bytes, 0x8c)
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
    writeIVsToBuffer(value, this.bytes, 0x8c, this.isEgg, this.isNicknamed)
  }

  public get isEgg() {
    return getFlag(this.bytes, 0x8c, 30)
  }

  public set isEgg(value: boolean) {
    setFlag(this.bytes, 0x8c, 30, value)
  }

  public get isNicknamed() {
    return getFlag(this.bytes, 0x8c, 31)
  }

  public set isNicknamed(value: boolean) {
    setFlag(this.bytes, 0x8c, 31, value)
  }

  public get statusCondition() {
    return bytesToUint32LittleEndian(this.bytes, 0x90)
  }

  public set statusCondition(value: number) {
    this.bytes.set(uint32ToBytesLittleEndian(value), 0x90)
  }

  public get teraTypeOriginal() {
    return this.bytes[0x94]
  }

  public set teraTypeOriginal(value: number) {
    this.bytes[0x94] = value
  }

  public get teraTypeOverride() {
    return this.bytes[0x95]
  }

  public set teraTypeOverride(value: number) {
    this.bytes[0x95] = value
  }

  public get handlerName() {
    return utf16BytesToString(this.bytes, 0xa8, 12)
  }

  public set handlerName(value: string) {
    const utfBytes = utf16StringToBytes(value, 12)
    this.bytes.set(utfBytes, 0xa8)
  }

  public get handlerGender() {
    return getFlag(this.bytes, 0xc2, 0)
  }

  public set handlerGender(value: boolean) {
    setFlag(this.bytes, 0xc2, 0, value)
  }

  public get handlerLanguageIndex() {
    return this.bytes[0xc3]
  }

  public get handlerLanguage() {
    return Languages[this.languageIndex]
  }

  public set handlerLanguage(value: string) {
    const index = Languages.indexOf(value)
    if (index > -1) {
      this.bytes[0xc3] = index
    }
  }

  public get isCurrentHandler() {
    return !!this.bytes[0xc4]
  }

  public set isCurrentHandler(value: boolean) {
    this.bytes[0xc4] = value ? 1 : 0
  }

  public get handlerID() {
    return bytesToUint16LittleEndian(this.bytes, 0xc6)
  }

  public set handlerID(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0xc6)
  }

  public get handlerFriendship() {
    return this.bytes[0xc8]
  }

  public set handlerFriendship(value: number) {
    this.bytes[0xc8] = value
  }

  public get handlerMemory() {
    return {
      intensity: this.bytes[0xc9],
      memory: this.bytes[0xca],
      feeling: this.bytes[0xcb],
      textVariables: bytesToUint16LittleEndian(this.bytes, 0xcc),
    }
  }

  public set handlerMemory(value: memory) {
    this.bytes[0xc9] = value.intensity
    this.bytes[0xca] = value.memory
    this.bytes[0xcb] = value.feeling
    this.bytes.set(uint16ToBytesLittleEndian(value.textVariables), 0xcc)
  }

  public get gameOfOrigin() {
    return this.bytes[0xce]
  }

  public set gameOfOrigin(value: number) {
    this.bytes[0xce] = value
  }

  public get gameOfOriginBattle() {
    return this.bytes[0xcf]
  }

  public set gameOfOriginBattle(value: number) {
    this.bytes[0xcf] = value
  }

  public get formArgument() {
    return bytesToUint32LittleEndian(this.bytes, 0xd0)
  }

  public set formArgument(value: number) {
    this.bytes.set(uint32ToBytesLittleEndian(value), 0xd0)
  }

  public get affixedRibbon() {
    return this.bytes[0xe8] !== 0xff ? this.bytes[0xd4] : undefined
  }

  public set affixedRibbon(value: number | undefined) {
    this.bytes[0xd4] = value ?? 0xff
  }

  public get languageIndex() {
    return this.bytes[0xd5]
  }

  public get language() {
    return Languages[this.languageIndex]
  }

  public set language(value: string) {
    const index = Languages.indexOf(value)
    if (index > -1) {
      this.bytes[0xd5] = index
    }
  }
  public get trainerName() {
    return utf16BytesToString(this.bytes, 0xf8, 12)
  }

  public set trainerName(value: string) {
    const utfBytes = utf16StringToBytes(value, 12)
    this.bytes.set(utfBytes, 0xf8)
  }

  public get trainerFriendship() {
    return this.bytes[0x112]
  }

  public set trainerFriendship(value: number) {
    this.bytes[0x112] = value
  }

  public get trainerMemory() {
    return {
      intensity: this.bytes[0x113],
      memory: this.bytes[0x114],
      feeling: this.bytes[0x118],
      textVariables: bytesToUint16LittleEndian(this.bytes, 0x116),
    }
  }

  public set trainerMemory(value: memory) {
    this.bytes[0x113] = value.intensity
    this.bytes[0x114] = value.memory
    this.bytes[0x118] = value.feeling
    this.bytes.set(uint16ToBytesLittleEndian(value.textVariables), 0x116)
  }

  public get eggDate() {
    return this.bytes[0x11a]
      ? {
          year: this.bytes[0x119] + 2000,
          month: this.bytes[0x11a],
          day: this.bytes[0x11b],
        }
      : undefined
  }

  public set eggDate(value: pokedate | undefined) {
    this.bytes[0x119] = value?.year ? value.year - 2000 : 0
    this.bytes[0x11a] = value?.month ?? 0
    this.bytes[0x11b] = value?.day ?? 0
  }

  public get metDate() {
    return {
      year: this.bytes[0x11c] + 2000,
      month: this.bytes[0x11d],
      day: this.bytes[0x11e],
    }
  }

  public set metDate(value: pokedate) {
    this.bytes[0x11c] = value.year - 2000
    this.bytes[0x11d] = value.month
    this.bytes[0x11e] = value.day
  }

  public get obedienceLevel() {
    return this.bytes[0x11f]
  }

  public set obedienceLevel(value: number) {
    this.bytes[0x11f] = value
  }

  public get eggLocationIndex() {
    return bytesToUint16LittleEndian(this.bytes, 0x120)
  }

  public set eggLocationIndex(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x120)
  }

  public get eggLocation() {
    if (!this.eggLocationIndex) {
      return undefined
    }
    if (!isPaldea(this.gameOfOrigin)) {
      return this.gameOfOrigin < GameOfOrigin.Scarlet
        ? `from the ${GameOfOriginData[this.gameOfOrigin]?.region} region`
        : 'from a faraway place'
    }
    const locationBlock = SVMetLocation[Math.floor(this.eggLocationIndex / 10000) * 10000]
    return `from ${locationBlock[this.eggLocationIndex % 10000]}`
  }

  public get metLocationIndex() {
    return bytesToUint16LittleEndian(this.bytes, 0x122)
  }

  public set metLocationIndex(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x122)
  }

  public get metLocation() {
    if (!isPaldea(this.gameOfOrigin)) {
      return this.gameOfOrigin <= GameOfOrigin.Scarlet
        ? `in the ${GameOfOriginData[this.gameOfOrigin]?.region} region`
        : 'in a faraway place'
    }
    const locationBlock =
      SVMetLocation[Math.floor(this.metLocationIndex / 10000) * 10000] ?? SVMetLocation[0]
    return `in ${locationBlock[this.metLocationIndex % 10000]}`
  }

  public get ball() {
    return this.bytes[0x124]
  }

  public set ball(value: number) {
    this.bytes[0x124] = value
  }

  public get metLevel() {
    return this.bytes[0x125] & ~0x80
  }

  public set metLevel(value: number) {
    this.bytes[0x125] = (this.bytes[0x125] & 0x80) | (value & ~0x80)
  }

  public get trainerGender() {
    return getFlag(this.bytes, 0x125, 7) ? 1 : 0
  }

  public set trainerGender(value: number) {
    setFlag(this.bytes, 0x125, 7, !!value)
  }

  public get hyperTraining() {
    return {
      hp: getFlag(this.bytes, 0x126, 0),
      atk: getFlag(this.bytes, 0x126, 1),
      def: getFlag(this.bytes, 0x126, 2),
      spa: getFlag(this.bytes, 0x126, 3),
      spd: getFlag(this.bytes, 0x126, 4),
      spe: getFlag(this.bytes, 0x126, 5),
    }
  }

  public set hyperTraining(value: hyperTrainStats) {
    setFlag(this.bytes, 0x126, 0, value.hp)
    setFlag(this.bytes, 0x126, 1, value.atk)
    setFlag(this.bytes, 0x126, 2, value.def)
    setFlag(this.bytes, 0x126, 3, value.spa)
    setFlag(this.bytes, 0x126, 4, value.spd)
    setFlag(this.bytes, 0x126, 5, value.spe)
  }

  public get homeTracker() {
    return this.bytes.slice(127, 0x135 + 8)
  }

  public set homeTracker(value: Uint8Array) {
    this.bytes.set(value.slice(0, 8), 127)
  }

  // only 22 bytes are used of the allocated 25
  public get tmFlagsSV() {
    return this.bytes.slice(0x12f, 0x12f + 22)
  }

  public set tmFlagsSV(value: Uint8Array) {
    this.bytes.set(value.slice(0, 22), 0x12f)
  }

  public get isShiny() {
    return (
      (this.trainerID ^
        this.secretID ^
        bytesToUint16LittleEndian(this.bytes, 0x1c) ^
        bytesToUint16LittleEndian(this.bytes, 0x1e)) <
      16
    )
  }

  public get isSquareShiny() {
    return !(
      this.trainerID ^
      this.secretID ^
      bytesToUint16LittleEndian(this.bytes, 0x1c) ^
      bytesToUint16LittleEndian(this.bytes, 0x1e)
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
}
