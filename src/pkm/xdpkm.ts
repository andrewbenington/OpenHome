import { GameOfOriginData } from '../consts/GameOfOrigin';
import { Gen3Items } from '../consts/Items';
import { GCLanguages } from '../consts/Languages';
import { MONS_LIST } from '../consts/Mons';
import { Gen3StandardRibbons } from '../consts/Ribbons';
import { getMetLocation } from '../renderer/MetLocation/MetLocation';
import { gen3ToNational } from '../util/ConvertPokemonID';
import {
  getHPGen3Onward,
  getLevelGen3Onward,
  getStatGen3Onward,
} from '../util/StatCalc';
import {
  bytesToUint16BigEndian,
  bytesToUint32BigEndian,
} from '../util/ByteLogic';
import { pkm } from './pkm';

export class xdpkm extends pkm {
  constructor(bytes: Uint8Array) {
    console.log('making xd pkm');
    super(bytes);
    this.format = 'xdpkm';
    this.personalityValue = bytesToUint32BigEndian(bytes, 0x28);
    this.dexNum = gen3ToNational(bytesToUint16BigEndian(bytes, 0x00));
    this.exp = bytesToUint32BigEndian(bytes, 0x20);
    this.level = getLevelGen3Onward(this.dexNum, this.exp);
    this.formNum = 0;
    this.heldItem = Gen3Items[bytesToUint16BigEndian(bytes, 0x02)];
    this.nature = this.personalityValue % 25;
    this.trainerID = bytesToUint16BigEndian(bytes, 0x26);
    this.secretID = bytesToUint16BigEndian(bytes, 0x24);
    this.displayID = this.trainerID;
    this.language = GCLanguages[bytes[0x37]];
    this.ball = bytes[0x0f];
    this.metLevel = bytes[0x0e];
    this.trainerGender = bytes[0x10];
    this.moves = [
      bytesToUint16BigEndian(bytes, 0x80),
      bytesToUint16BigEndian(bytes, 0x84),
      bytesToUint16BigEndian(bytes, 0x88),
      bytesToUint16BigEndian(bytes, 0x8c),
    ];
    this.abilityNum = ((bytes[0x1d] >> 6) & 1) + 1;
    this.ability =
      this.abilityNum === 1
        ? MONS_LIST[this.dexNum]?.formes[0].ability1
        : MONS_LIST[this.dexNum]?.formes[0].ability2 ?? 'None';
    this.ivs = {
      hp: bytes[0xa8],
      atk: bytes[0xa9],
      def: bytes[0xaa],
      spa: bytes[0xab],
      spd: bytes[0xac],
      spe: bytes[0xad],
    };
    this.evs = {
      hp: bytesToUint16BigEndian(bytes, 0x9c),
      atk: bytesToUint16BigEndian(bytes, 0x9e),
      def: bytesToUint16BigEndian(bytes, 0xa0),
      spa: bytesToUint16BigEndian(bytes, 0xa2),
      spd: bytesToUint16BigEndian(bytes, 0xa4),
      spe: bytesToUint16BigEndian(bytes, 0xa6),
    };
    this.contest = {
      cool: bytes[0xae],
      beauty: bytes[0xaf],
      cute: bytes[0xb0],
      smart: bytes[0xb1],
      tough: bytes[0xb2],
      sheen: bytes[0x12],
    };
    this.stats = {
      hp: getHPGen3Onward(this),
      atk: getStatGen3Onward('Atk', this),
      def: getStatGen3Onward('Def', this),
      spe: getStatGen3Onward('Spe', this),
      spa: getStatGen3Onward('SpA', this),
      spd: getStatGen3Onward('SpD', this),
    };
    let origin = GameOfOriginData.find((game) => game?.gc === bytes[0x34]) ?? null;
    this.gameOfOrigin = GameOfOriginData.indexOf(origin);
    let byteArray = new Uint16Array(12);
    for (let i = 0; i < 12; i += 1) {
      let byte = bytesToUint16BigEndian(bytes, 0x4e + 2 * i);
      if (byte === 0) {
        break;
      }
      byteArray[i] = byte;
    }
    this.nickname = new TextDecoder('utf-16').decode(byteArray);
    byteArray = new Uint16Array(12);
    for (let i = 0; i < 12; i += 1) {
      let byte = bytesToUint16BigEndian(bytes, 0x38 + 2 * i);
      if (byte === 0) {
        break;
      }
      byteArray[i] = byte;
    }
    this.trainerName = new TextDecoder('utf-16').decode(byteArray);
    this.ribbons = [];
    let ribbonsValue = bytesToUint16BigEndian(bytes, 0x7c);
    for (let ribbon = 0; ribbon < Gen3StandardRibbons.length; ribbon++) {
      if (ribbonsValue & (1 << (15 - ribbon))) {
        this.ribbons.push(Gen3StandardRibbons[ribbon]);
      }
    }
    this.isShadow =
      bytesToUint16BigEndian(bytes, 0xba) > 0 &&
      !this.ribbons.includes('National') &&
      this.gameOfOrigin === 0x0f;
    this.metYear = bytes[0x7b];
    this.metMonth = bytes[0x7c];
    this.metDay = bytes[0x7d];
    this.metLocation =
      getMetLocation(this.gameOfOrigin, bytesToUint16BigEndian(bytes, 0x08)) ??
      bytesToUint16BigEndian(bytes, 0x08).toString();
    this.isShiny =
      (this.trainerID ^
        this.secretID ^
        bytesToUint16BigEndian(bytes, 0x00) ^
        bytesToUint16BigEndian(bytes, 0x02)) <
      8;
  }
}
