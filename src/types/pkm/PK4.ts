import {
  AbilityFromString,
  AbilityToString,
  Ball,
  GameOfOrigin,
  Gen4Locations,
  ItemFromString,
  ItemToString,
  Languages,
  isGen4,
  isHoenn,
  isJohto,
  isKanto,
  isSinnoh,
} from 'pokemon-resources'
import { Gen4RibbonsPart1, Gen4RibbonsPart2, Gen4RibbonsPart3 } from '../../consts'
import {
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
  get16BitChecksumLittleEndian,
  getFlag,
  setFlag,
  uint16ToBytesLittleEndian,
  uint32ToBytesLittleEndian,
} from '../../util/ByteLogic'
import {
  decryptByteArrayGen45,
  shuffleBlocksGen45,
  unshuffleBlocksGen45,
} from '../../util/Encryption'
import { getHPGen3Onward, getLevelGen3Onward, getStatGen3Onward } from '../../util/StatCalc'
import { gen4StringToUTF, utf16StringToGen4 } from '../../util/Strings/StringConverter'
import { BasePKMData } from '../interfaces/base'
import { SanityChecksum } from '../interfaces/gen3'
import { Gen4EncounterType, Gen4OnData } from '../interfaces/gen4'
import { OHPKM } from '../OHPKM'
import { contestStats, marking, pokedate, stats } from '../types'
import {
  adjustMovePPBetweenFormats,
  generatePersonalityValuePreservingAttributes,
  getAbilityFromNumber,
  writeIVsToBuffer,
} from './util'

export const GEN4_MOVE_MAX = 467

export class PK4 implements BasePKMData, Gen4OnData, Gen4EncounterType, SanityChecksum {
  public get fileSize() {
    return 136
  }

  get markingCount(): number {
    return 4
  }

  get markingColors(): number {
    return 1
  }

  bytes = new Uint8Array(136)

  constructor(bytes?: Uint8Array, encrypted?: boolean, other?: OHPKM) {
    if (bytes) {
      if (encrypted) {
        const unencryptedBytes = decryptByteArrayGen45(bytes)
        const unshuffledBytes = unshuffleBlocksGen45(unencryptedBytes)
        this.bytes = unshuffledBytes
      } else {
        this.bytes = bytes
      }
      this.refreshChecksum()
    } else if (other) {
      this.dexNum = other.dexNum
      this.formeNum = other.formeNum
      this.heldItem = other.heldItem
      this.trainerID = other.trainerID
      this.secretID = other.secretID
      this.exp = other.exp
      this.ability =
        other.ability ?? getAbilityFromNumber(this.dexNum, this.formeNum, this.abilityNum)
      // console
      this.personalityValue = generatePersonalityValuePreservingAttributes(other)
      this.isFatefulEncounter = other.isFatefulEncounter
      this.gender = other.gender
      this.evs = other.evs ?? {
        hp: 0,
        atk: 0,
        def: 0,
        spa: 0,
        spd: 0,
        spe: 0,
      }
      this.contest = other.contest
      this.pokerusByte = other.pokerusByte
      this.ribbons = other.ribbons
      // filtering out moves that didnt exist yet
      const validMoves = other.moves.filter((move) => move <= GEN4_MOVE_MAX)
      const validMovePP = adjustMovePPBetweenFormats(this, other).filter(
        (_, i) => other.moves[i] <= GEN4_MOVE_MAX
      )
      const validMovePPUps = other.movePPUps.filter((_, i) => other.moves[i] <= GEN4_MOVE_MAX)
      this.moves = [validMoves[0], validMoves[1], validMoves[2], validMoves[3]]
      this.movePP = [validMovePP[0], validMovePP[1], validMovePP[2], validMovePP[3]]
      this.movePPUps = [validMovePPUps[0], validMovePPUps[1], validMovePPUps[2], validMovePPUps[3]]
      this.nickname = other.nickname
      this.currentHP = other.currentHP
      this.ivs = other.ivs
      this.isEgg = other.isEgg
      this.isNicknamed = other.isNicknamed
      this.shinyLeaves = other.shinyLeaves
      this.gameOfOrigin = other.gameOfOrigin
      this.language = other.languageIndex === 0 ? 'ENG' : other.language
      this.encounterType = other.encounterType
      this.performance = other.performance
      this.trainerName = other.trainerName
      this.trainerFriendship = other.trainerFriendship
      this.eggDate = other.eggDate
      const now = new Date()
      this.metDate = other.metDate ?? {
        month: now.getMonth(),
        day: now.getDate(),
        year: now.getFullYear(),
      }
      this.ball = other.ball && other.ball <= Ball.Sport ? other.ball : Ball.Poke
      if (isGen4(other.gameOfOrigin)) {
        this.eggLocationIndex = other.eggLocationIndex
        this.metLocationIndex = other.metLocationIndex ?? 3002
      } else {
        let equivalentLocation = other.metLocation
          ? Gen4Locations[0].indexOf(other.metLocation.slice(3))
          : undefined
        if (equivalentLocation !== undefined && equivalentLocation < 0) {
          equivalentLocation = undefined
        }
        if (isKanto(other.gameOfOrigin)) {
          this.eggLocationIndex = other.eggLocationIndex ? 2003 : 0
          this.metLocationIndex = equivalentLocation ?? 2003
        } else if (isJohto(other.gameOfOrigin)) {
          this.eggLocationIndex = other.eggLocationIndex ? 2004 : 0
          this.metLocationIndex = equivalentLocation ?? 2004
        } else if (isHoenn(other.gameOfOrigin)) {
          this.eggLocationIndex = other.eggLocationIndex ? 2005 : 0
          this.metLocationIndex = 2005
        } else if (isSinnoh(other.gameOfOrigin)) {
          this.eggLocationIndex = other.eggLocationIndex ? 2006 : 0
          this.metLocationIndex = equivalentLocation ?? 2006
        } else {
          this.eggLocationIndex = other.eggLocationIndex ? 2001 : 0
          this.metLocationIndex = 2001
        }
      }
      this.metLevel = other.metLevel ?? this.level
      this.trainerGender = other.trainerGender
      this.refreshChecksum()
    }
  }

  public get format() {
    return 'PK4'
  }

  public get personalityValue() {
    return bytesToUint32LittleEndian(this.bytes, 0x00)
  }

  public set personalityValue(value: number) {
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
    return this.trainerID
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

  public get trainerFriendship() {
    return this.bytes[0x14]
  }

  public set trainerFriendship(value: number) {
    this.bytes[0x14] = value
  }

  public get abilityNum() {
    return (this.personalityValue & 1) + 1
  }

  public get abilityIndex() {
    return this.bytes[0x15]
  }

  public set abilityIndex(value: number) {
    this.bytes[0x15] = value
  }

  public get ability() {
    return AbilityToString(this.abilityIndex)
  }

  public set ability(value: string) {
    this.abilityIndex = AbilityFromString(value)
  }

  public get markings() {
    const markingsValue = this.bytes[0x16]
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
        markingsValue |= 2 ** i
      }
    }
    this.bytes[0x16] = markingsValue
  }

  public get languageIndex() {
    return this.bytes[0x17]
  }

  public get language() {
    return Languages[this.languageIndex]
  }

  public set language(value: string) {
    const index = Languages.indexOf(value)
    if (index > -1) {
      this.bytes[0x17] = index
    }
  }

  public get evs() {
    return {
      hp: this.bytes[0x18],
      atk: this.bytes[0x19],
      def: this.bytes[0x1a],
      spe: this.bytes[0x1b],
      spa: this.bytes[0x1c],
      spd: this.bytes[0x1d],
    }
  }

  public set evs(value: stats) {
    this.bytes[0x18] = value.hp
    this.bytes[0x19] = value.atk
    this.bytes[0x1a] = value.def
    this.bytes[0x1b] = value.spe
    this.bytes[0x1c] = value.spa
    this.bytes[0x1d] = value.spd
  }

  public get contest() {
    return {
      cool: this.bytes[0x1e],
      beauty: this.bytes[0x1f],
      cute: this.bytes[0x20],
      smart: this.bytes[0x21],
      tough: this.bytes[0x22],
      sheen: this.bytes[0x23],
    }
  }

  public set contest(value: contestStats) {
    this.bytes[0x1e] = value.cool
    this.bytes[0x1f] = value.beauty
    this.bytes[0x20] = value.cute
    this.bytes[0x21] = value.smart
    this.bytes[0x22] = value.tough
    this.bytes[0x23] = value.sheen
  }

  public get ribbonBytes() {
    return this.bytes.slice(0x4c, 0x50)
  }

  public set ribbonBytes(value: Uint8Array) {
    this.bytes.set(value.slice(0, 4), 0x4c)
  }

  public get ribbons() {
    const ribbons: string[] = []
    for (let byte = 0; byte < 4; byte++) {
      const ribbonsUint8 = this.bytes[0x24 + byte]
      for (let bit = 0; bit < 8; bit++) {
        if (ribbonsUint8 & (2 ** bit)) {
          if (8 * byte + bit < Gen4RibbonsPart1.length) {
            ribbons.push(Gen4RibbonsPart1[8 * byte + bit])
          }
        }
      }
    }
    for (let byte = 0; byte < 4; byte++) {
      const ribbonsUint8 = this.bytes[0x3c + byte]
      for (let bit = 0; bit < 8; bit++) {
        if (ribbonsUint8 & (2 ** bit)) {
          if (8 * byte + bit < Gen4RibbonsPart2.length) {
            ribbons.push(Gen4RibbonsPart2[8 * byte + bit])
          }
        }
      }
    }
    for (let byte = 0; byte < 4; byte++) {
      const ribbonsUint8 = this.bytes[0x60 + byte]
      for (let bit = 0; bit < 8; bit++) {
        if (ribbonsUint8 & (2 ** bit)) {
          if (8 * byte + bit < Gen4RibbonsPart3.length) {
            ribbons.push(Gen4RibbonsPart3[8 * byte + bit])
          }
        }
      }
    }
    return ribbons
  }

  public set ribbons(value: string[]) {
    value.forEach((ribbon) => {
      let index = Gen4RibbonsPart1.indexOf(ribbon)
      if (index > -1) {
        setFlag(this.bytes, 0x24, index, true)
        return
      }
      index = Gen4RibbonsPart2.indexOf(ribbon)
      if (index > -1) {
        setFlag(this.bytes, 0x3c, index, true)
        return
      }
      index = Gen4RibbonsPart3.indexOf(ribbon)
      if (index > -1) {
        setFlag(this.bytes, 0x60, index, true)
      }
    })
  }

  public get moves() {
    return [
      bytesToUint16LittleEndian(this.bytes, 0x28),
      bytesToUint16LittleEndian(this.bytes, 0x2a),
      bytesToUint16LittleEndian(this.bytes, 0x2c),
      bytesToUint16LittleEndian(this.bytes, 0x2e),
    ]
  }

  public set moves(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes.set(uint16ToBytesLittleEndian(value[i]), 0x28 + 2 * i)
    }
  }

  public get movePP() {
    return [this.bytes[0x30], this.bytes[0x31], this.bytes[0x32], this.bytes[0x33]]
  }

  public set movePP(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes[0x30 + i] = value[i]
    }
  }

  public get movePPUps() {
    return [this.bytes[0x34], this.bytes[0x35], this.bytes[0x36], this.bytes[0x37]]
  }

  public set movePPUps(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes[0x34 + i] = value[i]
    }
  }

  public get ivs() {
    const ivBytes = bytesToUint32LittleEndian(this.bytes, 0x38)
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
    writeIVsToBuffer(value, this.bytes, 0x38, this.isEgg, this.isNicknamed)
  }

  public get isEgg() {
    return getFlag(this.bytes, 0x38, 30)
  }

  public set isEgg(value: boolean) {
    setFlag(this.bytes, 0x38, 30, value)
  }

  public get isNicknamed() {
    return getFlag(this.bytes, 0x38, 31)
  }

  public set isNicknamed(value: boolean) {
    setFlag(this.bytes, 0x38, 31, value)
  }

  public get isFatefulEncounter() {
    return !!(this.bytes[0x40] & 1)
  }

  public set isFatefulEncounter(value: boolean) {
    const bit = 0
    setFlag(this.bytes, 0x40, bit, value)
  }

  public get gender() {
    return (this.bytes[0x40] >> 1) & 3
  }

  public set gender(value: number) {
    this.bytes[0x40] = (this.bytes[0x40] & 0b11111001) | ((value & 0b11) << 1)
  }

  public get formeNum() {
    return this.bytes[0x40] >> 3
  }

  public set formeNum(value: number) {
    this.bytes[0x40] = (this.bytes[0x40] & 0b111) | (value << 3)
  }

  public get shinyLeaves() {
    return this.bytes[0x41]
  }

  public set shinyLeaves(value: number) {
    this.bytes[0x41] = value
  }

  public get eggLocationIndex() {
    const dpLocation = bytesToUint16LittleEndian(this.bytes, 0x7e)
    return dpLocation !== 0xbba ? dpLocation : bytesToUint16LittleEndian(this.bytes, 0x44)
  }

  public set eggLocationIndex(value: number) {
    if (value >= 0x0070) {
      // show "faraway place" in diamond/pearl for platinum/hgss locations
      this.bytes.set(uint16ToBytesLittleEndian(0xbba), 0x7e)
    } else {
      this.bytes.set(uint16ToBytesLittleEndian(value), 0x7e)
    }
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x44)
  }

  public get eggLocation() {
    if (!this.eggLocationIndex) {
      return undefined
    }
    const locationBlock = Gen4Locations[Math.floor(this.eggLocationIndex / 1000) * 1000]
    return `from ${locationBlock[this.eggLocationIndex % 1000]}`
  }

  public get metLocationIndex() {
    const dpLocation = bytesToUint16LittleEndian(this.bytes, 0x80)
    return dpLocation !== 0xbba ? dpLocation : bytesToUint16LittleEndian(this.bytes, 0x46)
  }

  public set metLocationIndex(value: number) {
    if (value >= 0x0070 && value < 2000) {
      // show "faraway place" in diamond/pearl for platinum/hgss locations
      this.bytes.set(uint16ToBytesLittleEndian(0xbba), 0x80)
    } else {
      this.bytes.set(uint16ToBytesLittleEndian(value), 0x80)
    }
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x46)
  }

  public get metLocation() {
    const locationBlock =
      Gen4Locations[Math.floor(this.metLocationIndex / 1000) * 1000] ?? Gen4Locations[0]
    return `in ${locationBlock[this.metLocationIndex % 1000]}`
  }

  public get nickname() {
    return gen4StringToUTF(this.bytes, 0x48, 11)
  }

  public set nickname(value: string) {
    const gen4Bytes = utf16StringToGen4(value, 11, true)
    this.bytes.set(gen4Bytes, 0x48)
  }

  public get gameOfOrigin() {
    return this.bytes[0x5f]
  }

  public set gameOfOrigin(value: number) {
    this.bytes[0x5f] = value
  }

  public get trainerName() {
    return gen4StringToUTF(this.bytes, 0x68, 8)
  }

  public set trainerName(value: string) {
    const gen4Bytes = utf16StringToGen4(value, 8, true)
    this.bytes.set(gen4Bytes, 0x68)
  }

  public get eggDate() {
    return this.bytes[0x79]
      ? {
          year: this.bytes[0x78] + 2000,
          month: this.bytes[0x79],
          day: this.bytes[0x7a],
        }
      : undefined
  }

  public set eggDate(value: pokedate | undefined) {
    if (value) {
      this.bytes[0x78] = value.year - 2000
      this.bytes[0x79] = value.month
      this.bytes[0x7a] = value.day
    } else {
      this.bytes[0x78] = 0
      this.bytes[0x79] = 0
      this.bytes[0x7a] = 0
    }
  }

  public get metDate() {
    return {
      year: this.bytes[0x7b] + 2000,
      month: this.bytes[0x7c],
      day: this.bytes[0x7d],
    }
  }

  public set metDate(value: pokedate) {
    this.bytes[0x7b] = value.year - 2000
    this.bytes[0x7c] = value.month
    this.bytes[0x7d] = value.day
  }

  public get nature() {
    return this.personalityValue % 25
  }

  public get pokerusByte() {
    return this.bytes[0x82]
  }

  public set pokerusByte(value: number) {
    this.bytes[0x82] = value
  }

  public get ball() {
    return Math.max(this.bytes[0x83], this.bytes[0x86])
  }

  public set ball(value: number) {
    if (value > 16) {
      // dppt see apriballs, sport ball as a pokeball
      this.bytes[0x83] = 4
    } else {
      this.bytes[0x83] = value
    }
    if (
      this.gameOfOrigin === GameOfOrigin.HeartGold ||
      this.gameOfOrigin === GameOfOrigin.SoulSilver ||
      this.gameOfOrigin >= GameOfOrigin.Platinum
    ) {
      this.bytes[0x86] = value
    }
  }

  public get metLevel() {
    return this.bytes[0x84] & 0x7f
  }

  public set metLevel(value: number) {
    this.bytes[0x84] = (this.bytes[0x84] & 0x80) | (value & 0x7f)
  }

  public get trainerGender() {
    return getFlag(this.bytes, 0x84, 7) ? 1 : 0
  }

  public set trainerGender(value: number) {
    setFlag(this.bytes, 0x84, 7, !!value)
  }

  public get encounterType() {
    return this.bytes[0x85]
  }

  public set encounterType(value: number) {
    this.bytes[0x85] = value
  }

  public get performance() {
    return this.bytes[0x87]
  }

  public set performance(value: number) {
    this.bytes[0x87] = value
  }

  public get isShiny() {
    return (
      (this.trainerID ^
        this.secretID ^
        bytesToUint16LittleEndian(this.bytes, 0x00) ^
        bytesToUint16LittleEndian(this.bytes, 0x02)) <
      8
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

  public refreshChecksum() {
    const newChecksum = get16BitChecksumLittleEndian(this.bytes, 0x08, 0x87)
    this.bytes.set(uint16ToBytesLittleEndian(newChecksum), 0x06)
  }

  public toPCBytes() {
    const shuffledBytes = shuffleBlocksGen45(this.bytes)
    return decryptByteArrayGen45(shuffledBytes)
  }

  public get hasPartyData(): boolean {
    return this.bytes.length >= 0x50
  }

  public get currentHP() {
    if (!this.hasPartyData) {
      return this.stats.hp
    }
    return this.bytes[0x8e]
  }

  public set currentHP(value: number) {
    if (this.hasPartyData) {
      this.bytes[0x8e] = value
    }
  }

  public get statusCondition() {
    if (!this.hasPartyData) {
      return 0
    }
    return this.bytes[0x88]
  }

  public set statusCondition(value: number) {
    if (this.hasPartyData) {
      this.bytes[0x88] = value
    }
  }
}
