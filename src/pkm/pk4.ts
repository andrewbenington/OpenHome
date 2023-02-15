import { Abilities } from '../consts/Abilities';
import { Items } from '../consts/Items';
import { Languages } from '../consts/Languages';
import { Gen4RibbonsPart1, Gen4RibbonsPart2 } from '../consts/Ribbons';
import { getMetLocation } from '../renderer/MetLocation/MetLocation';
import {
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
  uint16ToBytesLittleEndian,
} from '../util/ByteLogic';
import {
  decryptByteArrayGen45,
  unshuffleBlocksGen45,
} from '../util/Encryption';
import { getGen3To5Gender } from '../util/GenderCalc';
import {
  getHPGen3Onward,
  getLevelGen3Onward,
  getStatGen3Onward,
} from '../util/StatCalc';
import { gen4StringToUTF } from '../util/Strings/StringConverter';
import { pkm } from './pkm';

export class pk4 extends pkm {
  public get metLocationIndex() {
    return bytesToUint16LittleEndian(this.bytes, 0x80);
  }

  public set metLocationIndex(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x80);
  }

  public get metLocation() {
    return (
      getMetLocation(this.gameOfOrigin, this.metLocationIndex) ??
      this.metLocationIndex.toString()
    );
  }
  constructor(bytes: Uint8Array, encrypted: boolean = false) {
    if (encrypted) {
      let unencryptedBytes = decryptByteArrayGen45(bytes);
      let unshuffledBytes = unshuffleBlocksGen45(unencryptedBytes);
      super(unshuffledBytes);
    } else {
      super(bytes);
    }
    this.format = 'pk4';
    this.personalityValue = bytesToUint32LittleEndian(bytes, 0x00);
    this.dexNum = bytesToUint16LittleEndian(bytes, 0x08);
    this.gender = getGen3To5Gender(this.personalityValue, this.dexNum);
    this.exp = bytesToUint32LittleEndian(bytes, 0x10);
    this.level = getLevelGen3Onward(this.dexNum, this.exp);
    this.language = Languages[bytes[0x17]];
    this.isFatefulEncounter = !!(bytes[0x40] & 1);
    this.gender = (bytes[0x40] >> 1) & 3;
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
      spe: (ivBytes >> 15) & 0x1f,
      spa: (ivBytes >> 20) & 0x1f,
      spd: (ivBytes >> 25) & 0x1f,
    };
    this.evs = {
      hp: bytes[0x18],
      atk: bytes[0x19],
      def: bytes[0x1a],
      spe: bytes[0x1b],
      spa: bytes[0x1c],
      spd: bytes[0x1d],
    };
    this.contest = {
      cool: bytes[0x1e],
      beauty: bytes[0x1f],
      cute: bytes[0x20],
      smart: bytes[0x21],
      tough: bytes[0x22],
      sheen: bytes[0x23],
    };
    this.stats = {
      hp: getHPGen3Onward(this),
      atk: getStatGen3Onward('Atk', this),
      def: getStatGen3Onward('Def', this),
      spe: getStatGen3Onward('Spe', this),
      spa: getStatGen3Onward('SpA', this),
      spd: getStatGen3Onward('SpD', this),
    };
    this.gameOfOrigin = bytes[0x5f];
    this.nickname = gen4StringToUTF(bytes, 0x48, 11);
    this.trainerName = gen4StringToUTF(bytes, 0x68, 12);
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
      getMetLocation(
        this.gameOfOrigin,
        eggLocationValue,
        this.gameOfOrigin < 16 && ![10, 11, 12].includes(this.gameOfOrigin),
        true
      ) ?? bytesToUint16LittleEndian(bytes, 0x7e).toString();
    this.metYear = bytes[0x7b];
    this.metMonth = bytes[0x7c];
    this.metDay = bytes[0x7d];
    this.isShiny =
      (this.trainerID ^
        this.secretID ^
        bytesToUint16LittleEndian(bytes, 0x00) ^
        bytesToUint16LittleEndian(bytes, 0x02)) <
      8;
  }
}
