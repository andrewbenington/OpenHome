import { Items } from "../consts/Items";
import { Languages } from "../consts/Languages";
import { Gen9RibbonsPart1 } from "../consts/Ribbons";
import { getMetLocation } from "../renderer/MetLocation/MetLocation";
import {
  getHPGen3Onward,
  getLevelGen3Onward,
  getStatGen3Onward,
} from "../renderer/util/StatCalc";
import {
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
} from "../renderer/util/ByteLogic";
import { pkm } from "./pkm";

export class pb7 extends pkm {
  constructor(bytes: Uint8Array) {
    super(bytes);
    this.format = "pb7";
    this.encryptionConstant = bytesToUint32LittleEndian(bytes, 0x00);
    this.personalityValue = bytesToUint32LittleEndian(bytes, 0x18);
    this.dexNum = bytesToUint16LittleEndian(bytes, 0x08);
    this.exp = bytesToUint32LittleEndian(bytes, 0x10);
    this.level = getLevelGen3Onward(this.dexNum, this.exp);
    this.formNum = bytes[0x1d] >> 3;
    this.heldItem = Items[bytesToUint16LittleEndian(bytes, 0x0a)];
    this.nature = bytes[0x1c];
    this.gender = (bytes[0x1d] >> 1) & 0x3;
    this.trainerID = bytesToUint16LittleEndian(bytes, 0x0c);
    this.secretID = bytesToUint16LittleEndian(bytes, 0x0e);
    this.displayID = this.trainerID;
    this.ball = bytes[0xdc];
    this.metLevel = bytes[0xdd] & ~0x80;
    this.trainerGender = bytes[0xdd] >> 7;
    this.language = Languages[bytes[0xe3]];
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
      spa: (ivBytes >> 15) & 0x1f,
      spd: (ivBytes >> 20) & 0x1f,
      spe: (ivBytes >> 25) & 0x1f,
    };
    this.evs = {
      hp: bytes[0x1e],
      atk: bytes[0x1f],
      def: bytes[0x20],
      spa: bytes[0x21],
      spd: bytes[0x22],
      spe: bytes[0x23],
    };
    this.avs = {
      hp: bytes[0x24],
      atk: bytes[0x25],
      def: bytes[0x26],
      spa: bytes[0x27],
      spd: bytes[0x28],
      spe: bytes[0x29],
    };
    this.stats = {
      hp: getHPGen3Onward(this),
      atk: getStatGen3Onward("Atk", this),
      def: getStatGen3Onward("Def", this),
      spe: getStatGen3Onward("Spe", this),
      spa: getStatGen3Onward("SpA", this),
      spd: getStatGen3Onward("SpD", this),
    };
    this.gameOfOrigin = bytes[0xdf];
    let byteArray = new Uint16Array(12);
    for (let i = 0; i < 12; i += 1) {
      let byte = bytesToUint16LittleEndian(bytes, 0x40 + 2 * i);
      if (byte === 0) {
        break;
      }
      byteArray[i] = byte;
    }
    this.nickname = new TextDecoder("utf-16").decode(byteArray);
    byteArray = new Uint16Array(12);
    for (let i = 0; i < 12; i += 1) {
      let byte = bytesToUint16LittleEndian(bytes, 0xb0 + 2 * i);
      if (byte === 0) {
        break;
      }
      byteArray[i] = byte;
    }
    this.trainerName = new TextDecoder("utf-16").decode(byteArray);
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
    this.metYear = bytes[0xd4];
    this.metMonth = bytes[0xd5];
    this.metDay = bytes[0xd6];
    this.metLocation =
      getMetLocation(
        this.gameOfOrigin,
        bytesToUint16LittleEndian(bytes, 0xda)
      ) ?? bytesToUint16LittleEndian(bytes, 0xda).toString();

    this.isShiny =
      (this.trainerID ^
        this.secretID ^
        bytesToUint16LittleEndian(bytes, 0x18) ^
        bytesToUint16LittleEndian(bytes, 0x1a)) <
      16;
    this.isSquareShiny =
      (this.isShiny && this.gameOfOrigin === 34) ||
      (this.trainerID ^
        this.secretID ^
        bytesToUint16LittleEndian(bytes, 0x18) ^
        bytesToUint16LittleEndian(bytes, 0x1a)) ===
        0;
  }
}
