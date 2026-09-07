import { OHPKM } from '@openhome-core/pkm/OHPKM'
import * as byteLogic from '@openhome-core/util/byteLogic'
import { Errorable, R } from '@openhome-core/util/functional'
import { FourMoves } from '@openhome-core/util/types'
import {
  BinaryGender,
  calculateStatsGen1,
  ConvertStrategy,
  Generation,
  ItemGen1,
  Language,
  Lookup,
  metadataReaderFor,
  MetadataSource,
  MetadataSummaryLookup,
  OriginGames,
  PkmTypes,
  SpeciesLookup,
  StatsPreSplit,
} from '@pkm-rs/pkg'
import * as stringLogic from '../util/stringConversion'
import * as types from '../util/types'
import { MoveFilter } from '../util/util'
import * as conversion from './conversion'
import { PkmConverter } from './conversion/converter'
import { PkmConstructorOptions } from './PKM'

const BOX_SIZE_WESTERN = 69
const BOX_SIZE_JAPAN = 59

export default class PK1 {
  static getFormat() {
    return 'PK1' as const
  }
  format: 'PK1' = 'PK1'
  static getBoxSize() {
    return 33
  }
  gameOfOrigin: number
  language: Language
  nationalDex: number
  currentHP: number
  level: number
  statusCondition: number
  type1: number
  type2: number
  heldItemIndexGen1?: ItemGen1
  moves: FourMoves
  trainerID: number
  exp: number
  evsG12: StatsPreSplit
  dvs: StatsPreSplit
  movePP: FourMoves
  movePPUps: FourMoves
  trainerName: string
  nickname: string
  originalBytes?: ArrayBuffer

  constructor(arg: ArrayBuffer | OHPKM, options: PkmConstructorOptions) {
    if (arg instanceof ArrayBuffer) {
      const buffer = new Uint8Array(arg)[2] === 0xff ? arg.slice(3) : arg
      this.originalBytes = buffer
      const dataView = new DataView(buffer)
      this.gameOfOrigin = 0
      this.language = 0
      this.nationalDex = conversion.fromGen1PokemonIndex(dataView.getUint8(0x0))
      this.currentHP = dataView.getUint16(0x1, false)
      this.level = dataView.getUint8(0x3)
      this.statusCondition = dataView.getUint8(0x4)
      this.type1 = dataView.getUint8(0x5)
      this.type2 = dataView.getUint8(0x6)
      this.heldItemIndexGen1 = ItemGen1.fromIndex(dataView.getUint8(0x7))
      this.moves = [
        dataView.getUint8(0x8),
        dataView.getUint8(0x9),
        dataView.getUint8(0xa),
        dataView.getUint8(0xb),
      ]
      this.trainerID = dataView.getUint16(0xc, false)
      this.exp = (dataView.getUint32(0xe, false) >> 8) & 0xffffff
      this.evsG12 = {
        hp: dataView.getUint16(0x11, false),
        atk: dataView.getUint16(0x13, false),
        def: dataView.getUint16(0x15, false),
        spe: dataView.getUint16(0x17, false),
        spc: dataView.getUint16(0x19, false),
      }
      this.dvs = types.readDVsFromBytes(dataView, 0x1b)
      this.movePP = [
        byteLogic.uIntFromBufferBits(dataView, 0x1d, 0, 6, false),
        byteLogic.uIntFromBufferBits(dataView, 0x1e, 0, 6, false),
        byteLogic.uIntFromBufferBits(dataView, 0x1f, 0, 6, false),
        byteLogic.uIntFromBufferBits(dataView, 0x20, 0, 6, false),
      ]
      this.movePPUps = [
        byteLogic.uIntFromBufferBits(dataView, 0x1d, 6, 2, false),
        byteLogic.uIntFromBufferBits(dataView, 0x1e, 6, 2, false),
        byteLogic.uIntFromBufferBits(dataView, 0x1f, 6, 2, false),
        byteLogic.uIntFromBufferBits(dataView, 0x20, 6, 2, false),
      ]
      if (dataView.byteLength >= 66) {
        this.trainerName = stringLogic.readGameBoyStringFromBytes(dataView, 0x2c, 8)
      } else {
        this.trainerName = 'TRAINER'
      }

      if (dataView.byteLength >= 66) {
        this.nickname = stringLogic.readGameBoyStringFromBytes(dataView, 0x37, 11)
      } else {
        this.nickname = Lookup.speciesName(this.nationalDex, this.language)
      }
    } else {
      const converter = new PkmConverter(this.format, options.strategy)
      const other = arg
      this.gameOfOrigin = other.gameOfOrigin
      this.language = other.language
      this.nationalDex = other.nationalDex
      this.statusCondition = 0

      const metadataReader = metadataReaderFor(MetadataSource.Yellow, this.nationalDex, 0)

      const type1Enum = metadataReader?.type1()
      this.type1 = type1Enum ? PkmTypes.toGameboyIndex(type1Enum) : 0
      const type2Enum = metadataReader?.type2()
      this.type2 = type2Enum ? PkmTypes.toGameboyIndex(type2Enum) : 0

      this.heldItemIndexGen1 = ItemGen1.fromModern(other.heldItemIndex)

      const moveFilter = MoveFilter.fromPkmClass(PK1)
      this.moves = moveFilter.moves(other)
      this.movePP = moveFilter.movePp(other, this.format)
      this.movePPUps = moveFilter.movePpUps(other)

      if (
        !(
          OriginGames.generation(other.gameOfOrigin) === Generation.G1 ||
          OriginGames.generation(other.gameOfOrigin) === Generation.G2
        ) &&
        other.personalityValue !== undefined
      ) {
        this.trainerID = other.personalityValue % 0x10000
      } else {
        this.trainerID = other.trainerID
      }
      this.exp = other.exp
      this.evsG12 = other.evsG12 ?? {
        hp: 0,
        atk: 0,
        def: 0,
        spe: 0,
        spc: 0,
      }
      this.dvs = other.dvs
      this.dvs.hp =
        ((this.dvs.atk & 1) << 3) |
        ((this.dvs.def & 1) << 2) |
        ((this.dvs.spe & 1) << 1) |
        (this.dvs.spc & 1) // old OHPKMs calculated this incorrectly
      this.trainerName = other.trainerName
      this.nickname = converter.nickname(other)
    }

    this.level = this.getLevel()
    this.currentHP = this.getStats().hp
  }

  static fromBytes(buffer: ArrayBuffer): PK1 {
    return new PK1(buffer, { encrypted: false })
  }

  static fromOhpkm(ohpkm: OHPKM, strategy: ConvertStrategy): Errorable<PK1> {
    return R.tryFrom(() => new PK1(ohpkm, { strategy }))
  }

  toBytes(options?: types.ToBytesOptions): ArrayBuffer {
    const buffer = new ArrayBuffer(
      this.language === Language.Japanese ? BOX_SIZE_JAPAN : BOX_SIZE_WESTERN
    )
    const dataView = new DataView(buffer)

    dataView.setUint8(0x0, conversion.toGen1PokemonIndex(this.nationalDex))
    dataView.setUint16(0x1, this.currentHP, false)
    dataView.setUint8(0x3, this.level)
    dataView.setUint8(0x4, this.statusCondition)
    dataView.setUint8(0x5, this.type1)
    dataView.setUint8(0x6, this.type2)
    dataView.setUint8(0x7, this.heldItemIndexGen1?.index ?? 0)
    for (let i = 0; i < 4; i++) {
      dataView.setUint8(0x8 + i, this.moves[i])
    }
    dataView.setUint16(0xc, this.trainerID, false)
    new Uint8Array(buffer).set(byteLogic.uint24ToBytesBigEndian(this.exp), 0xe)
    dataView.setUint16(0x11, this.evsG12.hp, false)
    dataView.setUint16(0x13, this.evsG12.atk, false)
    dataView.setUint16(0x15, this.evsG12.def, false)
    dataView.setUint16(0x17, this.evsG12.spe, false)
    dataView.setUint16(0x19, this.evsG12.spc, false)

    types.writeDVsToBytes(this.dvs, dataView, 0x1b)
    for (let i = 0; i < 4; i++) {
      byteLogic.uIntToBufferBits(dataView, this.movePP[i], 0x1d + i, 0, 6, false)
    }

    for (let i = 0; i < 4; i++) {
      byteLogic.uIntToBufferBits(dataView, this.movePPUps[i], 0x1d + i, 6, 2, false)
    }

    const stats = this.getStats()
    dataView.setUint8(0x21, this.getLevel())
    dataView.setUint16(0x22, stats.hp, false)
    dataView.setUint16(0x24, stats.atk, false)
    dataView.setUint16(0x26, stats.def, false)
    dataView.setUint16(0x28, stats.spe, false)
    dataView.setUint16(0x2a, stats.spc, false)

    if (options?.includeExtraFields) {
      stringLogic.writeGameBoyStringToBytes(dataView, this.trainerName, 0x2c, 8, true)
    }

    if (options?.includeExtraFields) {
      stringLogic.writeGameBoyStringToBytes(dataView, this.nickname, 0x37, 11, true)
    }
    return buffer
  }

  public getStats() {
    return calculateStatsGen1(this.nationalDex, this.dvs, this.evsG12, this.level)
  }

  public get gender() {
    return this.metadata?.genderFromAtkDv(this.dvs.atk)
  }

  public get heldItemIndex() {
    return this.heldItemIndexGen1?.toModern()?.index ?? 0
  }

  public get heldItemName() {
    return this.heldItemIndexGen1?.name ?? 'None'
  }

  public get trainerGender() {
    return BinaryGender.Male
  }

  public get secretID() {
    return 0
  }

  public get formIndex() {
    return 0
  }

  public getLevel() {
    return this.speciesMetadata?.calculateLevel(this.exp) ?? 1
  }

  isShiny() {
    return (
      this.dvs.spe === 10 &&
      this.dvs.def === 10 &&
      this.dvs.spc === 10 &&
      [2, 3, 6, 7, 10, 11, 14, 15].includes(this.dvs.atk)
    )
  }

  isSquareShiny() {
    return false
  }

  public get metadata() {
    return MetadataSummaryLookup(this.nationalDex, this.formIndex)
  }

  public get speciesMetadata() {
    return SpeciesLookup(this.nationalDex)
  }

  static maxValidMove() {
    return 165
  }

  static maxValidBall() {
    return 0
  }
}
