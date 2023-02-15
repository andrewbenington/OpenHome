import { Gen2Items } from '../consts/Items';
import { Languages } from '../consts/Languages';
import { MONS_LIST } from '../consts/Mons';
import { getMetLocation } from '../renderer/MetLocation/MetLocation';
import { getLevelGen12 } from '../util/StatCalc';
import { G1_TERMINATOR, GBStringDict } from '../util/Strings/StringConverter';
import {
  bytesToUint16BigEndian,
  bytesToUint24BigEndian,
} from '../util/ByteLogic';
import { pkm } from './pkm';

export class PK2 extends pkm {
  constructor(bytes: Uint8Array) {
    super(bytes);
    this.format = 'PK2';
    this.dexNum = bytes[0x00];
    this.exp = bytesToUint24BigEndian(bytes, 0x08);
    this.level = getLevelGen12(this.dexNum, this.exp);
    this.formNum = 0;
    this.heldItem = Gen2Items[bytes[0x01]];
    this.language = Languages[bytes[0x12]];
    this.trainerID = bytesToUint16BigEndian(bytes, 0x06);
    this.secretID = 0;
    this.displayID = this.trainerID;
    let metData = bytesToUint16BigEndian(bytes, 0x1d);
    this.metLevel = (metData >> 8) & 0x3f;
    this.trainerGender = (metData >> 7) & 1;
    this.metLocationIndex = metData & 0x7f;
    this.metLocation = getMetLocation(-1, this.metLocationIndex);
    this.moves = [bytes[2], bytes[3], bytes[4], bytes[5]];
    this.abilityNum = 0;
    this.ability = 'None';
    let dvBytes = bytesToUint16BigEndian(bytes, 0x15);
    this.dvs = {
      spc: dvBytes & 0x0f,
      spe: (dvBytes >> 4) & 0x0f,
      def: (dvBytes >> 8) & 0x0f,
      atk: (dvBytes >> 12) & 0x0f,
      hp:
        (((dvBytes >> 12) & 1) << 3) |
        (((dvBytes >> 8) & 1) << 2) |
        (((dvBytes >> 4) & 1) << 1) |
        (dvBytes & 1),
    };
    let maleRatio =
      MONS_LIST[this.dexNum].formes[0].genderRatio.M > 0 ||
      MONS_LIST[this.dexNum].formes[0].genderRatio.F > 0
        ? MONS_LIST[this.dexNum].formes[0].genderRatio.M
        : -1;
    this.gender = maleRatio === -1 ? 2 : this.dvs.atk < maleRatio * 15 ? 1 : 0;
    this.evsG12 = {
      hp: bytesToUint16BigEndian(bytes, 0x0b),
      atk: bytesToUint16BigEndian(bytes, 0x0d),
      def: bytesToUint16BigEndian(bytes, 0x0f),
      spe: bytesToUint16BigEndian(bytes, 0x11),
      spc: bytesToUint16BigEndian(bytes, 0x13),
    };
    this.trainerName = '';
    for (let i = 0; i < 10; i += 1) {
      if (bytes[0x30 + i] === G1_TERMINATOR) {
        break;
      }
      this.trainerName += GBStringDict[bytes[0x30 + i]] ?? '';
    }
    this.nickname = '';
    for (let i = 0; i < 10; i += 1) {
      if (bytes[0x3b + i] === G1_TERMINATOR) {
        break;
      }
      this.nickname += GBStringDict[bytes[0x3b + i]] ?? '';
    }
    this.contest = {
      cool: bytes[0x3e],
      beauty: bytes[0x3f],
      cute: bytes[0x40],
      smart: bytes[0x41],
      tough: bytes[0x42],
      sheen: bytes[0x43],
    };
    this.gameOfOrigin = metData === 0 ? -1 : 41;
    this.isShiny =
      this.dvs.spe === 10 &&
      this.dvs.def === 10 &&
      this.dvs.spc === 10 &&
      [2, 3, 6, 7, 10, 11, 14, 15].includes(this.dvs.atk);
    console.log('nature', this.nature);
  }
}
