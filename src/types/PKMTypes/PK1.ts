import { statsPreSplit } from 'types/types';
import { GameOfOrigin, Gen2Items, POKEMON_DATA } from '../../consts';
import {
  bytesToUint16BigEndian,
  bytesToUint24BigEndian,
  uint16ToBytesBigEndian,
  uint24ToBytesBigEndian,
} from '../../util/ByteLogic';
import { gen1IDToNatDex, natDexToGen1ID } from '../../util/ConvertPokemonID';
import { getLevelGen12 } from '../../util/StatCalc';
import { gen12StringToUTF } from '../../util/Strings/StringConverter';
import { OHPKM } from './OHPKM';
import { PKM } from './PKM';
import { adjustMovePPBetweenFormats, getTypes } from './util';

const gen1TypeIndices: { [key: string]: number } = {
  Normal: 0,
  Fighting: 1,
  Flying: 2,
  Poison: 3,
  Ground: 4,
  Rock: 5,
  Bug: 7,
  Ghost: 8,
  Fire: 20,
  Water: 21,
  Grass: 22,
  Electric: 23,
  Psychic: 24,
  Ice: 25,
  Dragon: 26,
};

export const GEN1_MOVE_MAX = 165;

export class PK1 extends PKM {
  public get format() {
    return 'PK1';
  }

  public get dexNum() {
    return gen1IDToNatDex[this.bytes[0x00]];
  }

  public set dexNum(value: number) {
    this.bytes[0x00] = natDexToGen1ID[value];
  }

  public get currentHP() {
    return this.bytes[0x02];
  }

  public set currentHP(value: number) {
    this.bytes[0x02] = value;
  }

  public get level() {
    return this.bytes[0x03];
  }

  public set level(value: number) {
    this.bytes[0x03] = value;
  }

  public get statusCondition() {
    return this.bytes[0x04];
  }

  public set statusCondition(value: number) {
    this.bytes[0x04] = value;
  }

  public get type1() {
    return this.bytes[0x05];
  }

  public set type1(value: number) {
    this.bytes[0x05] = value;
  }

  public get type2() {
    return this.bytes[0x06];
  }

  public set type2(value: number) {
    this.bytes[0x06] = value;
  }

  // catch rate
  public get heldItemIndex() {
    return this.bytes[0x07];
  }

  public set heldItemIndex(value: number) {
    this.bytes[0x07] = value;
  }

  public get heldItem() {
    return Gen2Items[this.heldItemIndex];
  }

  public set heldItem(value: string) {
    const itemIndex = Gen2Items.indexOf(value);
    if (itemIndex > -1) {
      this.heldItemIndex = itemIndex;
    }
  }

  public get moves() {
    return [
      this.bytes[0x08],
      this.bytes[0x09],
      this.bytes[0x0a],
      this.bytes[0x0b],
    ];
  }

  public set moves(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes[0x08 + i] = value[i];
    }
  }

  public get trainerID() {
    return bytesToUint16BigEndian(this.bytes, 0x0c);
  }

  public set trainerID(value: number) {
    this.bytes.set(uint16ToBytesBigEndian(value), 0x0c);
  }

  public get displayID() {
    return this.trainerID;
  }

  public get gender() {
    if (!POKEMON_DATA[this.dexNum]) return 2;
    const maleRatio =
      POKEMON_DATA[this.dexNum].formes[0].genderRatio.M > 0 ||
      POKEMON_DATA[this.dexNum].formes[0].genderRatio.F > 0
        ? POKEMON_DATA[this.dexNum].formes[0].genderRatio.M
        : -1;
    if (maleRatio === -1) {
      return 2;
    }
    return this.dvs.atk < maleRatio * 15 ? 1 : 0;
  }

  public get formNum() {
    return 0;
  }

  public get exp() {
    return bytesToUint24BigEndian(this.bytes, 0x0e);
  }

  public set exp(value: number) {
    this.bytes.set(uint24ToBytesBigEndian(value), 0x0e);
  }

  public get evsG12() {
    return {
      hp: bytesToUint16BigEndian(this.bytes, 0x11),
      atk: bytesToUint16BigEndian(this.bytes, 0x13),
      def: bytesToUint16BigEndian(this.bytes, 0x15),
      spe: bytesToUint16BigEndian(this.bytes, 0x17),
      spc: bytesToUint16BigEndian(this.bytes, 0x19),
    };
  }

  public set evsG12(value: statsPreSplit) {
    this.bytes.set(uint16ToBytesBigEndian(value.hp), 0x11);
    this.bytes.set(uint16ToBytesBigEndian(value.atk), 0x13);
    this.bytes.set(uint16ToBytesBigEndian(value.def), 0x15);
    this.bytes.set(uint16ToBytesBigEndian(value.spe), 0x17);
    this.bytes.set(uint16ToBytesBigEndian(value.spc), 0x19);
  }

  public get dvs() {
    const dvBytes = bytesToUint16BigEndian(this.bytes, 0x1b);
    return {
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
  }

  public set dvs(value: statsPreSplit) {
    let dvBytes = value.atk & 0x0f;
    dvBytes = (dvBytes << 4) | (value.def & 0x0f);
    dvBytes = (dvBytes << 4) | (value.spe & 0x0f);
    dvBytes = (dvBytes << 4) | (value.spc & 0x0f);
    this.bytes.set(uint16ToBytesBigEndian(dvBytes), 0x1b);
  }

  public get movePP() {
    return [
      this.bytes[0x1d] & 0b00111111,
      this.bytes[0x1e] & 0b00111111,
      this.bytes[0x1f] & 0b00111111,
      this.bytes[0x20] & 0b00111111,
    ];
  }

  public set movePP(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes[0x1d + i] =
        (this.bytes[0x1d + i] & 0b11000000) | (value[i] & 0b00111111);
    }
  }

  public get movePPUps() {
    return [
      (this.bytes[0x1d] & 0b11000000) >> 6,
      (this.bytes[0x1e] & 0b11000000) >> 6,
      (this.bytes[0x1f] & 0b11000000) >> 6,
      (this.bytes[0x20] & 0b11000000) >> 6,
    ];
  }

  public set movePPUps(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes[0x1d + i] =
        (this.bytes[0x1d + i] & 0b00111111) | ((value[i] << 6) & 0b11000000);
    }
  }

  public get isShiny() {
    return (
      this.dvs.spe === 10 &&
      this.dvs.def === 10 &&
      this.dvs.spc === 10 &&
      [2, 3, 6, 7, 10, 11, 14, 15].includes(this.dvs.atk)
    );
  }

  constructor(...args: any[]) {
    if (args[0] instanceof Uint8Array) {
      super(args[0]);
      if (this.bytes.length >= 0x41) {
        this.nickname = gen12StringToUTF(this.bytes, 0x37, 11);
        if (this.bytes[0x2c] === 0x5d) {
          this.trainerName = 'TRAINER';
        } else {
          this.trainerName = gen12StringToUTF(this.bytes, 0x2c, 11);
        }
      } else {
        this.nickname = POKEMON_DATA[this.dexNum].name.toLocaleUpperCase();
      }
      this.level = this.dexNum > 0 ? getLevelGen12(this.dexNum, this.exp) : 0;
      this.gameOfOrigin = GameOfOrigin.Red;
    } else if (args[0] instanceof OHPKM) {
      super(new Uint8Array(33));
      const other = args[0];
      this.dexNum = other.dexNum;
      this.heldItem = other.heldItem;
      this.currentHP = other.currentHP;
      // treated as a tracking number for non-GB origin mons
      if (!other.isGameBoyOrigin && other.personalityValue !== undefined) {
        this.trainerID = other.personalityValue % 0x10000;
      } else {
        this.trainerID = other.trainerID;
      }
      this.exp = other.exp;
      this.level = this.dexNum > 0 ? getLevelGen12(this.dexNum, this.exp) : 0;
      const validMoves = other.moves.filter((move) => move <= GEN1_MOVE_MAX);
      const validMovePP = adjustMovePPBetweenFormats(this, other).filter(
        (_, i) => other.moves[i] <= GEN1_MOVE_MAX
      );
      const validMovePPUps = other.movePPUps.filter(
        (_, i) => other.moves[i] <= GEN1_MOVE_MAX
      );
      this.moves = [validMoves[0], validMoves[1], validMoves[2], validMoves[3]];
      this.movePPUps = [
        validMovePPUps[0],
        validMovePPUps[1],
        validMovePPUps[2],
        validMovePPUps[3],
      ];
      this.movePP = [
        validMovePP[0],
        validMovePP[1],
        validMovePP[2],
        validMovePP[3],
      ];
      this.evsG12 = other.evsG12;
      this.dvs = other.dvs;
      const types = getTypes(this);
      this.type1 = types[0] in gen1TypeIndices ? gen1TypeIndices[types[0]] : 0;
      this.type2 =
        types[1] in gen1TypeIndices ? gen1TypeIndices[types[1]] : this.type1;
      this.nickname = other.nickname;
      this.trainerName = other.trainerName;
      this.gameOfOrigin = other.gameOfOrigin;
      this.language = other.language;
    } else {
      super(new Uint8Array());
    }
  }
}
