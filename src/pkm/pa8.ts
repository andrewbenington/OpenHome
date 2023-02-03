import { getMetLocation } from "../MetLocation/MetLocation";
import { Gen9RibbonsPart1, Gen9RibbonsPart2 } from "../consts/Ribbons";
import { bytesToUint16LittleEndian, bytesToUint32LittleEndian } from "../util/utils";
import { pkm } from "./pkm";
import { Abilities } from "../consts/Abilities";
import { Items } from "../consts/Items";
import { getLevelGen3Onward } from "../util/StatCalc";
import { Languages } from "../consts/Languages";

export class pa8 extends pkm {
  constructor(bytes: Uint8Array) {
    super(bytes);
    this.format = "pa8";
    this.encryptionConstant = bytesToUint32LittleEndian(bytes, 0x00);
    this.personalityValue = bytesToUint32LittleEndian(bytes, 0x1c);
    this.dexNum = bytesToUint16LittleEndian(bytes, 0x08);
    this.exp = bytesToUint32LittleEndian(bytes, 0x10);
    this.formNum = bytesToUint16LittleEndian(bytes, 0x24);
    this.heldItem = Items[bytesToUint16LittleEndian(bytes, 0x0a)];
    this.ability = Abilities[bytesToUint16LittleEndian(bytes, 0x14)];
    this.abilityNum = bytes[0x16] & 7;
    this.nature = bytes[0x20];
    this.statNature = bytes[0x21];
    this.canGigantamax = !!(bytes[0x16] & 16);
    this.isAlpha = !!(bytes[0x16] & 32);
    this.isNoble = !!(bytes[0x16] & 64);
    this.isFatefulEncounter = !!(bytes[0x22] & 1);
    this.trainerID = bytesToUint16LittleEndian(bytes, 0x0c);
    this.secretID = bytesToUint16LittleEndian(bytes, 0x0e);
    this.displayID = bytesToUint32LittleEndian(bytes, 0x0c) % 1000000;
    this.ball = bytes[0x137];
    this.metLevel = bytes[0x13d] & ~0x80;
    this.trainerGender = bytes[0x13d] >> 7;
    this.moves = [
      bytesToUint16LittleEndian(bytes, 0x54),
      bytesToUint16LittleEndian(bytes, 0x56),
      bytesToUint16LittleEndian(bytes, 0x58),
      bytesToUint16LittleEndian(bytes, 0x5a),
    ];
    this.relearnMoves = [
      bytesToUint16LittleEndian(bytes, 0x8a),
      bytesToUint16LittleEndian(bytes, 0x8c),
      bytesToUint16LittleEndian(bytes, 0x8e),
      bytesToUint16LittleEndian(bytes, 0x90),
    ];
    this.level = getLevelGen3Onward(this.dexNum, this.exp)
    this.stats = {
      hp: bytesToUint16LittleEndian(bytes, 0x16a),
      atk: bytesToUint16LittleEndian(bytes, 0x16c),
      def: bytesToUint16LittleEndian(bytes, 0x16e),
      spe: bytesToUint16LittleEndian(bytes, 0x170),
      spa: bytesToUint16LittleEndian(bytes, 0x172),
      spd: bytesToUint16LittleEndian(bytes, 0x174),
    };
    let ivBytes = bytesToUint32LittleEndian(bytes, 0x94);
    this.ivs = {
      hp: ivBytes & 0x1f,
      atk: (ivBytes >> 5) & 0x1f,
      def: (ivBytes >> 10) & 0x1f,
      spa: (ivBytes >> 15) & 0x1f,
      spd: (ivBytes >> 20) & 0x1f,
      spe: (ivBytes >> 25) & 0x1f,
    };
    this.evs = {
      hp: bytes[0x26],
      atk: bytes[0x27],
      def: bytes[0x28],
      spa: bytes[0x29],
      spd: bytes[0x2a],
      spe: bytes[0x2b],
    };
    this.contest = {
      cool: bytes[0x2c],
      beauty: bytes[0x2d],
      cute: bytes[0x2e],
      smart: bytes[0x2f],
      tough: bytes[0x30],
      sheen: bytes[0x31],
    };
    this.language = Languages[bytes[0xf2]]
    this.gameOfOrigin = bytesToUint16LittleEndian(bytes, 0xee);
    let byteArray = new Uint16Array(12);
    for (let i = 0; i < 12; i += 1) {
      let byte = bytesToUint16LittleEndian(bytes, 0x60 + 2 * i);
      if (byte === 0) {
        break;
      }
      byteArray[i] = byte;
    }
    this.nickname = new TextDecoder("utf-16").decode(byteArray);
    byteArray = new Uint16Array(12);
    for (let i = 0; i < 12; i += 1) {
      let byte = bytesToUint16LittleEndian(bytes, 0x110 + 2 * i);
      if (byte === 0) {
        break;
      }
      byteArray[i] = byte;
    }
    this.trainerName = new TextDecoder("utf-16").decode(byteArray);
    this.ribbons = [];
    for (let byte = 0; byte < 4; byte++) {
      let ribbonsUint8 = bytes[0x34 + byte];
      for (let bit = 0; bit < 8; bit++) {
        if (ribbonsUint8 & Math.pow(2, bit)) {
          this.ribbons.push(Gen9RibbonsPart1[8 * byte + bit]);
        } else {
        }
      }
    }
    for (let byte = 0; byte < 2; byte++) {
      let ribbonsUint8 = bytes[0x44 + byte];
      for (let bit = 0; bit < 8; bit++) {
        if (ribbonsUint8 & Math.pow(2, bit)) {
          this.ribbons.push(Gen9RibbonsPart2[32 + 8 * byte + bit]);
        } else {
        }
      }
    }
    this.metYear = bytes[0x134];
    this.metMonth = bytes[0x135];
    this.metDay = bytes[0x136];
    this.metLocation =
      getMetLocation(
        this.gameOfOrigin,
        bytesToUint16LittleEndian(bytes, 0x13a)
      ) ?? bytesToUint16LittleEndian(bytes, 0x13a).toString();
    this.isShiny =
      (this.trainerID ^
        this.secretID ^
        bytesToUint16LittleEndian(bytes, 0x1c) ^
        bytesToUint16LittleEndian(bytes, 0x1e)) <
      16;
    this.isSquareShiny =
      this.gameOfOrigin === 34 ||
      (this.trainerID ^
        this.secretID ^
        bytesToUint16LittleEndian(bytes, 0x00) ^
        bytesToUint16LittleEndian(bytes, 0x04)) ===
        0;
  }
}
