import { GameOfOriginData } from '../../consts/GameOfOrigin';
import { Gen3Items } from '../../consts/Items';
import { GCLanguages } from '../../consts/Languages';
import { POKEMON_DATA } from '../../consts/Mons';
import { Gen3StandardRibbons } from '../../consts/Ribbons';
import {
  bytesToUint16BigEndian,
  bytesToUint32BigEndian,
} from '../../util/ByteLogic';
import { gen3ToNational } from '../../util/ConvertPokemonID';
import { getGen3To5Gender } from '../../util/GenderCalc';
import {
  getHPGen3Onward,
  getLevelGen3Onward,
  getStatGen3Onward,
} from '../../util/StatCalc';
import { utf16BytesToString } from '../../util/Strings/StringConverter';
import { PKM, contestStats } from './PKM';

export class XDPKM extends PKM {
  constructor(bytes: Uint8Array) {
    console.log('making xd PKM');
    super(bytes);
    this.format = 'XDPKM';
    this.personalityValue = bytesToUint32BigEndian(bytes, 0x28);
    this.dexNum = gen3ToNational(bytesToUint16BigEndian(bytes, 0x00));
    this.gender = getGen3To5Gender(this.personalityValue, this.dexNum);
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
        ? POKEMON_DATA[this.dexNum]?.formes[0].ability1
        : POKEMON_DATA[this.dexNum]?.formes[0].ability2 ?? 'None';
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
    this.stats = {
      hp: getHPGen3Onward(this),
      atk: getStatGen3Onward('Atk', this),
      def: getStatGen3Onward('Def', this),
      spe: getStatGen3Onward('Spe', this),
      spa: getStatGen3Onward('SpA', this),
      spd: getStatGen3Onward('SpD', this),
    };
    let origin =
      GameOfOriginData.find((game) => game?.gc === bytes[0x34]) ?? null;
    this.gameOfOrigin = GameOfOriginData.indexOf(origin);
    this.trainerName = utf16BytesToString(this.bytes, 0x38, 11, true);
    this.nickname = utf16BytesToString(this.bytes, 0x4e, 11, true);
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
    this.metLocationIndex = bytesToUint16BigEndian(bytes, 0x08);
    this.isShiny =
      (this.trainerID ^
        this.secretID ^
        bytesToUint16BigEndian(bytes, 0x00) ^
        bytesToUint16BigEndian(bytes, 0x02)) <
      8;
  }

  public get movePP() {
    return [
      this.bytes[0x82],
      this.bytes[0x86],
      this.bytes[0x8a],
      this.bytes[0x8e],
    ];
  }

  public set movePP(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i += 4) {
      this.bytes[0x7a + i] = value[i];
    }
  }
  public get movePPUps() {
    return [
      this.bytes[0x83],
      this.bytes[0x87],
      this.bytes[0x8b],
      this.bytes[0x8f],
    ];
  }

  public set movePPUps(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i += 4) {
      this.bytes[0x7b + i] = value[i];
    }
  }
  public get contest() {
    return {
      cool: this.bytes[0xae],
      beauty: this.bytes[0xaf],
      cute: this.bytes[0xb0],
      smart: this.bytes[0xb1],
      tough: this.bytes[0xb2],
      sheen: this.bytes[0xb3],
    };
  }

  public set contest(value: contestStats) {
    this.bytes[0xae] = value.cool;
    this.bytes[0xaf] = value.beauty;
    this.bytes[0xb0] = value.cute;
    this.bytes[0xb1] = value.smart;
    this.bytes[0xb2] = value.tough;
    this.bytes[0xb3] = value.sheen;
  }
}
