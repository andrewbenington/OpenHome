import { GameOfOrigin } from "../consts/GameOfOrigin";
import { Gen3Items } from "../consts/Items";
import { GCLanguages } from "../consts/Languages";
import { MONS_LIST } from "../consts/Mons";
import { Gen3Ribbons } from "../consts/Ribbons";
import { getMetLocation } from "../MetLocation/MetLocation";
import { getGen3To5Gender } from "../util/GenderCalc";
import {
  getHPGen3Onward,
  getLevelGen3Onward,
  getStatGen3Onward,
} from "../util/StatCalc";
import {
  bytesToUint16BigEndian,
  bytesToUint32BigEndian,
  gen3IDs,
} from "../util/utils";
import { pkm } from "./pkm";

export class colopkm extends pkm {
  constructor(bytes: Uint8Array) {
    super(bytes);
    this.format = "colopkm";
    this.personalityValue = bytesToUint32BigEndian(bytes, 0x04);
    this.dexNum = gen3IDs[bytesToUint16BigEndian(bytes, 0x00)];
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
        ? MONS_LIST[this.dexNum]?.formes[0].ability1
        : MONS_LIST[this.dexNum]?.formes[0].ability2 ?? "None";
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
      atk: getStatGen3Onward("Atk", this),
      def: getStatGen3Onward("Def", this),
      spe: getStatGen3Onward("Spe", this),
      spa: getStatGen3Onward("SpA", this),
      spd: getStatGen3Onward("SpD", this),
    };
    let origin = GameOfOrigin.find((game) => game?.gc === bytes[0x08]) ?? null;
    this.gameOfOrigin = GameOfOrigin.indexOf(origin);
    let byteArray = new Uint16Array(12);
    for (let i = 0; i < 12; i += 1) {
      let byte = bytesToUint16BigEndian(bytes, 0x2e + 2 * i);
      if (byte === 0) {
        break;
      }
      byteArray[i] = byte;
    }
    this.nickname = new TextDecoder("utf-16").decode(byteArray);
    byteArray = new Uint16Array(12);
    for (let i = 0; i < 12; i += 1) {
      let byte = bytesToUint16BigEndian(bytes, 0x18 + 2 * i);
      if (byte === 0) {
        break;
      }
      byteArray[i] = byte;
    }
    this.trainerName = new TextDecoder("utf-16").decode(byteArray);
    this.ribbons = [];
    for (let index = 0; index < Gen3Ribbons.length; index++) {
      if (bytes[index + 0xbd] === 1) {
        this.ribbons.push(Gen3Ribbons[index]);
      }
    }
    this.metYear = bytes[0x7b];
    this.metMonth = bytes[0x7c];
    this.metDay = bytes[0x7d];
    this.metLocation =
      getMetLocation(this.gameOfOrigin, bytesToUint16BigEndian(bytes, 0x0c)) ??
      bytesToUint16BigEndian(bytes, 0x0c).toString();
    this.isShiny =
      (this.trainerID ^
        this.secretID ^
        bytesToUint16BigEndian(bytes, 0x00) ^
        bytesToUint16BigEndian(bytes, 0x02)) <
      8;
  }
}
