import { Ball, GameOfOrigin, GameOfOriginData, isBDSP } from '../../consts'
import { Languages } from '../../consts/Languages'
import LALocations from '../../consts/MetLocation/LA'
import { Gen9Ribbons } from '../../consts/Ribbons'
import { ItemFromString, ItemToString } from '../../resources/gen/items/Items'
import { AbilityFromString, AbilityToString } from '../../resources/gen/other/Abilities'
import { contestStats, hyperTrainStats, marking, memory, pokedate, stats } from '../../types/types'
import {
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
  getFlag,
  setFlag,
  uint16ToBytesLittleEndian,
  uint32ToBytesLittleEndian,
} from '../../util/ByteLogic'
import { getLevelGen3Onward } from '../../util/StatCalc'
import { utf16BytesToString, utf16StringToBytes } from '../../util/Strings/StringConverter'
import { SanityChecksum } from '../interfaces/gen3'
import { Size } from '../interfaces/gen7'
import { Gen8OnData, PLAData } from '../interfaces/gen8'
import { OHPKM } from './OHPKM'
import { adjustMovePPBetweenFormats, writeIVsToBuffer } from './util'

export class PA8 implements Gen8OnData, PLAData, Size, SanityChecksum {
  public get fileSize() {
    return 376
  }

  get markingCount(): number {
    return 6
  }

  get markingColors(): number {
    return 2
  }

  bytes = new Uint8Array(376)

  constructor(bytes?: Uint8Array, encrypted?: boolean, other?: OHPKM) {
    if (bytes) {
      if (encrypted) {
        if (encrypted) {
          throw new Error('PA8 decryption not implemented')
        } else {
          this.bytes = bytes
        }
        // this.refreshChecksum();
      }
    } else if (other) {
      this.sanity = other.sanity
      this.dexNum = other.dexNum
      this.trainerID = other.trainerID
      this.secretID = other.secretID
      this.exp = other.exp
      this.heldItemIndex = 0
      this.canGigantamax = other.canGigantamax ?? false
      if (other.markings) {
        other.markings?.forEach((value, index) => {
          const temp = this.markings
          temp[index] = value
          this.markings = temp
        })
      }
      this.gameOfOrigin = other.gameOfOrigin
      this.ability = other.ability
      this.abilityNum = other.abilityNum
      this.abilityIndex = AbilityFromString(this.ability)
      this.alphaMove = other.alphaMove
      this.gender = other.gender
      this.personalityValue = other.personalityValue
      this.encryptionConstant = other.encryptionConstant
      this.nature = other.nature
      this.statNature = other.statNature
      this.isFatefulEncounter = other.isFatefulEncounter
      this.flag2LA = other.flag2LA
      this.formNum = other.formNum
      this.evs = other.evs
      this.contest = other.contest
      this.pokerusByte = other.pokerusByte
      this.contestMemoryCount = other.contestMemoryCount
      this.battleMemoryCount = other.battleMemoryCount
      this.ribbons = other.ribbons
      this.sociability = other.sociability
      this.height = other.height
      this.weight = other.weight
      this.scale = other.scale
      this.moves = other.moves
      this.movePP = adjustMovePPBetweenFormats(this, other)
      this.movePPUps = other.movePPUps
      this.nickname = other.nickname
      this.relearnMoves = other.relearnMoves
      this.ivs = other.ivs
      this.isNicknamed = other.isNicknamed
      this.unknownA0 = other.unknownA0
      this.gvs = other.gvs
      this.heightAbsoluteBytes = other.heightAbsoluteBytes
      this.weightAbsoluteBytes = other.weightAbsoluteBytes
      this.handlerName = other.handlerName
      this.handlerGender = other.handlerGender
      this.handlerLanguage = other.handlerLanguage
      this.isCurrentHandler = other.isCurrentHandler
      this.handlerID = other.handlerID
      this.handlerFriendship = other.handlerFriendship
      this.handlerMemory = other.handlerMemory
      this.contestMemoryCount = other.contestMemoryCount
      this.battleMemoryCount = other.battleMemoryCount
      this.fullness = other.fullness
      this.enjoyment = other.enjoyment
      this.gameOfOrigin = other.gameOfOrigin
      this.gameOfOriginBattle = other.gameOfOriginBattle
      this.region = other.region
      this.consoleRegion = other.consoleRegion
      this.language = other.language
      this.unknownF3 = other.unknownF3
      this.formArgument = other.formArgument
      this.affixedRibbon = other.affixedRibbon
      this.trainerName = other.trainerName
      this.trainerFriendship = other.trainerFriendship
      this.trainerMemory = other.trainerMemory
      this.eggDate = other.eggDate
      this.metDate = other.metDate
      this.ball = Math.max(other.ball, Ball.Strange)
      this.eggLocationIndex = other.eggLocationIndex
      this.metLocationIndex = other.metLocationIndex
      this.metLevel = other.metLevel
      this.trainerGender = other.trainerGender
      this.homeTracker = other.homeTracker
    }
  }

  public get format() {
    return 'PA8'
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

  public set sanity(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x4)
  }

  public get checksum() {
    return bytesToUint16LittleEndian(this.bytes, 0x06)
  }

  public set checksum(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x6)
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

  public get isAlpha() {
    return !!(this.bytes[0x16] & 32)
  }

  public set isAlpha(value: boolean) {
    this.bytes[0x16] = (this.bytes[0x16] & ~32) | (value ? 32 : 0)
  }

  public get isNoble() {
    return !!(this.bytes[0x16] & 64)
  }

  public set isNoble(value: boolean) {
    this.bytes[0x16] = (this.bytes[0x16] & ~64) | (value ? 64 : 0)
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

  public get flag2LA() {
    return getFlag(this.bytes, 0x22, 1)
  }

  public set flag2LA(value: boolean) {
    setFlag(this.bytes, 0x22, 1, value)
  }

  public get gender() {
    return (this.bytes[0x22] >> 2) & 0x3
  }

  public set gender(value: number) {
    this.bytes[0x22] = (this.bytes[0x22] & 0xf3) | (value << 2)
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
        setFlag(this.bytes, index >= 64 ? 0x40 : 0x34, index % 64, true)
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

  public get alphaMove() {
    return bytesToUint16LittleEndian(this.bytes, 0x3e)
  }

  public set alphaMove(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x3e)
  }

  public get sociability() {
    return bytesToUint32LittleEndian(this.bytes, 0x48)
  }

  public set sociability(value: number) {
    this.bytes.set(uint32ToBytesLittleEndian(value), 0x48)
  }

  public get height() {
    return this.bytes[0x50]
  }

  public set height(value: number) {
    this.bytes[0x50] = value
  }

  public get weight() {
    return this.bytes[0x51]
  }

  public set weight(value: number) {
    this.bytes[0x51] = value
  }

  public get scale() {
    return this.bytes[0x52]
  }

  public set scale(value: number) {
    this.bytes[0x52] = value
  }

  public get moves() {
    return [
      bytesToUint16LittleEndian(this.bytes, 0x54),
      bytesToUint16LittleEndian(this.bytes, 0x56),
      bytesToUint16LittleEndian(this.bytes, 0x58),
      bytesToUint16LittleEndian(this.bytes, 0x5a),
    ]
  }

  public set moves(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes.set(uint16ToBytesLittleEndian(value[i]), 0x54 + 2 * i)
    }
  }

  public get movePP() {
    return [this.bytes[0x5c], this.bytes[0x5d], this.bytes[0x5e], this.bytes[0x5f]]
  }

  public set movePP(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes[0x5c + i] = value[i]
    }
  }

  public get nicknameBytes() {
    return this.bytes.slice(0x60, 26)
  }

  public get nickname() {
    return utf16BytesToString(this.bytes, 0x60, 12)
  }

  public set nickname(value: string) {
    const utfBytes = utf16StringToBytes(value, 12)
    this.bytes.set(utfBytes, 0x60)
  }

  public get movePPUps() {
    return [this.bytes[0x86], this.bytes[0x87], this.bytes[0x88], this.bytes[0x89]]
  }

  public set movePPUps(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes[0x86 + i] = value[i]
    }
  }

  public get relearnMoves() {
    return [
      bytesToUint16LittleEndian(this.bytes, 0x8a),
      bytesToUint16LittleEndian(this.bytes, 0x8c),
      bytesToUint16LittleEndian(this.bytes, 0x8e),
      bytesToUint16LittleEndian(this.bytes, 0x90),
    ]
  }

  public set relearnMoves(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes.set(uint16ToBytesLittleEndian(value[i]), 0x8a + 2 * i)
    }
  }

  public get currentHP() {
    return bytesToUint16LittleEndian(this.bytes, 0x92)
  }

  public set currentHP(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x92)
  }

  public get ivs() {
    const ivBytes = bytesToUint32LittleEndian(this.bytes, 0x94)
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
    writeIVsToBuffer(value, this.bytes, 0x94, this.isEgg, this.isNicknamed)
  }

  public get isEgg() {
    return getFlag(this.bytes, 0x94, 30)
  }

  public set isEgg(value: boolean) {
    setFlag(this.bytes, 0x94, 30, value)
  }

  public get isNicknamed() {
    return getFlag(this.bytes, 0x94, 31)
  }

  public set isNicknamed(value: boolean) {
    setFlag(this.bytes, 0x94, 31, value)
  }

  public get dynamaxLevel() {
    return this.bytes[0x98]
  }

  public set dynamaxLevel(value: number) {
    this.bytes[0x98] = value
  }

  public get statusCondition() {
    return bytesToUint32LittleEndian(this.bytes, 0x9c)
  }

  public set statusCondition(value: number) {
    this.bytes.set(uint32ToBytesLittleEndian(value), 0x9c)
  }

  public get unknownA0() {
    return bytesToUint32LittleEndian(this.bytes, 0xa0)
  }

  public set unknownA0(value: number) {
    this.bytes.set(uint32ToBytesLittleEndian(value), 0xa0)
  }

  public get gvs() {
    return {
      hp: this.bytes[0xa4],
      atk: this.bytes[0xa5],
      def: this.bytes[0xa6],
      spe: this.bytes[0xa7],
      spa: this.bytes[0xa8],
      spd: this.bytes[0xa9],
    }
  }

  public set gvs(value: stats) {
    this.bytes[0xa4] = value.hp
    this.bytes[0xa5] = value.atk
    this.bytes[0xa6] = value.def
    this.bytes[0xa7] = value.spa
    this.bytes[0xa8] = value.spd
    this.bytes[0xa9] = value.spe
  }

  public get heightAbsoluteBytes() {
    return this.bytes.slice(0xac, 0xb0)
  }

  public set heightAbsoluteBytes(value: Uint8Array) {
    this.bytes.set(value, 0xac)
  }

  public get heightAbsolute() {
    return Buffer.from(this.heightAbsoluteBytes).readFloatLE()
  }

  public get weightAbsoluteBytes() {
    return this.bytes.slice(0xb0, 0xb4)
  }

  public set weightAbsoluteBytes(value: Uint8Array) {
    this.bytes.set(value, 0xb0)
  }

  public get weightAbsolute() {
    return Buffer.from(this.weightAbsoluteBytes).readFloatLE()
  }

  public get handlerName() {
    return utf16BytesToString(this.bytes, 0xb8, 12)
  }

  public set handlerName(value: string) {
    const utfBytes = utf16StringToBytes(value, 12)
    this.bytes.set(utfBytes, 0xb8)
  }

  public get handlerGender() {
    return getFlag(this.bytes, 0xd2, 0)
  }

  public set handlerGender(value: boolean) {
    setFlag(this.bytes, 0xd2, 0, value)
  }

  public get handlerLanguageIndex() {
    return this.bytes[0xd3]
  }

  public get handlerLanguage() {
    return Languages[this.languageIndex]
  }

  public set handlerLanguage(value: string) {
    const index = Languages.indexOf(value)
    if (index > -1) {
      this.bytes[0xd3] = index
    }
  }

  public get isCurrentHandler() {
    return !!this.bytes[0xd4]
  }

  public set isCurrentHandler(value: boolean) {
    this.bytes[0xd4] = value ? 1 : 0
  }

  public get handlerID() {
    return bytesToUint16LittleEndian(this.bytes, 0xd6)
  }

  public set handlerID(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0xd6)
  }

  public get handlerFriendship() {
    return this.bytes[0xd8]
  }

  public set handlerFriendship(value: number) {
    this.bytes[0xd8] = value
  }

  public get handlerMemory() {
    return {
      intensity: this.bytes[0xd9],
      memory: this.bytes[0xda],
      feeling: this.bytes[0xdb],
      textVariables: bytesToUint16LittleEndian(this.bytes, 0xdc),
    }
  }

  public set handlerMemory(value: memory) {
    this.bytes[0xd9] = value.intensity
    this.bytes[0xda] = value.memory
    this.bytes[0xdb] = value.feeling
    this.bytes.set(uint16ToBytesLittleEndian(value.textVariables), 0xdc)
  }

  public get fullness() {
    return this.bytes[0xec]
  }

  public set fullness(value: number) {
    this.bytes[0xec] = value
  }

  public get enjoyment() {
    return this.bytes[0xed]
  }

  public set enjoyment(value: number) {
    this.bytes[0xed] = value
  }

  public get gameOfOrigin() {
    return this.bytes[0xee]
  }

  public set gameOfOrigin(value: number) {
    this.bytes[0xee] = value
  }

  public get gameOfOriginBattle() {
    return this.bytes[0xef]
  }

  public set gameOfOriginBattle(value: number) {
    this.bytes[0xef] = value
  }

  public get region() {
    return this.bytes[0xf0]
  }

  public set region(value: number) {
    this.bytes[0xf0] = value
  }

  public get consoleRegion() {
    return this.bytes[0xf0]
  }

  public set consoleRegion(value: number) {
    this.bytes[0xf0] = value
  }

  public get languageIndex() {
    return this.bytes[0xf2]
  }

  public get language() {
    return Languages[this.languageIndex]
  }

  public set language(value: string) {
    const index = Languages.indexOf(value)
    if (index > -1) {
      this.bytes[0xf2] = index
    }
  }

  public set unknownF3(value: number) {
    this.bytes[0xf3] = value
  }

  public get unknownF3() {
    return this.bytes[0xf3]
  }

  public get formArgument() {
    return bytesToUint32LittleEndian(this.bytes, 0xf4)
  }

  public set formArgument(value: number) {
    this.bytes.set(uint32ToBytesLittleEndian(value), 0xf4)
  }

  public get affixedRibbon() {
    return this.bytes[0xf8] !== 0xff ? this.bytes[0xf8] : undefined
  }

  public set affixedRibbon(value: number | undefined) {
    this.bytes[0xf8] = value ?? 0xff
  }

  public get trainerName() {
    return utf16BytesToString(this.bytes, 0x110, 12)
  }

  public set trainerName(value: string) {
    const utfBytes = utf16StringToBytes(value, 12)
    this.bytes.set(utfBytes, 0x110)
  }

  public get trainerFriendship() {
    return this.bytes[0x12a]
  }

  public set trainerFriendship(value: number) {
    this.bytes[0x12a] = value
  }

  public get trainerMemory() {
    return {
      intensity: this.bytes[0x12b],
      memory: this.bytes[0x12c],
      feeling: this.bytes[0x130],
      textVariables: bytesToUint16LittleEndian(this.bytes, 0x12e),
    }
  }

  public set trainerMemory(value: memory) {
    this.bytes[0x12b] = value.intensity
    this.bytes[0x12c] = value.memory
    this.bytes[0x130] = value.feeling
    this.bytes.set(uint16ToBytesLittleEndian(value.textVariables), 0x12e)
  }

  public get eggDate() {
    return this.bytes[0x132]
      ? {
          year: this.bytes[0x131] + 2000,
          month: this.bytes[0x132],
          day: this.bytes[0x133],
        }
      : undefined
  }

  public set eggDate(value: pokedate | undefined) {
    this.bytes[0x131] = value?.year ? value.year - 2000 : 0
    this.bytes[0x132] = value?.month ?? 0
    this.bytes[0x133] = value?.day ?? 0
  }

  public get metDate() {
    return {
      year: this.bytes[0x134] + 2000,
      month: this.bytes[0x135],
      day: this.bytes[0x136],
    }
  }

  public set metDate(value: pokedate) {
    this.bytes[0x134] = value.year - 2000
    this.bytes[0x135] = value.month
    this.bytes[0x136] = value.day
  }

  public get ball() {
    return this.bytes[0x137]
  }

  public set ball(value: number) {
    this.bytes[0x137] = value
  }

  public get eggLocationIndex() {
    return bytesToUint16LittleEndian(this.bytes, 0x13a)
  }

  public set eggLocationIndex(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x13a)
  }

  public get eggLocation() {
    return undefined
  }

  public get metLocationIndex() {
    return bytesToUint16LittleEndian(this.bytes, 0x13a)
  }

  public set metLocationIndex(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x13a)
  }

  public get metLocation() {
    if (isBDSP(this.gameOfOrigin)) {
      return 'in the Sinnoh region made new'
    }
    if (this.gameOfOrigin !== GameOfOrigin.LegendsArceus) {
      return this.gameOfOrigin <= GameOfOrigin.Scarlet
        ? `in the ${GameOfOriginData[this.gameOfOrigin]?.region} region`
        : 'in a faraway place'
    }
    const locationBlock =
      LALocations[Math.floor(this.metLocationIndex / 10000) * 10000] ?? LALocations[0]
    return locationBlock[this.metLocationIndex % 10000]
  }

  public get metLevel() {
    return this.bytes[0x13d] & ~0x80
  }

  public set metLevel(value: number) {
    this.bytes[0x13d] = (this.bytes[0x13d] & 0x80) | (value & ~0x80)
  }

  public get trainerGender() {
    return getFlag(this.bytes, 0x13d, 7) ? 1 : 0
  }

  public set trainerGender(value: number) {
    setFlag(this.bytes, 0x13d, 7, !!value)
  }

  public get hyperTraining() {
    return {
      hp: getFlag(this.bytes, 0x13e, 0),
      atk: getFlag(this.bytes, 0x13e, 1),
      def: getFlag(this.bytes, 0x13e, 2),
      spa: getFlag(this.bytes, 0x13e, 3),
      spd: getFlag(this.bytes, 0x13e, 4),
      spe: getFlag(this.bytes, 0x13e, 5),
    }
  }

  public set hyperTraining(value: hyperTrainStats) {
    setFlag(this.bytes, 0x13e, 0, value.hp)
    setFlag(this.bytes, 0x13e, 1, value.atk)
    setFlag(this.bytes, 0x13e, 2, value.def)
    setFlag(this.bytes, 0x13e, 3, value.spa)
    setFlag(this.bytes, 0x13e, 4, value.spd)
    setFlag(this.bytes, 0x13e, 5, value.spe)
  }

  public get moveFlagsLA() {
    return this.bytes.slice(0x13f, 0x13f + 14)
  }

  public set moveFlagsLA(value: Uint8Array) {
    this.bytes.set(value.slice(0, 14), 0x13f)
  }

  public get homeTracker() {
    return this.bytes.slice(0x14d, 0x14d + 8)
  }

  public set homeTracker(value: Uint8Array) {
    this.bytes.set(value.slice(0, 8), 0x14d)
  }

  public get tutorFlagsLA() {
    return this.bytes.slice(0x155, 0x155 + 8)
  }

  public set tutorFlagsLA(value: Uint8Array) {
    this.bytes.set(value.slice(0, 8), 0x155)
  }

  public get masterFlagsLA() {
    return this.bytes.slice(0x15d, 0x15d + 8)
  }

  public set masterFlagsLA(value: Uint8Array) {
    this.bytes.set(value.slice(0, 8), 0x15d)
  }

  public get stats() {
    return {
      hp: bytesToUint16LittleEndian(this.bytes, 0x16a),
      atk: bytesToUint16LittleEndian(this.bytes, 0x16c),
      def: bytesToUint16LittleEndian(this.bytes, 0x16e),
      spe: bytesToUint16LittleEndian(this.bytes, 0x170),
      spa: bytesToUint16LittleEndian(this.bytes, 0x172),
      spd: bytesToUint16LittleEndian(this.bytes, 0x174),
    }
  }

  public set stats(value: stats) {
    this.bytes.set(uint16ToBytesLittleEndian(value.hp), 0x16a)
    this.bytes.set(uint16ToBytesLittleEndian(value.atk), 0x16c)
    this.bytes.set(uint16ToBytesLittleEndian(value.def), 0x16e)
    this.bytes.set(uint16ToBytesLittleEndian(value.spe), 0x170)
    this.bytes.set(uint16ToBytesLittleEndian(value.spa), 0x172)
    this.bytes.set(uint16ToBytesLittleEndian(value.spd), 0x174)
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
    return (
      (this.trainerID ^
        this.secretID ^
        bytesToUint16LittleEndian(this.bytes, 0x1c) ^
        bytesToUint16LittleEndian(this.bytes, 0x1e)) ===
      0
    )
  }
}
