import { Gen4Ribbons } from '@pokemon-resources/index'

import {
  AbilityIndex,
  Ball,
  Gender,
  Item,
  Language,
  Languages,
  MetadataLookup,
  NatureIndex,
  SpeciesLookup,
} from '@pkm-rs/pkg'
import * as byteLogic from '../util/byteLogic'
import * as encryption from '../util/encryption'
import { AllPKMFields, FourMoves } from '../util/pkmInterface'
import { filterRibbons } from '../util/ribbonLogic'
import { getStats } from '../util/statCalc'
import * as stringLogic from '../util/stringConversion'
import * as types from '../util/types'
import { generatePersonalityValuePreservingAttributes, MoveFilter } from '../util/util'

export default class PK5 {
  static getName() {
    return 'PK5'
  }
  format: 'PK5' = 'PK5'
  static getBoxSize() {
    return 136
  }
  personalityValue: number
  dexNum: number
  heldItemIndex: number
  trainerID: number
  secretID: number
  exp: number
  trainerFriendship: number
  ability?: AbilityIndex
  markings: types.MarkingsSixShapesNoColor
  language: Language
  evs: types.Stats
  contest: types.ContestStats
  moves: FourMoves
  movePP: FourMoves
  movePPUps: FourMoves
  ivs: types.Stats
  isEgg: boolean
  isNicknamed: boolean
  gender: number
  formeNum: number
  nature: NatureIndex
  isNsPokemon: boolean
  ribbonBytes: Uint8Array
  gameOfOrigin: number
  eggDate: types.PKMDate | undefined
  metDate: types.PKMDate | undefined
  eggLocationIndex: number
  metLocationIndex: number
  pokerusByte: number
  ball: number
  metLevel: number
  encounterType: number
  pokeStarFame: number
  statusCondition: number
  currentHP: number
  ribbons: string[]
  isFatefulEncounter: boolean
  nickname: string
  trainerName: string
  trainerGender: boolean
  checksum: number
  constructor(arg: ArrayBuffer | AllPKMFields, encrypted?: boolean) {
    if (arg instanceof ArrayBuffer) {
      let buffer = arg

      if (encrypted) {
        const unencryptedBytes = encryption.decryptByteArrayGen45(buffer)
        const unshuffledBytes = encryption.unshuffleBlocksGen45(unencryptedBytes)

        buffer = unshuffledBytes
      }

      const dataView = new DataView(buffer)

      this.personalityValue = dataView.getUint32(0x0, true)
      this.dexNum = dataView.getUint16(0x8, true)
      this.heldItemIndex = dataView.getUint16(0xa, true)
      this.trainerID = dataView.getUint16(0xc, true)
      this.secretID = dataView.getUint16(0xe, true)
      this.exp = dataView.getUint32(0x10, true)
      this.trainerFriendship = dataView.getUint8(0x14)
      this.ability = AbilityIndex.fromIndex(dataView.getUint8(0x15))
      this.markings = types.markingsSixShapesNoColorFromBytes(dataView, 0x16)
      this.language = Languages.fromByteOrNone(dataView.getUint8(0x17))
      this.evs = types.readStatsFromBytesU8(dataView, 0x18)
      this.contest = types.readContestStatsFromBytes(dataView, 0x1e)
      this.moves = [
        dataView.getUint16(0x28, true),
        dataView.getUint16(0x2a, true),
        dataView.getUint16(0x2c, true),
        dataView.getUint16(0x2e, true),
      ]
      this.movePP = [
        dataView.getUint8(0x30),
        dataView.getUint8(0x31),
        dataView.getUint8(0x32),
        dataView.getUint8(0x33),
      ]
      this.movePPUps = [
        dataView.getUint8(0x34),
        dataView.getUint8(0x35),
        dataView.getUint8(0x36),
        dataView.getUint8(0x37),
      ]
      this.ivs = types.read30BitIVsFromBytes(dataView, 0x38)
      this.isEgg = byteLogic.getFlag(dataView, 0x38, 30)
      this.isNicknamed = byteLogic.getFlag(dataView, 0x38, 31)
      this.gender = byteLogic.uIntFromBufferBits(dataView, 0x40, 1, 2, true)
      this.formeNum = byteLogic.uIntFromBufferBits(dataView, 0x40, 3, 5, true)
      this.nature = new NatureIndex(dataView.getUint8(0x41))
      this.isNsPokemon = byteLogic.getFlag(dataView, 0x42, 1)
      this.ribbonBytes = new Uint8Array(buffer).slice(0x4c, 0x50)
      this.gameOfOrigin = dataView.getUint8(0x5f)
      this.eggDate = types.pkmDateFromBytes(dataView, 0x78)
      this.metDate = types.pkmDateFromBytes(dataView, 0x7b)
      this.eggLocationIndex = dataView.getUint16(0x7e, true)
      this.metLocationIndex = dataView.getUint16(0x80, true)
      this.pokerusByte = dataView.getUint8(0x82)
      this.ball = dataView.getUint8(0x83)
      this.metLevel = dataView.getUint8(0x84)
      this.encounterType = dataView.getUint8(0x85)
      this.pokeStarFame = dataView.getUint8(0x87)
      if (dataView.byteLength >= 236) {
        this.statusCondition = dataView.getUint8(0x88)
      } else {
        this.statusCondition = 0
      }

      if (dataView.byteLength >= 236) {
        this.currentHP = dataView.getUint8(0x8e)
      } else {
        this.currentHP = 0
      }

      this.ribbons = byteLogic
        .getFlagIndexes(dataView, 0x24, 0, 28)
        .map((index) => Gen4Ribbons[index])
        .concat(
          byteLogic.getFlagIndexes(dataView, 0x3c, 0, 32).map((index) => Gen4Ribbons[index + 28])
        )
        .concat(
          byteLogic.getFlagIndexes(dataView, 0x60, 0, 20).map((index) => Gen4Ribbons[index + 60])
        )
      this.isFatefulEncounter = byteLogic.getFlag(dataView, 0x40, 0)
      this.nickname = stringLogic.readGen5StringFromBytes(dataView, 0x48, 12)
      this.trainerName = stringLogic.readGen5StringFromBytes(dataView, 0x68, 8)
      this.trainerGender = byteLogic.getFlag(dataView, 0x84, 7)
      this.checksum = dataView.getUint16(0x6, true)
    } else {
      const other = arg

      this.personalityValue = this.personalityValue =
        generatePersonalityValuePreservingAttributes(other) ?? 0
      this.dexNum = other.dexNum
      this.heldItemIndex = other.heldItemIndex
      this.trainerID = other.trainerID
      this.secretID = other.secretID
      this.exp = other.exp
      this.trainerFriendship = other.trainerFriendship ?? 0
      this.ability = other.ability
      this.markings = types.markingsSixShapesNoColorFromOther(other.markings) ?? {
        circle: false,
        triangle: false,
        square: false,
        heart: false,
        star: false,
        diamond: false,
      }
      this.language = other.language
      this.evs = other.evs ?? {
        hp: 0,
        atk: 0,
        def: 0,
        spe: 0,
        spa: 0,
        spd: 0,
      }
      this.contest = other.contest ?? {
        cool: 0,
        beauty: 0,
        cute: 0,
        smart: 0,
        tough: 0,
        sheen: 0,
      }

      const moveFilter = MoveFilter.fromPkmClass(PK5)
      this.moves = moveFilter.moves(other)
      this.movePP = moveFilter.movePp(other, this.format)
      this.movePPUps = moveFilter.movePpUps(other)

      this.ivs = other.ivs ?? {
        hp: 0,
        atk: 0,
        def: 0,
        spe: 0,
        spa: 0,
        spd: 0,
      }
      this.isEgg = other.isEgg ?? false
      this.isNicknamed = other.isNicknamed ?? false
      this.gender =
        other.gender ?? this.metadata?.genderFromPid(this.personalityValue) ?? Gender.Genderless
      this.formeNum = other.formeNum
      this.nature = other.nature ?? NatureIndex.newFromPid(this.personalityValue)
      this.isNsPokemon = other.isNsPokemon ?? false
      this.ribbonBytes = other.ribbonBytes ?? new Uint8Array(4)
      this.gameOfOrigin = other.gameOfOrigin
      this.eggDate = other.eggDate ?? {
        month: new Date().getMonth(),
        day: new Date().getDate(),
        year: new Date().getFullYear(),
      }
      this.metDate = other.metDate ?? {
        month: new Date().getMonth(),
        day: new Date().getDate(),
        year: new Date().getFullYear(),
      }
      this.eggLocationIndex = other.eggLocationIndex ?? 0
      this.metLocationIndex = other.metLocationIndex ?? 0
      this.pokerusByte = other.pokerusByte ?? 0
      if (other.ball && PK5.maxValidBall() >= other.ball) {
        this.ball = other.ball
      } else {
        this.ball = Ball.Poke
      }

      this.metLevel = other.metLevel ?? 0
      this.encounterType = other.encounterType ?? 0
      this.pokeStarFame = other.pokeStarFame ?? 0
      this.statusCondition = other.statusCondition ?? 0
      this.currentHP = other.currentHP ?? 0
      this.ribbons = filterRibbons(other.ribbons ?? [], [Gen4Ribbons], '') ?? []
      this.isFatefulEncounter = other.isFatefulEncounter ?? false
      this.nickname = other.nickname
      this.trainerName = other.trainerName
      this.trainerGender = other.trainerGender
      this.checksum = other.checksum ?? 0
    }
  }

  static fromBytes(buffer: ArrayBuffer): PK5 {
    return new PK5(buffer)
  }

  toBytes(options?: types.ToBytesOptions): ArrayBuffer {
    const buffer = new ArrayBuffer(options?.includeExtraFields ? 236 : 136)
    const dataView = new DataView(buffer)

    dataView.setUint32(0x0, this.personalityValue, true)
    dataView.setUint16(0x8, this.dexNum, true)
    dataView.setUint16(0xa, this.heldItemIndex, true)
    dataView.setUint16(0xc, this.trainerID, true)
    dataView.setUint16(0xe, this.secretID, true)
    dataView.setUint32(0x10, this.exp, true)
    dataView.setUint8(0x14, this.trainerFriendship)
    dataView.setUint8(0x15, this.ability?.index ?? 0)
    types.markingsSixShapesNoColorToBytes(dataView, 0x16, this.markings)
    dataView.setUint8(0x17, this.language)
    types.writeStatsToBytesU8(dataView, 0x18, this.evs)
    types.writeContestStatsToBytes(dataView, 0x1e, this.contest)
    for (let i = 0; i < 4; i++) {
      dataView.setUint16(0x28 + i * 2, this.moves[i], true)
    }

    for (let i = 0; i < 4; i++) {
      dataView.setUint8(0x30 + i, this.movePP[i])
    }

    for (let i = 0; i < 4; i++) {
      dataView.setUint8(0x34 + i, this.movePPUps[i])
    }

    types.write30BitIVsToBytes(dataView, 0x38, this.ivs)
    byteLogic.setFlag(dataView, 0x38, 30, this.isEgg)
    byteLogic.setFlag(dataView, 0x38, 31, this.isNicknamed)
    byteLogic.uIntToBufferBits(dataView, this.gender, 64, 1, 2, true)
    byteLogic.uIntToBufferBits(dataView, this.formeNum, 64, 3, 5, true)
    dataView.setUint8(0x41, this.nature.index)
    byteLogic.setFlag(dataView, 0x42, 1, this.isNsPokemon)
    new Uint8Array(buffer).set(new Uint8Array(this.ribbonBytes.slice(0, 4)), 0x4c)
    dataView.setUint8(0x5f, this.gameOfOrigin)
    types.writePKMDateToBytes(dataView, 0x78, this.eggDate)
    types.writePKMDateToBytes(dataView, 0x7b, this.metDate)
    dataView.setUint16(0x7e, this.eggLocationIndex, true)
    dataView.setUint16(0x80, this.metLocationIndex, true)
    dataView.setUint8(0x82, this.pokerusByte)
    dataView.setUint8(0x83, this.ball)
    dataView.setUint8(0x84, this.metLevel)
    dataView.setUint8(0x85, this.encounterType)
    dataView.setUint8(0x87, this.pokeStarFame)
    if (options?.includeExtraFields) {
      dataView.setUint8(0x88, this.statusCondition)
    }

    if (options?.includeExtraFields) {
      dataView.setUint8(0x8e, this.currentHP)
    }

    byteLogic.setFlagIndexes(
      dataView,
      0x24,
      0,
      this.ribbons
        .map((ribbon) => Gen4Ribbons.indexOf(ribbon))
        .filter((index) => index > -1 && index < 28)
    )
    byteLogic.setFlagIndexes(
      dataView,
      0x3c,
      0,
      this.ribbons
        .map((ribbon) => Gen4Ribbons.indexOf(ribbon) - 28)
        .filter((index) => index > -1 && index < 32)
    )
    byteLogic.setFlagIndexes(
      dataView,
      0x60,
      0,
      this.ribbons
        .map((ribbon) => Gen4Ribbons.indexOf(ribbon) - 60)
        .filter((index) => index > -1 && index < 20)
    )
    byteLogic.setFlag(dataView, 0x40, 0, this.isFatefulEncounter)
    stringLogic.writeGen5StringToBytes(dataView, this.nickname, 0x48, 12)
    stringLogic.writeGen5StringToBytes(dataView, this.trainerName, 0x68, 8)
    byteLogic.setFlag(dataView, 0x84, 7, this.trainerGender)
    dataView.setUint16(0x6, this.checksum, true)
    return buffer
  }

  public getStats() {
    return getStats(this)
  }

  public get languageString() {
    return Languages.stringFromByte(this.language)
  }

  public get heldItemName() {
    return Item.fromIndex(this.heldItemIndex)?.name ?? 'None'
  }

  public get abilityNum() {
    return ((this.personalityValue >> 16) & 1) + 1
  }

  public calcChecksum() {
    return encryption.get16BitChecksumLittleEndian(this.toBytes(), 0x08, 0x87)
  }

  public refreshChecksum() {
    this.checksum = encryption.get16BitChecksumLittleEndian(this.toBytes(), 0x08, 0x87)
  }

  public toPCBytes() {
    const shuffledBytes = encryption.shuffleBlocksGen45(this.toBytes())

    return encryption.decryptByteArrayGen45(shuffledBytes)
  }

  public getLevel() {
    return this.speciesMetadata?.calculateLevel(this.exp) ?? 1
  }

  isShiny() {
    return (
      (this.trainerID ^
        this.secretID ^
        (this.personalityValue & 0xffff) ^
        ((this.personalityValue >> 16) & 0xffff)) <
      8
    )
  }

  isSquareShiny() {
    return !(
      this.trainerID ^
      this.secretID ^
      (this.personalityValue & 0xffff) ^
      ((this.personalityValue >> 16) & 0xffff)
    )
  }

  public get metadata() {
    return MetadataLookup(this.dexNum, this.formeNum)
  }

  public get speciesMetadata() {
    return SpeciesLookup(this.dexNum)
  }

  static maxValidMove() {
    return 559
  }

  static maxValidBall() {
    return 25
  }

  static allowedBalls() {
    return []
  }
}
