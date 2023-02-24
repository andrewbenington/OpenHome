import { Abilities } from '../../consts/Abilities';
import { Items } from '../../consts/Items';
import { Languages } from '../../consts/Languages';
import { Gen9RibbonsPart1 } from '../../consts/Ribbons';
import {
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
  uint16ToBytesLittleEndian,
} from '../../util/ByteLogic';
import {
  decryptByteArrayGen45,
  unshuffleBlocksGen45,
} from '../../util/Encryption';
import {
  getHPGen3Onward,
  getLevelGen3Onward,
  getStatGen3Onward,
} from '../../util/StatCalc';
import { PKM } from './PKM';

export class PK5 extends PKM {
  static fileSize = 136;

  public get metLocationIndex() {
    return bytesToUint16LittleEndian(this.bytes, 0x80);
  }

  public set metLocationIndex(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x80);
  }

  constructor(bytes: Uint8Array, encrypted: boolean = false) {
    if (encrypted) {
      let unencryptedBytes = decryptByteArrayGen45(bytes);
      let unshuffledBytes = unshuffleBlocksGen45(unencryptedBytes);
      super(unshuffledBytes);
    } else {
      super(bytes);
    }
    this.format = 'PK5';
    this.personalityValue = bytesToUint32LittleEndian(bytes, 0x00);
    this.dexNum = bytesToUint16LittleEndian(bytes, 0x08);
    this.exp = bytesToUint32LittleEndian(bytes, 0x10);
    this.heldItemIndex = bytesToUint16LittleEndian(bytes, 0x0a);
    this.heldItem = Items[this.heldItemIndex];
    this.trainerID = bytesToUint16LittleEndian(bytes, 0x0c);
    this.secretID = bytesToUint16LittleEndian(bytes, 0x0e);
    this.abilityIndex = bytesToUint16LittleEndian(bytes, 0x15);
    this.ability = Abilities[this.abilityIndex];
    this.abilityNum = bytes[0x42] & 1 ? 3 : (bytes[0x01] & 1) + 1;
    this.language = Languages[bytes[0x17]];
    this.formNum = bytes[0x40] >> 3;
    this.nature = bytes[0x41];
    this.displayID = this.trainerID;
    this.ball = bytes[0x83];
    this.metLevel = bytes[0x84] & ~0x80;
    this.trainerGender = bytes[0x84] >> 7;
    this.moves = [
      bytesToUint16LittleEndian(bytes, 0x28),
      bytesToUint16LittleEndian(bytes, 0x2a),
      bytesToUint16LittleEndian(bytes, 0x2c),
      bytesToUint16LittleEndian(bytes, 0x2e),
    ];
    this.level = getLevelGen3Onward(this.dexNum, this.exp);
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

    this.stats = {
      hp: getHPGen3Onward(this),
      atk: getStatGen3Onward('Atk', this),
      def: getStatGen3Onward('Def', this),
      spe: getStatGen3Onward('Spe', this),
      spa: getStatGen3Onward('SpA', this),
      spd: getStatGen3Onward('SpD', this),
    };
    this.isFatefulEncounter = !!(bytes[0x40] & 1);
    this.gender = (bytes[0x40] >> 1) & 0x3;
    this.gameOfOrigin = bytesToUint16LittleEndian(bytes, 0x5f);
    let charArray = new Uint16Array(12);
    for (let i = 0; i < 11; i += 1) {
      let value = bytesToUint16LittleEndian(bytes, 0x48 + 2 * i);
      if (value === 0xffff) {
        break;
      }
      charArray[i] = value;
    }
    this.nickname = new TextDecoder('utf-16').decode(charArray);
    charArray = new Uint16Array(12);
    for (let i = 0; i < 12; i += 1) {
      let uint16 = bytesToUint16LittleEndian(bytes, 0x68 + 2 * i);
      if (uint16 === 0xffff) {
        break;
      }
      charArray[i] = uint16;
    }
    this.trainerName = new TextDecoder('utf-16').decode(charArray);
    this.ribbons = [];
    for (let byte = 0; byte < 4; byte++) {
      let ribbonsUint8 = bytes[0x24 + byte];
      for (let bit = 0; bit < 8; bit++) {
        if (ribbonsUint8 & Math.pow(2, bit)) {
          this.ribbons.push(Gen9RibbonsPart1[8 * byte + bit]);
        } else {
        }
      }
    }
    this.metDate = {
      day: bytes[0x7d],
      month: bytes[0x7c],
      year: bytes[0x7b],
    };
    this.isShiny =
      (this.trainerID ^
        this.secretID ^
        bytesToUint16LittleEndian(bytes, 0x00) ^
        bytesToUint16LittleEndian(bytes, 0x02)) <
      8;
  }
}
