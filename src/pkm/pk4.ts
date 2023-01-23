import { Abilities } from "../consts/Abilities";
import { Items } from "../consts/Items";
import { Languages } from "../consts/Languages";
import { Gen4RibbonsPart1, Gen4RibbonsPart2 } from "../consts/Ribbons";
import { getMetLocation } from "../MetLocation/MetLocation";
import { bytesToUint16LittleEndian, bytesToUint32LittleEndian } from "../util/utils";
import { pkm } from "./pkm";

export class pk4 extends pkm {
  constructor(bytes: Uint8Array) {
    super(bytes);
    this.format = "pk4";
    this.personalityValue = bytesToUint32LittleEndian(bytes, 0x00);
    this.dexNum = bytesToUint16LittleEndian(bytes, 0x08);
    this.markings = bytes[0x16];
    this.language = Languages[bytes[0x17]];
    this.formNum = bytes[0x40] >> 3;
    this.heldItem = Items[bytesToUint16LittleEndian(bytes, 0x0a)];
    this.ability = Abilities[bytesToUint16LittleEndian(bytes, 0x15)];
    this.abilityNum = bytes[0x42] & 1 ? 3 : (bytes[0x01] & 1) + 1;
    this.nature = this.personalityValue % 25;
    this.trainerID = bytesToUint16LittleEndian(bytes, 0x0c);
    this.secretID = bytesToUint16LittleEndian(bytes, 0x0e);
    this.displayID = this.trainerID;
    this.ball = Math.max(bytes[0x83], bytes[0x86]);
    this.metLevel = bytes[0x84] & ~0x80;
    this.trainerGender = bytes[0x84] >> 7;
    this.moves = [
      bytesToUint16LittleEndian(bytes, 0x28),
      bytesToUint16LittleEndian(bytes, 0x2a),
      bytesToUint16LittleEndian(bytes, 0x2c),
      bytesToUint16LittleEndian(bytes, 0x2e),
    ];
    let ivBytes = bytesToUint32LittleEndian(bytes, 0x38);
    this.ivs = {
      hp: ivBytes & 0x1f,
      atk: (ivBytes >> 5) & 0x1f,
      def: (ivBytes >> 10) & 0x1f,
      spa: (ivBytes >> 15) & 0x1f,
      spd: (ivBytes >> 20) & 0x1f,
      spe: (ivBytes >> 25) & 0x1f,
    };
    this.evs = {
      hp: bytes[0x18],
      atk: bytes[0x19],
      def: bytes[0x1a],
      spa: bytes[0x1b],
      spd: bytes[0x1c],
      spe: bytes[0x1d],
    };
    this.contest = {
      cool: bytes[0x1e],
      beauty: bytes[0x1f],
      cute: bytes[0x20],
      smart: bytes[0x21],
      tough: bytes[0x22],
      sheen: bytes[0x23],
    };
    this.gameOfOrigin = bytes[0x5f];
    let charArray = new Uint16Array(12);
    for (let i = 0; i < 11; i += 1) {
      let value = bytesToUint16LittleEndian(bytes, 0x48 + 2 * i);
      if (value === 0xffff) {
        break;
      }
      if (value <= 324 && value >= 299) {
        charArray[i] = value - 234;
      } else if (value <= 350 && value >= 325) {
        charArray[i] = value - 228;
      } else {
        charArray[i] = value;
      }
    }

    this.nickname = new TextDecoder("utf-16").decode(charArray);
    charArray = new Uint16Array(12);
    for (let i = 0; i < 12; i += 1) {
      let uint16 = bytesToUint16LittleEndian(bytes, 0x68 + 2 * i);
      if (uint16 === 0xffff) {
        break;
      }
      if (uint16 <= 324 && uint16 >= 299) {
        charArray[i] = uint16 - 234;
      } else if (uint16 <= 350 && uint16 >= 325) {
        charArray[i] = uint16 - 228;
      } else {
        charArray[i] = uint16;
      }
    }

    this.trainerName = new TextDecoder("utf-16").decode(charArray);
    this.ribbons = [];
    for (let byte = 0; byte < 4; byte++) {
      let ribbonsUint8 = bytes[0x24 + byte];
      for (let bit = 0; bit < 8; bit++) {
        if (ribbonsUint8 & Math.pow(2, bit)) {
          if (8 * byte + bit < Gen4RibbonsPart1.length) {
            this.ribbons.push(Gen4RibbonsPart1[8 * byte + bit]);
          } else {
            this.ribbons.push(`Invalid Ribbon 1-${8 * byte + bit}`);
          }
        }
      }
    }
    for (let byte = 0; byte < 4; byte++) {
      let ribbonsUint8 = bytes[0x3c + byte];
      for (let bit = 0; bit < 8; bit++) {
        if (ribbonsUint8 & Math.pow(2, bit)) {
          if (8 * byte + bit < Gen4RibbonsPart2.length) {
            this.ribbons.push(Gen4RibbonsPart2[8 * byte + bit]);
          } else {
            this.ribbons.push(`Invalid Ribbon 2-${8 * byte + bit}`);
          }
        }
      }
    }
    this.eggYear = bytes[0x79];
    this.eggMonth = bytes[0x7a];
    this.eggDay = bytes[0x7b];
    let eggLocationValue =
      bytesToUint16LittleEndian(bytes, 0x7e) === 3002
        ? bytesToUint16LittleEndian(bytes, 0x44)
        : bytesToUint16LittleEndian(bytes, 0x7e);
    this.eggLocation =
      getMetLocation(this.gameOfOrigin, eggLocationValue, true) ??
      bytesToUint16LittleEndian(bytes, 0x7e).toString();
    this.metYear = bytes[0x7b];
    this.metMonth = bytes[0x7c];
    this.metDay = bytes[0x7d];
    let metLocationValue =
      bytesToUint16LittleEndian(bytes, 0x80) === 3002
        ? bytesToUint16LittleEndian(bytes, 0x46)
        : bytesToUint16LittleEndian(bytes, 0x80);
    this.metLocation =
      getMetLocation(this.gameOfOrigin, metLocationValue) ??
      bytesToUint16LittleEndian(bytes, 0x80).toString();
    this.isShiny =
      (this.trainerID ^
        this.secretID ^
        bytesToUint16LittleEndian(bytes, 0x00) ^
        bytesToUint16LittleEndian(bytes, 0x02)) <
      8;
  }
}
