import _ from 'lodash'
import { Ball, GameOfOrigin, GameOfOriginData, isAlola } from '../../consts'
import { Languages } from '../../consts/Languages'
import SMUSUMLocations from '../../consts/MetLocation/SMUSUM'
import { Gen9Ribbons } from '../../consts/Ribbons'
import { ItemFromString, ItemToString } from '../../resources/gen/items/Items'
import { AbilityFromString, AbilityToString } from '../../resources/gen/other/Abilities'
import { contestStats, geolocation, marking, memory, pokedate, stats } from '../../types/types'
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
import { OHPKM } from './OHPKM'
import { PKM } from './PKM'
import { adjustMovePPBetweenFormats, writeIVsToBuffer } from './util'

export const SM_MOVE_MAX = 719
export const USUM_MOVE_MAX = 728

export class PK7 extends PKM {
  constructor(...args: any[]) {
    if (args.length >= 1 && args[0] instanceof Uint8Array) {
      const bytes = args[0]
      const encrypted = args[1] ?? false
      if (encrypted) {
        // let unencryptedBytes = decryptByteArrayGen45(bytes);
        // let unshuffledBytes = unshuffleBlocksGen45(unencryptedBytes);
        // super(unshuffledBytes);
        super(undefined)
      } else {
        super(bytes)
      }
      // this.refreshChecksum();
    } else if (args.length === 1 && args[0] instanceof OHPKM) {
      const other = args[0]
      super(new Uint8Array(232))
      this.encryptionConstant = other.encryptionConstant
      this.dexNum = other.dexNum
      this.exp = other.exp
      this.heldItem = other.heldItem
      this.trainerID = other.trainerID
      this.secretID = other.secretID
      this.ability = other.ability
      this.abilityNum = other.abilityNum
      this.trainingBagHits = other.trainingBagHits
      this.trainingBag = other.trainingBag
      this.personalityValue = other.personalityValue
      this.nature = other.nature
      this.isFatefulEncounter = other.isFatefulEncounter
      console.log(other.formNum)
      this.formNum = other.formNum
      this.gender = other.gender
      this.evs = other.evs
      this.contest = other.contest
      this.markings = other.markings
      this.pokerusByte = other.pokerusByte
      this.superTrainingFlags = other.superTrainingFlags
      this.superTrainingDistFlags = other.superTrainingDistFlags
      this.ribbons = other.ribbons
      this.contestMemoryCount = other.contestMemoryCount
      this.battleMemoryCount = other.battleMemoryCount
      this.superTrainingDistFlags = other.superTrainingDistFlags
      this.formArgument = other.formArgument
      this.nickname = other.nickname
      // filtering out moves that didnt exist yet
      const validMoves = other.moves.filter((move) => move <= USUM_MOVE_MAX)
      const validMovePP = adjustMovePPBetweenFormats(this, other).filter(
        (_, i) => other.moves[i] <= USUM_MOVE_MAX
      )
      const validMovePPUps = other.movePPUps.filter((_, i) => other.moves[i] <= USUM_MOVE_MAX)
      const validRelearnMoves = other.relearnMoves.filter((_, i) => other.moves[i] <= USUM_MOVE_MAX)
      this.moves = [validMoves[0], validMoves[1], validMoves[2], validMoves[3]]
      this.movePP = [validMovePP[0], validMovePP[1], validMovePP[2], validMovePP[3]]
      this.movePPUps = [validMovePPUps[0], validMovePPUps[1], validMovePPUps[2], validMovePPUps[3]]
      this.relearnMoves = [
        validRelearnMoves[0],
        validRelearnMoves[1],
        validRelearnMoves[2],
        validRelearnMoves[3],
      ]
      this.secretSuperTrainingUnlocked = other.secretSuperTrainingUnlocked
      this.secretSuperTrainingComplete = other.secretSuperTrainingComplete
      this.ivs = other.ivs
      this.isEgg = other.isEgg
      this.isNicknamed = other.isNicknamed
      this.handlerName = other.handlerName
      this.handlerGender = other.handlerGender
      this.isCurrentHandler = true
      this.geolocations = other.geolocations
      this.handlerFriendship = other.handlerFriendship
      this.handlerAffection = other.handlerAffection
      this.handlerMemory = other.handlerMemory
      this.fullness = other.fullness
      this.enjoyment = other.enjoyment
      this.trainerName = other.trainerName
      this.trainerFriendship = other.trainerFriendship
      this.trainerAffection = other.trainerAffection
      this.trainerMemory = other.trainerMemory
      this.eggDate = other.eggDate
      this.metDate = other.metDate
      this.eggLocationIndex = other.eggLocationIndex
      this.metLocationIndex = other.metLocationIndex
      this.ball = other.ball && other.ball <= Ball.Beast ? other.ball : Ball.Poke
      this.metLevel = other.metLevel ?? this.level
      this.trainerGender = other.trainerGender
      this.encounterType = other.encounterType
      this.gameOfOrigin = other.gameOfOrigin
      this.country = other.country
      this.region = other.region
      this.consoleRegion = other.consoleRegion
      this.language = other.language
      this.currentHP = this.stats.hp
    } else {
      super(args[0])
    }
  }

  public get format() {
    return 'PK7'
  }

  public get encryptionConstant() {
    return bytesToUint32LittleEndian(this.bytes, 0x00)
  }

  public set encryptionConstant(value: number) {
    this.bytes.set(uint32ToBytesLittleEndian(value), 0x00)
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

  public get level() {
    return this.dexNum > 0 ? getLevelGen3Onward(this.dexNum, this.exp) : 0
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
    return this.bytes[0x15]
  }

  public set abilityNum(value: number) {
    this.bytes[0x15] = value
  }

  public get trainingBagHits() {
    return this.bytes[0x16]
  }

  public set trainingBagHits(value: number) {
    this.bytes[0x16] = value
  }

  public get trainingBag() {
    return this.bytes[0x17]
  }

  public set trainingBag(value: number) {
    this.bytes[0x17] = value
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
    return !!(this.bytes[0x1d] & 1)
  }

  public set isFatefulEncounter(value: boolean) {
    const bit = 0
    setFlag(this.bytes, 0x1d, bit, value)
  }

  public get formNum() {
    return this.bytes[0x1d] >> 3
  }

  public set formNum(value: number) {
    this.bytes[0x1d] = (this.bytes[0x1d] & 0b111) | (value << 3)
  }

  public get gender() {
    return (this.bytes[0x1d] >> 1) & 0x3
  }

  public set gender(value: number) {
    this.bytes[0x01d] = (this.bytes[0x01d] & 0b11111001) | ((value & 0x3) << 1)
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

  public get contest() {
    return {
      cool: this.bytes[0x24],
      beauty: this.bytes[0x25],
      cute: this.bytes[0x26],
      smart: this.bytes[0x27],
      tough: this.bytes[0x28],
      sheen: this.bytes[0x29],
    }
  }

  public set contest(value: contestStats) {
    this.bytes[0x24] = value.cool
    this.bytes[0x25] = value.beauty
    this.bytes[0x26] = value.cute
    this.bytes[0x27] = value.smart
    this.bytes[0x28] = value.tough
    this.bytes[0x29] = value.sheen
  }

  public get markings() {
    const markingsValue = this.bytes[0x2a]
    return [
      markingsValue & 1,
      (markingsValue >> 1) & 1,
      (markingsValue >> 2) & 1,
      (markingsValue >> 3) & 1,
      (markingsValue >> 4) & 1,
      (markingsValue >> 5) & 1,
    ] as any as [marking, marking, marking, marking, marking, marking]
  }

  public set markings(value: [marking, marking, marking, marking, marking, marking]) {
    let markingsValue = 0
    for (let i = 0; i < 6; i++) {
      if (value[i]) {
        markingsValue = markingsValue | (2 ** i)
      }
    }
    this.bytes[0x2a] = markingsValue
  }

  public get pokerusByte() {
    return this.bytes[0x2b]
  }

  public set pokerusByte(value: number) {
    this.bytes[0x2b] = value
  }

  public get superTrainingFlags() {
    return bytesToUint32LittleEndian(this.bytes, 0x2c)
  }

  public set superTrainingFlags(value: number) {
    this.bytes.set(uint32ToBytesLittleEndian(value), 0x2c)
  }

  public get ribbonBytes() {
    return this.bytes.slice(0x30, 0x36)
  }

  public set ribbonBytes(value: Uint8Array) {
    this.bytes.set(value.slice(0, 4), 0x30)
  }

  public get ribbons() {
    const ribbons: string[] = []
    for (let i = 0; i < 50; i++) {
      if (getFlag(this.bytes, 0x30, i)) {
        ribbons.push(Gen9Ribbons[i])
      }
    }
    return ribbons
  }

  public set ribbons(value: string[]) {
    value.forEach((ribbon) => {
      const index = Gen9Ribbons.indexOf(ribbon)
      if (index > -1) {
        setFlag(this.bytes, 0x30, index, true)
      }
    })
  }

  public get contestMemoryCount() {
    return this.bytes[0x38]
  }

  public set contestMemoryCount(value: number) {
    this.bytes[0x38] = value
  }

  public get battleMemoryCount() {
    return this.bytes[0x39]
  }

  public set battleMemoryCount(value: number) {
    this.bytes[0x39] = value
  }

  public get superTrainingDistFlags() {
    return this.bytes[0x3a]
  }

  public set superTrainingDistFlags(value: number) {
    this.bytes[0x3a] = value
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

  public get secretSuperTrainingUnlocked() {
    return getFlag(this.bytes, 0x72, 1)
  }

  public set secretSuperTrainingUnlocked(value: boolean) {
    setFlag(this.bytes, 0x72, 1, value)
  }

  public get secretSuperTrainingComplete() {
    return getFlag(this.bytes, 0x72, 2)
  }

  public set secretSuperTrainingComplete(value: boolean) {
    setFlag(this.bytes, 0x72, 2, value)
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

  public get geolocations() {
    return _.range(5).map((i) => ({
      region: this.bytes[0x94 + 2 * i],
      country: this.bytes[0x95 + 2 * i],
    })) as [geolocation, geolocation, geolocation, geolocation, geolocation]
  }

  public set geolocations(
    value: [geolocation, geolocation, geolocation, geolocation, geolocation]
  ) {
    value.forEach((geo, i) => {
      this.bytes[0x94 + 2 * i] = geo.region
      this.bytes[0x95 + 2 * i] = geo.country
    })
  }

  public get handlerFriendship() {
    return this.bytes[0xa2]
  }

  public set handlerFriendship(value: number) {
    this.bytes[0xa2] = value
  }

  public get handlerAffection() {
    return this.bytes[0xa3]
  }

  public set handlerAffection(value: number) {
    this.bytes[0xa3] = value
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

  public get trainerAffection() {
    return this.bytes[0xcb]
  }

  public set trainerAffection(value: number) {
    this.bytes[0xcb] = value
  }

  public get trainerMemory() {
    return {
      intensity: this.bytes[0xcc],
      memory: this.bytes[0xcd],
      textVariables: bytesToUint16LittleEndian(this.bytes, 0xce),
      feeling: this.bytes[0xd0],
    }
  }

  public set trainerMemory(value: memory) {
    this.bytes[0xcc] = value.intensity
    this.bytes[0xcd] = value.memory
    this.bytes.set(uint16ToBytesLittleEndian(value.textVariables), 0xce)
    this.bytes[0xd0] = value.feeling
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
    const locationBlock = SMUSUMLocations[Math.floor(this.eggLocationIndex / 10000) * 10000]
    return `from ${locationBlock[this.eggLocationIndex % 10000]}`
  }

  public get metLocationIndex() {
    return bytesToUint16LittleEndian(this.bytes, 0xda)
  }

  public set metLocationIndex(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0xda)
  }

  public get metLocation() {
    if (!isAlola(this.gameOfOrigin)) {
      return this.gameOfOrigin <= GameOfOrigin.OmegaRuby ||
        (this.gameOfOrigin >= GameOfOrigin.Red && this.gameOfOrigin <= GameOfOrigin.Crystal)
        ? `in the ${GameOfOriginData[this.gameOfOrigin]?.region} region`
        : 'in a faraway place'
    }
    const locationBlock = SMUSUMLocations[Math.floor(this.metLocationIndex / 10000) * 10000]
    if (locationBlock) {
      return `in ${locationBlock[this.metLocationIndex % 10000]}`
    }
    return undefined
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

  public get encounterType() {
    return this.bytes[0xde]
  }

  public set encounterType(value: number) {
    this.bytes[0xde] = value
  }

  public get gameOfOrigin() {
    return this.bytes[0xdf]
  }

  public set gameOfOrigin(value: number) {
    this.bytes[0xdf] = value
  }

  public get country() {
    return this.bytes[0xe0]
  }

  public set country(value: number) {
    this.bytes[0xe0] = value
  }

  public get region() {
    return this.bytes[0xe1]
  }

  public set region(value: number) {
    this.bytes[0xe1] = value
  }

  public get consoleRegion() {
    return this.bytes[0xe2]
  }

  public set consoleRegion(value: number) {
    this.bytes[0xe2] = value
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
}
