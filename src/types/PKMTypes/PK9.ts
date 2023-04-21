import { Abilities } from '../../consts/Abilities';
import { Items } from '../../consts/Items';
import { Languages } from '../../consts/Languages';
import { Gen9RibbonsPart1, Gen9RibbonsPart2 } from '../../consts/Ribbons';
import {
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
} from '../../util/ByteLogic';
import { svToNatDex } from '../../util/ConvertPokemonID';
import {
  getHPGen3Onward,
  getLevelGen3Onward,
  getStatGen3Onward,
} from '../../util/StatCalc';
import { PKM } from './PKM';

export class PK9 extends PKM {
  constructor(bytes: Uint8Array) {
    super(bytes);
    this.encryptionConstant = bytesToUint32LittleEndian(bytes, 0x00);
    this.format = 'PK9';
    this.personalityValue = bytesToUint32LittleEndian(bytes, 0x00);
    this.dexNum = svToNatDex(bytesToUint16LittleEndian(bytes, 0x08));
    this.exp = bytesToUint32LittleEndian(bytes, 0x10);
    this.formNum = bytes[0x24];
    this.heldItem = Items[bytesToUint16LittleEndian(bytes, 0x0a)];
    this.ability = Abilities[bytesToUint16LittleEndian(bytes, 0x14)];
    this.abilityNum = bytes[0x16] & 7;
    this.nature = bytes[0x20];
    // this.markings = bytes[0x18];
    this.statNature = bytes[0x21];
    this.isFatefulEncounter = !!(bytes[0x22] & 1);
    this.trainerID = bytesToUint16LittleEndian(bytes, 0x0c);
    this.secretID = bytesToUint16LittleEndian(bytes, 0x0e);
    this.displayID = bytesToUint32LittleEndian(bytes, 0x0c) % 1000000;
    this.ball = bytes[0x124];
    this.metLevel = bytes[0x125] & ~0x80;
    this.trainerGender = bytes[0x126] >> 7;
    this.moves = [
      bytesToUint16LittleEndian(bytes, 0x72),
      bytesToUint16LittleEndian(bytes, 0x74),
      bytesToUint16LittleEndian(bytes, 0x76),
      bytesToUint16LittleEndian(bytes, 0x78),
    ];
    this.relearnMoves = [
      bytesToUint16LittleEndian(bytes, 0x82),
      bytesToUint16LittleEndian(bytes, 0x84),
      bytesToUint16LittleEndian(bytes, 0x86),
      bytesToUint16LittleEndian(bytes, 0x88),
    ];
    this.teraTypeOriginal = bytes[0x94];
    this.teraTypeOverride = bytes[0x95];
    this.level = getLevelGen3Onward(this.dexNum, this.exp);
    this.stats = {
      hp: bytesToUint16LittleEndian(bytes, 0x14a),
      atk: bytesToUint16LittleEndian(bytes, 0x14c),
      def: bytesToUint16LittleEndian(bytes, 0x14e),
      spe: bytesToUint16LittleEndian(bytes, 0x150),
      spa: bytesToUint16LittleEndian(bytes, 0x152),
      spd: bytesToUint16LittleEndian(bytes, 0x154),
    };
    const ivBytes = bytesToUint32LittleEndian(bytes, 0x8c);
    this.ivs = {
      hp: ivBytes & 0x1f,
      atk: (ivBytes >> 5) & 0x1f,
      def: (ivBytes >> 10) & 0x1f,
      spe: (ivBytes >> 15) & 0x1f,
      spa: (ivBytes >> 20) & 0x1f,
      spd: (ivBytes >> 25) & 0x1f,
    };
    this.evs = {
      hp: bytes[0x26],
      atk: bytes[0x27],
      def: bytes[0x28],
      spa: bytes[0x29],
      spd: bytes[0x2a],
      spe: bytes[0x2b],
    };
    this.stats = {
      hp: getHPGen3Onward(this),
      atk: getStatGen3Onward('Atk', this),
      def: getStatGen3Onward('Def', this),
      spe: getStatGen3Onward('Spe', this),
      spa: getStatGen3Onward('SpA', this),
      spd: getStatGen3Onward('SpD', this),
    };
    this.gameOfOrigin = bytesToUint16LittleEndian(bytes, 0xce);
    let byteArray = new Uint16Array(12);
    for (let i = 0; i < 12; i += 1) {
      const byte = bytesToUint16LittleEndian(bytes, 0x58 + 2 * i);
      if (byte === 0) {
        break;
      }
      byteArray[i] = byte;
    }
    this.nickname = new TextDecoder('utf-16').decode(byteArray);
    byteArray = new Uint16Array(12);
    for (let i = 0; i < 12; i += 1) {
      const byte = bytesToUint16LittleEndian(bytes, 0xf8 + 2 * i);
      if (byte === 0) {
        break;
      }
      byteArray[i] = byte;
    }
    this.trainerName = new TextDecoder('utf-16').decode(byteArray);
    this.ribbons = [];
    for (let byte = 0; byte < 4; byte++) {
      const ribbonsUint8 = bytes[0x34 + byte];
      for (let bit = 0; bit < 8; bit++) {
        if (ribbonsUint8 & (2 ** bit)) {
          this.ribbons.push(Gen9RibbonsPart1[8 * byte + bit]);
        }
      }
    }
    for (let byte = 0; byte < 2; byte++) {
      const ribbonsUint8 = bytes[0x44 + byte];
      for (let bit = 0; bit < 8; bit++) {
        if (ribbonsUint8 & (2 ** bit)) {
          this.ribbons.push(Gen9RibbonsPart2[32 + 8 * byte + bit]);
        }
      }
    }
    this.metYear = bytes[0x11c];
    this.metMonth = bytes[0x11d];
    this.metDay = bytes[0x11e];
    this.metLocationIndex = bytesToUint16LittleEndian(bytes, 0x122);
    this.isShiny =
      (this.trainerID ^
        this.secretID ^
        bytesToUint16LittleEndian(bytes, 0x00) ^
        bytesToUint16LittleEndian(bytes, 0x04)) <
      16;

    this.isSquareShiny =
      (this.isShiny && this.gameOfOrigin === 34) ||
      (this.trainerID ^
        this.secretID ^
        bytesToUint16LittleEndian(bytes, 0x00) ^
        bytesToUint16LittleEndian(bytes, 0x04)) ===
        0;

    // this.getMarking = (index: number) => {
    //   return (this.markings >> (2 * index)) & 3;
    // };
  }

  public get gender() {
    return (this.bytes[0x22] >> 1) & 0x3;
  }

  public set gender(value: number) {
    this.bytes[0x22] = (this.bytes[0x22] & 0xf9) | (value << 1);
  }

  public get movePP() {
    return [
      this.bytes[0x7a],
      this.bytes[0x7b],
      this.bytes[0x7c],
      this.bytes[0x7d],
    ];
  }

  public set movePP(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes[0x7a + i] = value[i];
    }
  }

  public get movePPUps() {
    return [
      this.bytes[0x7e],
      this.bytes[0x7f],
      this.bytes[0x80],
      this.bytes[0x81],
    ];
  }

  public set movePPUps(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes[0x7e + i] = value[i];
    }
  }

  public get affixedRibbon() {
    return this.bytes[0xd4] !== 0xff ? this.bytes[0xd4] : undefined;
  }

  public set affixedRibbon(value: number | undefined) {
    this.bytes[0xd4] = value ?? 0xff;
  }

  public get languageIndex() {
    return this.bytes[0xd5];
  }

  public get language() {
    return Languages[this.languageIndex];
  }

  public set language(value: string) {
    const index = Languages.indexOf(value);
    if (index > -1) {
      this.bytes[0xd5] = index;
    }
  }
}
