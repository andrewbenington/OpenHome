import { getMetLocation } from "../MetLocation/MetLocation";
import { Gen9RibbonsPart1, Gen9RibbonsPart2 } from "../consts/Ribbons";
import { bytesToUint16LittleEndian, bytesToUint32LittleEndian } from "../util/utils";
import { pkm } from "./pkm";
import { Abilities } from "../consts/Abilities";
import { Items } from "../consts/Items";
import { Languages } from "../consts/Languages";

export class pk8 extends pkm {
  constructor(bytes: Uint8Array) {
    super(bytes);
    this.format = "pk8";
    this.bytes = bytes;
    this.personalityValue = bytesToUint32LittleEndian(bytes, 0x1c);
    this.dexNum = bytesToUint16LittleEndian(bytes, 0x08);
    this.formNum = bytesToUint16LittleEndian(bytes, 0x24);
    this.heldItem = Items[bytesToUint16LittleEndian(bytes, 0x0a)];
    this.ability = Abilities[bytesToUint16LittleEndian(bytes, 0x14)];
    this.abilityNum = bytes[0x16] & 7;
    this.markings = bytes[0x18];
    this.nature = bytes[0x20];
    this.statNature = bytes[0x21];
    this.isFatefulEncounter = !!(bytes[0x22] & 1)
    this.canGigantamax = !!(bytes[0x16] & 16);
    this.dynamaxLevel = bytes[0x90];
    this.isFatefulEncounter = !!(bytes[0x22] & 1)
    this.trainerID = bytesToUint16LittleEndian(bytes, 0x0c);
    this.secretID = bytesToUint16LittleEndian(bytes, 0x0e);
    this.ball = bytes[0x124];
    this.metLevel = bytes[0x125] & ~0x80;
    this.trainerGender = bytes[0x125] >> 7;
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
    this.level = bytes[0x168]
    this.stats = {
      hp: bytesToUint16LittleEndian(bytes, 0x14a),
      atk: bytesToUint16LittleEndian(bytes, 0x14c),
      def: bytesToUint16LittleEndian(bytes, 0x14e),
      spe: bytesToUint16LittleEndian(bytes, 0x150),
      spa: bytesToUint16LittleEndian(bytes, 0x152),
      spd: bytesToUint16LittleEndian(bytes, 0x154),
    };
    let ivBytes = bytesToUint32LittleEndian(bytes, 0x8c);
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
    this.gameOfOrigin = bytesToUint16LittleEndian(bytes, 0xde);
    this.language = Languages[bytes[0xe2]];
    this.displayID =
      this.gameOfOrigin < 31
        ? this.trainerID
        : bytesToUint32LittleEndian(bytes, 0x0c) % 1000000;
    let byteArray = new Uint16Array(12);
    for (let i = 0; i < 12; i += 1) {
      let byte = bytesToUint16LittleEndian(bytes, 0x58 + 2 * i);
      if (byte == 0) {
        break;
      }
      byteArray[i] = byte;
    }
    this.nickname = new TextDecoder("utf-16").decode(byteArray);
    byteArray = new Uint16Array(12);
    for (let i = 0; i < 12; i += 1) {
      let byte = bytesToUint16LittleEndian(bytes, 0xf8 + 2 * i);
      if (byte == 0) {
        break;
      }
      byteArray[i] = byte;
    }
    this.trainerName = new TextDecoder("utf-16").decode(byteArray);
    this.ribbons = [];
    for (let byte = 0; byte < 8; byte++) {
      let ribbonsUint8 = bytes[0x34 + byte];
      for (let bit = 0; bit < 8; bit++) {
        if (ribbonsUint8 & Math.pow(2, bit)) {
          this.ribbons.push(Gen9RibbonsPart1[8 * byte + bit]);
        } else {
        }
      }
    }
    for (let byte = 0; byte < 6; byte++) {
      let ribbonsUint8 = bytes[0x40 + byte];
      for (let bit = 0; bit < 8; bit++) {
        if (ribbonsUint8 & Math.pow(2, bit)) {
          this.ribbons.push(Gen9RibbonsPart2[32 + 8 * byte + bit]);
        } else {
        }
      }
    }
    this.eggYear = bytes[0x119];
    this.eggMonth = bytes[0x11a];
    this.eggDay = bytes[0x11b];
    this.eggLocation =
      getMetLocation(
        this.gameOfOrigin,
        bytesToUint16LittleEndian(bytes, 0x120),
        true
      ) ?? bytesToUint16LittleEndian(bytes, 0x120).toString();
    this.metYear = bytes[0x11c];
    this.metMonth = bytes[0x11d];
    this.metDay = bytes[0x11e];
    this.metLocation =
      getMetLocation(
        this.gameOfOrigin,
        bytesToUint16LittleEndian(bytes, 0x122)
      ) ?? bytesToUint16LittleEndian(bytes, 0x122).toString();
    this.isShiny =
      (this.trainerID ^
        this.secretID ^
        bytesToUint16LittleEndian(bytes, 0x1c) ^
        bytesToUint16LittleEndian(bytes, 0x1e)) <
      16;
    this.isSquareShiny =
      (this.isShiny && this.gameOfOrigin === 34) ||
      (this.trainerID ^
        this.secretID ^
        bytesToUint16LittleEndian(bytes, 0x1c) ^
        bytesToUint16LittleEndian(bytes, 0x1e)) ===
        0;
    this.getMarking = (index: number) => {
      return (this.markings >> (2 * index)) & 3;
    };
  }
}
