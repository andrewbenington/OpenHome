import { utf16BytesToString } from '../../util/Strings/StringConverter';
import { Abilities } from '../../consts/Abilities';
import { Items } from '../../consts/Items';
import { Languages } from '../../consts/Languages';
import { Gen9RibbonsPart1 } from '../../consts/Ribbons';
import {
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
} from '../../util/ByteLogic';
import {
  getHPGen3Onward,
  getLevelGen3Onward,
  getStatGen3Onward,
} from '../../util/StatCalc';
import { PKM } from './PKM';

export class PK7 extends PKM {
  constructor(bytes: Uint8Array) {
    super(bytes);
    this.format = 'PK7';
    this.encryptionConstant = bytesToUint32LittleEndian(bytes, 0x00);
    this.personalityValue = bytesToUint32LittleEndian(bytes, 0x18);
    this.dexNum = bytesToUint16LittleEndian(bytes, 0x08);
    this.exp = bytesToUint32LittleEndian(bytes, 0x10);
    this.level = getLevelGen3Onward(this.dexNum, this.exp);
    this.formNum = bytes[0x1d] >> 3;
    this.heldItem = Items[bytesToUint16LittleEndian(bytes, 0x0a)];
    this.ability = Abilities[bytes[0x14]];
    this.abilityNum = bytes[0x15];
    this.nature = bytes[0x1c];
    this.isFatefulEncounter = !!(bytes[0x1d] & 1);
    this.trainerID = bytesToUint16LittleEndian(bytes, 0x0c);
    this.secretID = bytesToUint16LittleEndian(bytes, 0x0e);
    this.displayID = bytesToUint32LittleEndian(bytes, 0x0c) % 1000000;
    this.ball = bytes[0xdc];
    this.metLevel = bytes[0xdd] & ~0x80;
    this.trainerGender = bytes[0xdd] >> 7;
    this.moves = [
      bytesToUint16LittleEndian(bytes, 0x5a),
      bytesToUint16LittleEndian(bytes, 0x5c),
      bytesToUint16LittleEndian(bytes, 0x5e),
      bytesToUint16LittleEndian(bytes, 0x60),
    ];
    this.relearnMoves = [
      bytesToUint16LittleEndian(bytes, 0x6a),
      bytesToUint16LittleEndian(bytes, 0x6c),
      bytesToUint16LittleEndian(bytes, 0x6e),
      bytesToUint16LittleEndian(bytes, 0x70),
    ];
    let ivBytes = bytesToUint32LittleEndian(bytes, 0x74);
    this.ivs = {
      hp: ivBytes & 0x1f,
      atk: (ivBytes >> 5) & 0x1f,
      def: (ivBytes >> 10) & 0x1f,
      spe: (ivBytes >> 15) & 0x1f,
      spa: (ivBytes >> 20) & 0x1f,
      spd: (ivBytes >> 25) & 0x1f,
    };
    this.evs = {
      hp: bytes[0x1e],
      atk: bytes[0x1f],
      def: bytes[0x20],
      spa: bytes[0x21],
      spd: bytes[0x22],
      spe: bytes[0x23],
    };
    this.contest = {
      cool: bytes[0x24],
      beauty: bytes[0x25],
      cute: bytes[0x26],
      smart: bytes[0x27],
      tough: bytes[0x28],
      sheen: bytes[0x29],
    };
    this.stats = {
      hp: getHPGen3Onward(this),
      atk: getStatGen3Onward('Atk', this),
      def: getStatGen3Onward('Def', this),
      spe: getStatGen3Onward('Spe', this),
      spa: getStatGen3Onward('SpA', this),
      spd: getStatGen3Onward('SpD', this),
    };
    this.gameOfOrigin = bytes[0xdf];
    this.nickname = utf16BytesToString(bytes, 0x40, 12);
    this.trainerName = utf16BytesToString(bytes, 0xb0, 12);
    this.ribbons = [];
    for (let byte = 0; byte < 4; byte++) {
      let ribbonsUint8 = bytes[0x30 + byte];
      for (let bit = 0; bit < 8; bit++) {
        if (ribbonsUint8 & Math.pow(2, bit)) {
          this.ribbons.push(Gen9RibbonsPart1[8 * byte + bit]);
        } else {
        }
      }
    }
    this.eggDate = bytes[0xd2]
      ? {
          day: bytes[0xd3],
          month: bytes[0xd2],
          year: bytes[0xd1],
        }
      : undefined;
    this.eggLocationIndex = bytesToUint16LittleEndian(bytes, 0xd8);
    this.metDate = {
      day: bytes[0xd6],
      month: bytes[0xd5],
      year: bytes[0xd4],
    };
    this.metLocationIndex = bytesToUint16LittleEndian(bytes, 0xda);
    this.language = Languages[bytes[0xe3]];
    this.isShiny =
      (this.trainerID ^
        this.secretID ^
        bytesToUint16LittleEndian(bytes, 0x18) ^
        bytesToUint16LittleEndian(bytes, 0x1a)) <
      16;
    this.isSquareShiny =
      this.gameOfOrigin === 34 ||
      (this.trainerID ^
        this.secretID ^
        bytesToUint16LittleEndian(bytes, 0x18) ^
        bytesToUint16LittleEndian(bytes, 0x1a)) ===
        0;
    // this.getMarking = (index: number) => {
    //   return (this.markings >> (2 * index)) & 3;
    // };
  }

  public get gender() {
    return (this.bytes[0x1d] >> 1) & 0x3;
  }

  public set gender(value: number) {
    this.bytes[0x01d] = (this.bytes[0x01d] & 0b11110001) | ((value & 0x3) << 1);
  }

  public get movePP() {
    return [
      this.bytes[0x62],
      this.bytes[0x63],
      this.bytes[0x64],
      this.bytes[0x65],
    ];
  }

  public set movePP(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes[0x62 + i] = value[i];
    }
  }

  public get movePPUps() {
    return [
      this.bytes[0x66],
      this.bytes[0x67],
      this.bytes[0x68],
      this.bytes[0x69],
    ];
  }

  public set movePPUps(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes[0x66 + i] = value[i];
    }
  }

}
