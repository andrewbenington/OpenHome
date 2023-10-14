import { GameOfOrigin, Languages } from '../../consts'
import { Gen9RibbonsPart1, Gen9RibbonsPart2 } from '../../consts/Ribbons'
import { ItemToString } from '../../resources/gen/items/Items'
import { AbilityToString } from '../../resources/gen/other/Abilities'
import {
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
  uint16ToBytesLittleEndian,
  uint32ToBytesLittleEndian,
} from '../../util/ByteLogic'
import {
  getHPGen3Onward,
  getLevelGen3Onward,
  getStatGen3Onward,
} from '../../util/StatCalc'
import { PKM } from './PKM'

export class PK8 extends PKM {
  public get abilityNum() {
    return this.bytes[0x16] & 7
  }

  public set abilityNum(value: number) {
    this.bytes[0x16] = (this.bytes[0x16] & 0b11111000) | (value & 7)
  }

  public get favorite() {
    return !!(this.bytes[0x16] & 8)
  }

  public set favorite(value: boolean) {
    this.bytes[0x16] = (this.bytes[0x16] & 0b11110111) | (value ? 8 : 0)
  }

  public get canGigantamax() {
    return !!(this.bytes[0x16] & 16)
  }

  public set canGigantamax(value: boolean) {
    this.bytes[0x16] = (this.bytes[0x16] & 0b11101111) | (value ? 16 : 0)
  }

  public get affixedRibbon() {
    return this.bytes[0xe8] !== 0xff ? this.bytes[0xe8] : undefined
  }

  public set affixedRibbon(value: number | undefined) {
    this.bytes[0xe8] = value ?? 0xff
  }

  public get metLocationIndex() {
    return bytesToUint16LittleEndian(this.bytes, 0x122)
  }

  public set metLocationIndex(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x122)
  }

  constructor(bytes: Uint8Array, format: string) {
    super(bytes)
    this.format = format
    this.bytes = bytes
    this.encryptionConstant = bytesToUint32LittleEndian(bytes, 0x00)
    this.personalityValue = bytesToUint32LittleEndian(bytes, 0x1c)
    this.dexNum = bytesToUint16LittleEndian(bytes, 0x08)
    this.exp = bytesToUint32LittleEndian(bytes, 0x10)
    this.formNum = bytesToUint16LittleEndian(bytes, 0x24)
    this.heldItem = ItemToString(bytesToUint16LittleEndian(bytes, 0x0a))
    this.ability = AbilityToString(bytesToUint16LittleEndian(bytes, 0x14))
    this.abilityNum = bytes[0x16] & 7
    // this.markings = bytes[0x18];
    this.nature = bytes[0x20]
    this.statNature = bytes[0x21]
    this.isFatefulEncounter = !!(bytes[0x22] & 1)
    this.canGigantamax = !!(bytes[0x16] & 16)
    this.dynamaxLevel = bytes[0x90]
    this.isFatefulEncounter = !!(bytes[0x22] & 1)
    this.trainerID = bytesToUint16LittleEndian(bytes, 0x0c)
    this.secretID = bytesToUint16LittleEndian(bytes, 0x0e)
    this.ball = bytes[0x124]
    this.metLevel = bytes[0x125] & ~0x80
    this.trainerGender = bytes[0x125] >> 7
    this.moves = [
      bytesToUint16LittleEndian(bytes, 0x72),
      bytesToUint16LittleEndian(bytes, 0x74),
      bytesToUint16LittleEndian(bytes, 0x76),
      bytesToUint16LittleEndian(bytes, 0x78),
    ]
    this.relearnMoves = [
      bytesToUint16LittleEndian(bytes, 0x82),
      bytesToUint16LittleEndian(bytes, 0x84),
      bytesToUint16LittleEndian(bytes, 0x86),
      bytesToUint16LittleEndian(bytes, 0x88),
    ]
    this.level = getLevelGen3Onward(this.dexNum, this.exp)
    const ivBytes = bytesToUint32LittleEndian(bytes, 0x8c)
    this.ivs = {
      hp: ivBytes & 0x1f,
      atk: (ivBytes >> 5) & 0x1f,
      def: (ivBytes >> 10) & 0x1f,
      spe: (ivBytes >> 15) & 0x1f,
      spa: (ivBytes >> 20) & 0x1f,
      spd: (ivBytes >> 25) & 0x1f,
    }
    this.evs = {
      hp: bytes[0x26],
      atk: bytes[0x27],
      def: bytes[0x28],
      spa: bytes[0x29],
      spd: bytes[0x2a],
      spe: bytes[0x2b],
    }
    this.stats = {
      hp: getHPGen3Onward(this),
      atk: getStatGen3Onward('Atk', this),
      def: getStatGen3Onward('Def', this),
      spe: getStatGen3Onward('Spe', this),
      spa: getStatGen3Onward('SpA', this),
      spd: getStatGen3Onward('SpD', this),
    }
    this.contest = {
      cool: bytes[0x2c],
      beauty: bytes[0x2d],
      cute: bytes[0x2e],
      smart: bytes[0x2f],
      tough: bytes[0x30],
      sheen: bytes[0x31],
    }
    this.gameOfOrigin = bytesToUint16LittleEndian(bytes, 0xde)
    this.displayID =
      this.gameOfOrigin < GameOfOrigin.Sun
        ? this.trainerID
        : bytesToUint32LittleEndian(bytes, 0x0c) % 1000000
    let byteArray = new Uint16Array(12)
    for (let i = 0; i < 12; i += 1) {
      const byte = bytesToUint16LittleEndian(bytes, 0x58 + 2 * i)
      if (byte === 0) {
        break
      }
      byteArray[i] = byte
    }
    this.nickname = new TextDecoder('utf-16').decode(byteArray)
    byteArray = new Uint16Array(12)
    for (let i = 0; i < 12; i += 1) {
      const byte = bytesToUint16LittleEndian(bytes, 0xf8 + 2 * i)
      if (byte === 0) {
        break
      }
      byteArray[i] = byte
    }
    this.trainerName = new TextDecoder('utf-16').decode(byteArray)
    this.ribbons = []
    for (let byte = 0; byte < 8; byte++) {
      const ribbonsUint8 = bytes[0x34 + byte]
      for (let bit = 0; bit < 8; bit++) {
        if (ribbonsUint8 & (2 ** bit)) {
          this.ribbons.push(Gen9RibbonsPart1[8 * byte + bit])
        }
      }
    }
    for (let byte = 0; byte < 6; byte++) {
      const ribbonsUint8 = bytes[0x40 + byte]
      for (let bit = 0; bit < 8; bit++) {
        if (ribbonsUint8 & (2 ** bit)) {
          this.ribbons.push(Gen9RibbonsPart2[32 + 8 * byte + bit])
        }
      }
    }
    this.eggYear = bytes[0x119]
    this.eggMonth = bytes[0x11a]
    this.eggDay = bytes[0x11b]
    this.metYear = bytes[0x11c]
    this.metMonth = bytes[0x11d]
    this.metDay = bytes[0x11e]
    this.isShiny =
      (this.trainerID ^
        this.secretID ^
        bytesToUint16LittleEndian(bytes, 0x1c) ^
        bytesToUint16LittleEndian(bytes, 0x1e)) <
      16
    this.isSquareShiny =
      (this.isShiny && this.gameOfOrigin === GameOfOrigin.GO) ||
      (this.trainerID ^
        this.secretID ^
        bytesToUint16LittleEndian(bytes, 0x1c) ^
        bytesToUint16LittleEndian(bytes, 0x1e)) ===
        0
    // this.getMarking = (index: number) => {
    //   return (this.markings >> (2 * index)) & 3;
    // };
  }

  public get gender() {
    return (this.bytes[0x22] >> 2) & 0x3
  }

  public set gender(value: number) {
    this.bytes[0x22] = (this.bytes[0x22] & 0xf3) | (value << 2)
  }

  public get movePP() {
    return [
      this.bytes[0x7a],
      this.bytes[0x7b],
      this.bytes[0x7c],
      this.bytes[0x7d],
    ]
  }

  public set movePP(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes[0x7a + i] = value[i]
    }
  }

  public get movePPUps() {
    return [
      this.bytes[0x7e],
      this.bytes[0x7f],
      this.bytes[0x80],
      this.bytes[0x81],
    ]
  }

  public set movePPUps(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes[0x7e + i] = value[i]
    }
  }

  public get languageIndex() {
    return this.bytes[0xe2]
  }

  public get language() {
    return Languages[this.languageIndex]
  }

  public set language(value: string) {
    const index = Languages.indexOf(value)
    if (index > -1) {
      this.bytes[0xe2] = index
    }
  }

  public get formArgument() {
    return bytesToUint32LittleEndian(this.bytes, 0xe4)
  }

  public set formArgument(value: number) {
    this.bytes.set(uint32ToBytesLittleEndian(value), 0xe4)
  }
}
