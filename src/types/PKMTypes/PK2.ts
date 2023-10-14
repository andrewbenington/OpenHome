import { statsPreSplit } from 'types/types'
import {
  GameOfOrigin,
  GameOfOriginData,
  NDex,
  POKEMON_DATA,
} from '../../consts'
import CrystalLocation from '../../consts/MetLocation/Crystal'
import {
  ItemGen2FromString,
  ItemGen2ToString,
} from '../../resources/gen/items/Gen2'
import {
  bytesToUint16BigEndian,
  bytesToUint24BigEndian,
  getFlag,
  setFlag,
  uint16ToBytesBigEndian,
  uint24ToBytesBigEndian,
} from '../../util/ByteLogic'
import { getLevelGen12 } from '../../util/StatCalc'
import { gen12StringToUTF } from '../../util/Strings/StringConverter'
import { OHPKM } from './OHPKM'
import { PKM } from './PKM'
import { adjustMovePPBetweenFormats } from './util'

export const GEN2_MOVE_MAX = 251

export class PK2 extends PKM {
  public get format() {
    return 'PK2'
  }

  public get dexNum() {
    return this.bytes[0x00]
  }

  public set dexNum(value: number) {
    this.bytes[0x00] = value
  }

  public get heldItemIndex() {
    return this.bytes[0x01]
  }

  public set heldItemIndex(value: number) {
    this.bytes[0x01] = value
  }

  public get heldItem() {
    return ItemGen2ToString(this.heldItemIndex)
  }

  public set heldItem(value: string) {
    const itemIndex = ItemGen2FromString(value)
    if (itemIndex > -1) {
      this.heldItemIndex = itemIndex
    }
  }

  public get trainerID() {
    return bytesToUint16BigEndian(this.bytes, 0x06)
  }

  public set trainerID(value: number) {
    this.bytes.set(uint16ToBytesBigEndian(value), 0x06)
  }

  public get displayID() {
    return this.trainerID
  }

  public get gender() {
    const maleRatio =
      POKEMON_DATA[this.dexNum].formes[0].genderRatio.M > 0 ||
      POKEMON_DATA[this.dexNum].formes[0].genderRatio.F > 0
        ? POKEMON_DATA[this.dexNum].formes[0].genderRatio.M
        : -1
    if (maleRatio === -1) {
      return 2
    }
    return this.dvs.atk < maleRatio * 15 ? 1 : 0
  }

  public get formNum() {
    if (this.dexNum === NDex.UNOWN) {
      let ivCombinationVal = ((this.dvs.atk >> 1) & 0b11) << 6
      ivCombinationVal += ((this.dvs.def >> 1) & 0b11) << 4
      ivCombinationVal += ((this.dvs.spe >> 1) & 0b11) << 2
      ivCombinationVal += (this.dvs.spc >> 1) & 0b11
      ivCombinationVal /= 10
      return Math.floor(ivCombinationVal)
    }
    return 0
  }

  public get exp() {
    return bytesToUint24BigEndian(this.bytes, 0x08)
  }

  public set exp(value: number) {
    this.bytes.set(uint24ToBytesBigEndian(value), 0x08)
  }

  public get level() {
    return this.bytes[0x1f]
  }

  public set level(value: number) {
    this.bytes[0x1f] = value
  }

  public get moves() {
    return [
      this.bytes[0x02],
      this.bytes[0x03],
      this.bytes[0x04],
      this.bytes[0x05],
    ]
  }

  public set moves(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes[0x02 + i] = value[i]
    }
  }

  public get evsG12() {
    return {
      hp: bytesToUint16BigEndian(this.bytes, 0x0b),
      atk: bytesToUint16BigEndian(this.bytes, 0x0d),
      def: bytesToUint16BigEndian(this.bytes, 0x0f),
      spe: bytesToUint16BigEndian(this.bytes, 0x11),
      spc: bytesToUint16BigEndian(this.bytes, 0x13),
    }
  }

  public set evsG12(value: statsPreSplit) {
    this.bytes.set(uint16ToBytesBigEndian(value.hp), 0x0b)
    this.bytes.set(uint16ToBytesBigEndian(value.atk), 0x0d)
    this.bytes.set(uint16ToBytesBigEndian(value.def), 0x0f)
    this.bytes.set(uint16ToBytesBigEndian(value.spe), 0x11)
    this.bytes.set(uint16ToBytesBigEndian(value.spc), 0x13)
  }

  public get dvs() {
    const dvBytes = bytesToUint16BigEndian(this.bytes, 0x15)
    return {
      spc: dvBytes & 0x0f,
      spe: (dvBytes >> 4) & 0x0f,
      def: (dvBytes >> 8) & 0x0f,
      atk: (dvBytes >> 12) & 0x0f,
      hp:
        (((dvBytes >> 12) & 1) << 3) |
        (((dvBytes >> 8) & 1) << 2) |
        (((dvBytes >> 4) & 1) << 1) |
        (dvBytes & 1),
    }
  }

  public set dvs(value: statsPreSplit) {
    let dvBytes = value.atk & 0x0f
    dvBytes = (dvBytes << 4) | (value.def & 0x0f)
    dvBytes = (dvBytes << 4) | (value.spe & 0x0f)
    dvBytes = (dvBytes << 4) | (value.spc & 0x0f)
    this.bytes.set(uint16ToBytesBigEndian(dvBytes), 0x15)
  }

  public get movePP() {
    return [
      this.bytes[0x17],
      this.bytes[0x18],
      this.bytes[0x19],
      this.bytes[0x1a],
    ]
  }

  public set movePP(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes[0x17 + i] = value[i]
    }
  }

  public get trainerFriendship() {
    return this.isEgg ? 0 : this.bytes[0x1b]
  }

  public set trainerFriendship(value: number) {
    if (!this.isEgg) {
      this.bytes[0x1b] = value
    }
  }

  public get pokerusByte() {
    return this.bytes[0x1c]
  }

  public set pokerusByte(value: number) {
    this.bytes[0x1c] = value
  }

  public get metLocationIndex() {
    return this.bytes[0x1e] & 0x7f
  }

  public set metLocationIndex(value: number | undefined) {
    if (value) {
      this.bytes[0x1e] = (this.bytes[0x1e] & 0x10) | (value & 0x7f)
    } else {
      this.bytes[0x1e] = this.bytes[0x1e] & 0x10
    }
  }

  public get metTimeOfDay() {
    return ((this.bytes[0x1d] >> 6) & 0b11) > 0
      ? (this.bytes[0x1d] >> 6) & 0b11
      : undefined
  }

  public set metTimeOfDay(value: number | undefined) {
    if (value) {
      this.bytes[0x1d] = (this.bytes[0x1d] & 0x3f) | ((value & 0b11) << 6)
    } else {
      this.bytes[0x1d] = this.bytes[0x1d] & 0x3f
    }
  }

  public get metLevel() {
    return (this.bytes[0x1d] & 0x3f) > 0 ? this.bytes[0x1d] & 0x3f : undefined
  }

  public set metLevel(value: number | undefined) {
    if (value) {
      this.bytes[0x1d] = (this.bytes[0x1d] & 0xc0) | (value & 0x3f)
    } else {
      this.bytes[0x1d] = this.bytes[0x1d] & 0xc0
    }
  }

  public get trainerGender() {
    return getFlag(this.bytes, 0x1e, 7) ? 1 : 0
  }

  public set trainerGender(value: number) {
    setFlag(this.bytes, 0x1e, 7, !!value)
  }

  public get isShiny() {
    return (
      this.dvs.spe === 10 &&
      this.dvs.def === 10 &&
      this.dvs.spc === 10 &&
      [2, 3, 6, 7, 10, 11, 14, 15].includes(this.dvs.atk)
    )
  }

  constructor(...args: any[]) {
    if (args[0] instanceof Uint8Array) {
      super(args[0])
      if (this.bytes.length >= 0x46) {
        this.trainerName = gen12StringToUTF(this.bytes, 0x30, 8)
        this.nickname = gen12StringToUTF(this.bytes, 0x3b, 11)
      } else {
        this.nickname = POKEMON_DATA[this.dexNum].name.toLocaleUpperCase()
      }
      this.gameOfOrigin =
        this.metLocationIndex === 0 ? GameOfOrigin.Gold : GameOfOrigin.Crystal
    } else if (args[0] instanceof OHPKM) {
      super(new Uint8Array(32))
      const other = args[0]
      this.dexNum = other.dexNum
      this.heldItem = other.heldItem
      // treated as a tracking number for non-GB origin mons
      if (!other.isGameBoyOrigin) {
        this.trainerID = other.personalityValue % 0x10000
      } else {
        this.trainerID = other.trainerID
      }
      this.exp = other.exp
      this.level = this.dexNum > 0 ? getLevelGen12(this.dexNum, this.exp) : 0
      this.pokerusByte = other.pokerusByte
      const validMoves = other.moves.filter((move) => move <= GEN2_MOVE_MAX)
      const validMovePP = adjustMovePPBetweenFormats(this, other).filter(
        (_, i) => other.moves[i] <= GEN2_MOVE_MAX
      )
      const validMovePPUps = other.movePPUps.filter(
        (_, i) => other.moves[i] <= GEN2_MOVE_MAX
      )
      this.moves = [validMoves[0], validMoves[1], validMoves[2], validMoves[3]]
      this.movePP = [
        validMovePP[0],
        validMovePP[1],
        validMovePP[2],
        validMovePP[3],
      ]
      this.movePPUps = [
        validMovePPUps[0],
        validMovePPUps[1],
        validMovePPUps[2],
        validMovePPUps[3],
      ]
      this.dvs = other.dvs
      this.nickname = other.nickname
      this.isEgg = other.isEgg
      this.trainerName = other.trainerName
      this.trainerFriendship = other.trainerFriendship
      this.metLevel = other.metLevel

      if (
        other.gameOfOrigin >= GameOfOrigin.Gold &&
        other.gameOfOrigin <= GameOfOrigin.Crystal
      ) {
        this.metLocationIndex = other.metLocationIndex
      } else if (
        GameOfOriginData[other.gameOfOrigin]?.region === 'Johto' ||
        GameOfOriginData[other.gameOfOrigin]?.region === 'Kanto'
      ) {
        this.metLocationIndex = other.metLocation
          ? CrystalLocation[0].indexOf(other.metLocation.slice(3))
          : 0
      }
      this.metTimeOfDay = other.metTimeOfDay
      this.trainerGender = other.trainerGender
      this.gameOfOrigin = other.gameOfOrigin
      this.language = other.language
    } else {
      super(new Uint8Array())
    }
  }
}
