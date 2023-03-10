import { gen3ToNational } from '../../util/ConvertPokemonID';
import { GameOfOriginData } from '../../consts/GameOfOrigin';
import { Gen3Items } from '../../consts/Items';
import { GCLanguages } from '../../consts/Languages';
import { POKEMON_DATA } from '../../consts/Mons';
import { Gen3StandardRibbons } from '../../consts/Ribbons';
import { getGen3To5Gender } from '../../util/GenderCalc';
import {
  bytesToUint16BigEndian,
  bytesToUint32BigEndian,
} from '../../util/ByteLogic';
import {
  getHPGen3Onward,
  getLevelGen3Onward,
  getStatGen3Onward,
} from '../../util/StatCalc';
import { PKM } from './PKM';

export class COLOPKM extends PKM {
  constructor(bytes: Uint8Array) {
    super(bytes);
    this.format = 'COLOPKM';
    this.personalityValue = bytesToUint32BigEndian(bytes, 0x04);
    this.dexNum = gen3ToNational(bytesToUint16BigEndian(bytes, 0x00));
    this.gender = getGen3To5Gender(this.personalityValue, this.dexNum);
    this.exp = bytesToUint32BigEndian(bytes, 0x5c);
    this.level = getLevelGen3Onward(this.dexNum, this.exp);
    this.formNum = 0;
    this.heldItem = Gen3Items[bytesToUint16BigEndian(bytes, 0x88)];
    this.nature = this.personalityValue % 25;
    this.trainerID = bytesToUint16BigEndian(bytes, 0x14);
    this.secretID = bytesToUint16BigEndian(bytes, 0x16);
    this.displayID = this.trainerID;
    this.language = GCLanguages[bytes[0x0b]];
    this.ball = bytes[0x0f];
    this.metLevel = bytes[0x0e];
    this.trainerGender = bytes[0x10];
    this.isShadow =
      bytesToUint16BigEndian(bytes, 0xd8) > 0 &&
      bytesToUint16BigEndian(bytes, 0xdc) === 0;
    this.moves = [
      bytesToUint16BigEndian(bytes, 0x78),
      bytesToUint16BigEndian(bytes, 0x7c),
      bytesToUint16BigEndian(bytes, 0x80),
      bytesToUint16BigEndian(bytes, 0x84),
    ];
    this.abilityNum = bytes[0xcc] + 1;
    this.ability =
      this.abilityNum === 1
        ? POKEMON_DATA[this.dexNum]?.formes[0].ability1
        : POKEMON_DATA[this.dexNum]?.formes[0].ability2 ?? 'None';
    this.ivs = {
      hp: bytesToUint16BigEndian(bytes, 0xa4),
      atk: bytesToUint16BigEndian(bytes, 0xa6),
      def: bytesToUint16BigEndian(bytes, 0xa8),
      spa: bytesToUint16BigEndian(bytes, 0xaa),
      spd: bytesToUint16BigEndian(bytes, 0xac),
      spe: bytesToUint16BigEndian(bytes, 0xae),
    };
    this.evs = {
      hp: bytesToUint16BigEndian(bytes, 0x98),
      atk: bytesToUint16BigEndian(bytes, 0x9a),
      def: bytesToUint16BigEndian(bytes, 0x9c),
      spa: bytesToUint16BigEndian(bytes, 0x9e),
      spd: bytesToUint16BigEndian(bytes, 0xa0),
      spe: bytesToUint16BigEndian(bytes, 0xa2),
    };
    this.contest = {
      cool: bytes[0xb2],
      beauty: bytes[0xb3],
      cute: bytes[0xb4],
      smart: bytes[0xb5],
      tough: bytes[0xb6],
      sheen: bytes[0xbc],
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
      GameOfOriginData.find((game) => game?.gc === bytes[0x08]) ?? null;
    this.gameOfOrigin = GameOfOriginData.indexOf(origin);
    let byteArray = new Uint16Array(12);
    for (let i = 0; i < 12; i += 1) {
      let byte = bytesToUint16BigEndian(bytes, 0x2e + 2 * i);
      if (byte === 0) {
        break;
      }
      byteArray[i] = byte;
    }
    this.nickname = new TextDecoder('utf-16').decode(byteArray);
    byteArray = new Uint16Array(12);
    for (let i = 0; i < 12; i += 1) {
      let byte = bytesToUint16BigEndian(bytes, 0x18 + 2 * i);
      if (byte === 0) {
        break;
      }
      byteArray[i] = byte;
    }
    this.trainerName = new TextDecoder('utf-16').decode(byteArray);
    this.ribbons = [];
    for (let index = 0; index < Gen3StandardRibbons.length; index++) {
      if (bytes[index + 0xbd] === 1) {
        this.ribbons.push(Gen3StandardRibbons[index]);
      }
    }
    this.isShiny =
      (this.trainerID ^
        this.secretID ^
        bytesToUint16BigEndian(bytes, 0x00) ^
        bytesToUint16BigEndian(bytes, 0x02)) <
      8;
  }
  public get movePP() {
    return [
      this.bytes[0x7a],
      this.bytes[0x7e],
      this.bytes[0x82],
      this.bytes[0x86],
    ];
  }

  public set movePP(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i += 4) {
      this.bytes[0x7a + i] = value[i];
    }
  }
  public get movePPUps() {
    return [
      this.bytes[0x7b],
      this.bytes[0x7f],
      this.bytes[0x83],
      this.bytes[0x87],
    ];
  }

  public set movePPUps(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i += 4) {
      this.bytes[0x7b + i] = value[i];
    }
  }
}
