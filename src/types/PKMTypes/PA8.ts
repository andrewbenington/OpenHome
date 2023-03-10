import { Abilities } from '../../consts/Abilities';
import { Items } from '../../consts/Items';
import { Languages } from '../../consts/Languages';
import { Gen9Ribbons } from '../../consts/Ribbons';
import {
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
  getFlag,
  setFlag,
  uint16ToBytesLittleEndian,
  uint32ToBytesLittleEndian,
} from '../../util/ByteLogic';
import { getLevelGen3Onward } from '../../util/StatCalc';
import {
  utf16BytesToString,
  utf16StringToBytes,
} from '../../util/Strings/StringConverter';
import {
  contestStats,
  hyperTrainStats,
  memory,
  PKM,
  pokedate,
  stats,
} from './PKM';
import { writeIVsToBuffer } from './util';

export class PA8 extends PKM {
  static fileSize = 376;
  public get format() {
    return 'PA8';
  }
  public get encryptionConstant() {
    return bytesToUint32LittleEndian(this.bytes, 0x00);
  }
  public set encryptionConstant(value: number) {
    this.bytes.set(uint32ToBytesLittleEndian(value), 0x0);
  }
  public get sanity() {
    return bytesToUint16LittleEndian(this.bytes, 0x04);
  }
  public set sanity(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x4);
  }
  public get checksum() {
    return bytesToUint16LittleEndian(this.bytes, 0x06);
  }
  public set checksum(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x6);
  }
  public get dexNum() {
    return bytesToUint16LittleEndian(this.bytes, 0x08);
  }
  public set dexNum(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x8);
  }
  public get heldItemIndex() {
    return bytesToUint16LittleEndian(this.bytes, 0x0a);
  }
  public set heldItemIndex(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x0a);
  }
  public get heldItem() {
    return Items[this.heldItemIndex];
  }
  public set heldItem(value: string) {
    let itemIndex = Items.indexOf(value);
    if (itemIndex > -1) {
      this.heldItemIndex = itemIndex;
    }
  }
  public get trainerID() {
    return bytesToUint16LittleEndian(this.bytes, 0x0c);
  }
  public set trainerID(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x0c);
  }
  public get secretID() {
    return bytesToUint16LittleEndian(this.bytes, 0x0e);
  }
  public set secretID(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x0e);
  }
  public get displayID() {
    return bytesToUint32LittleEndian(this.bytes, 0x0c) % 1000000;
  }
  public get exp() {
    return bytesToUint32LittleEndian(this.bytes, 0x10);
  }
  public set exp(value: number) {
    this.bytes.set(uint32ToBytesLittleEndian(value), 0x10);
  }
  public get level() {
    return getLevelGen3Onward(this.dexNum, this.exp);
  }
  public get abilityIndex() {
    return bytesToUint16LittleEndian(this.bytes, 0x14);
  }
  public set abilityIndex(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x14);
  }
  public get ability() {
    return Abilities[this.abilityIndex];
  }
  public set ability(value: string) {
    let abilityIndex = Abilities.indexOf(value);
    if (abilityIndex > -1) {
      this.heldItemIndex = abilityIndex;
    }
  }
  public get abilityNum() {
    return this.bytes[0x16] & 7;
  }
  public set abilityNum(value: number) {
    this.bytes[0x16] = (this.bytes[0x16] & ~7) | (value & 7);
  }
  public get favorite() {
    return !!(this.bytes[0x16] & 8);
  }
  public set favorite(value: boolean) {
    this.bytes[0x16] = (this.bytes[0x16] & ~8) | (value ? 8 : 0);
  }
  public get canGigantamax() {
    return !!(this.bytes[0x16] & 16);
  }
  public set canGigantamax(value: boolean) {
    this.bytes[0x16] = (this.bytes[0x16] & ~16) | (value ? 16 : 0);
  }
  public get isAlpha() {
    return !!(this.bytes[0x16] & 32);
  }
  public set isAlpha(value: boolean) {
    this.bytes[0x16] = (this.bytes[0x16] & ~32) | (value ? 32 : 0);
  }
  public get isNoble() {
    return !!(this.bytes[0x16] & 64);
  }
  public set isNoble(value: boolean) {
    this.bytes[0x16] = (this.bytes[0x16] & ~64) | (value ? 64 : 0);
  }
  public get personalityValue() {
    return bytesToUint32LittleEndian(this.bytes, 0x1c);
  }
  public set personalityValue(value: number) {
    this.bytes.set(uint32ToBytesLittleEndian(value), 0x1c);
  }
  public get nature() {
    return this.bytes[0x20];
  }
  public set nature(value: number) {
    this.bytes[0x20] = value;
  }
  public get statNature() {
    return this.bytes[0x21];
  }
  public set statNature(value: number) {
    this.bytes[0x21] = value;
  }
  public get isFatefulEncounter() {
    return !!(this.bytes[0x22] & 1);
  }
  public set isFatefulEncounter(value: boolean) {
    this.bytes[0x22] = (this.bytes[0x22] & ~1) | (value ? 1 : 0);
  }
  public get flag2LA() {
    return getFlag(this.bytes, 0x22, 2);
  }
  public set flag2LA(value: boolean) {
    setFlag(this.bytes, 0x22, 2, value);
  }
  public get gender() {
    return (this.bytes[0x22] >> 2) & 0x3;
  }
  public set gender(value: number) {
    this.bytes[0x22] = (this.bytes[0x22] & 0xf3) | (value << 2);
  }
  public get formNum() {
    return bytesToUint16LittleEndian(this.bytes, 0x24);
  }
  public set formNum(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x24);
  }
  public get evs() {
    return {
      hp: this.bytes[0x26],
      atk: this.bytes[0x27],
      def: this.bytes[0x28],
      spa: this.bytes[0x29],
      spd: this.bytes[0x2a],
      spe: this.bytes[0x2b],
    };
  }
  public set evs(value: stats) {
    this.bytes[0x26] = value.hp;
    this.bytes[0x27] = value.atk;
    this.bytes[0x28] = value.def;
    this.bytes[0x29] = value.spa;
    this.bytes[0x2a] = value.spd;
    this.bytes[0x2b] = value.spe;
  }
  public get contest() {
    return {
      cool: this.bytes[0x2c],
      beauty: this.bytes[0x2d],
      cute: this.bytes[0x2e],
      smart: this.bytes[0x2f],
      tough: this.bytes[0x30],
      sheen: this.bytes[0x31],
    };
  }
  public set contest(value: contestStats) {
    this.bytes[0x2c] = value.cool;
    this.bytes[0x2d] = value.beauty;
    this.bytes[0x2e] = value.cute;
    this.bytes[0x2f] = value.smart;
    this.bytes[0x30] = value.tough;
    this.bytes[0x31] = value.sheen;
  }
  public get pokerusByte() {
    return this.bytes[0x32];
  }
  public set pokerusByte(value: number) {
    this.bytes[0x32] = value;
  }
  public get ribbonBytes() {
    let rBytes = new Uint8Array(16);
    rBytes.set(this.bytes.slice(0x34, 0x3a), 0);
    rBytes.set(this.bytes.slice(0x40, 0x48), 8);
    console.log(this.bytes.slice(0x40, 0x48), 8);
    return rBytes;
  }
  public set ribbonBytes(value: Uint8Array) {
    this.bytes.set(value.slice(0, 8), 0x34);
    this.bytes.set(value.slice(8, 16), 0x40);
  }
  public get ribbons() {
    let ribbons = [];
    let rBytes = this.ribbonBytes;
    for (let byte = 0; byte < 16; byte++) {
      let ribbonsUint8 = rBytes[byte];
      for (let bit = 0; bit < 8; bit++) {
        if (
          ribbonsUint8 & Math.pow(2, bit) &&
          8 * byte + bit < Gen9Ribbons.length
        ) {
          ribbons.push(Gen9Ribbons[8 * byte + bit]);
        }
      }
    }
    return ribbons;
  }
  public set ribbons(value: string[]) {
    this.ribbonBytes = new Uint8Array(16);
    value.forEach((ribbon) => {
      let index = Gen9Ribbons.indexOf(ribbon);
      if (index > 0) {
        setFlag(this.ribbonBytes, index >= 64 ? 0x40 : 0x34, index, true);
      }
    });
  }
  public get contestMemoryCount() {
    return this.bytes[0x3c];
  }
  public set contestMemoryCount(value: number) {
    this.bytes[0x3c] = value;
  }
  public get battleMemoryCount() {
    return this.bytes[0x3d];
  }
  public set battleMemoryCount(value: number) {
    this.bytes[0x3d] = value;
  }
  public get alphaMove() {
    return bytesToUint16LittleEndian(this.bytes, 0x3e);
  }
  public set alphaMove(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x3e);
  }
  public get sociability() {
    return bytesToUint32LittleEndian(this.bytes, 0x48);
  }
  public set sociability(value: number) {
    this.bytes.set(uint32ToBytesLittleEndian(value), 0x48);
  }
  public get height() {
    return this.bytes[0x50];
  }
  public set height(value: number) {
    this.bytes[0x50] = value;
  }
  public get weight() {
    return this.bytes[0x51];
  }
  public set weight(value: number) {
    this.bytes[0x51] = value;
  }
  public get scale() {
    return this.bytes[0x52];
  }
  public set scale(value: number) {
    this.bytes[0x52] = value;
  }
  public get moves() {
    return [
      bytesToUint16LittleEndian(this.bytes, 0x54),
      bytesToUint16LittleEndian(this.bytes, 0x56),
      bytesToUint16LittleEndian(this.bytes, 0x58),
      bytesToUint16LittleEndian(this.bytes, 0x5a),
    ];
  }
  public set moves(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes.set(uint16ToBytesLittleEndian(value[i]), 0x54 + 2 * i);
    }
  }
  public get movePP() {
    return [
      this.bytes[0x5c],
      this.bytes[0x5d],
      this.bytes[0x5e],
      this.bytes[0x5f],
    ];
  }
  public set movePP(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes[0x5c + i] = value[i];
    }
  }
  public get nicknameBytes() {
    return this.bytes.slice(0x60, 26);
  }
  public get nickname() {
    return utf16BytesToString(this.bytes, 0x60, 12);
  }
  public set nickname(value: string) {
    let utfBytes = utf16StringToBytes(value, 12);
    this.bytes.set(utfBytes, 0x60);
  }
  public get movePPUps() {
    return [
      this.bytes[0x86],
      this.bytes[0x87],
      this.bytes[0x88],
      this.bytes[0x89],
    ];
  }
  public set movePPUps(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes[0x86 + i] = value[i];
    }
  }
  public get relearnMoves() {
    return [
      bytesToUint16LittleEndian(this.bytes, 0x8a),
      bytesToUint16LittleEndian(this.bytes, 0x8c),
      bytesToUint16LittleEndian(this.bytes, 0x8e),
      bytesToUint16LittleEndian(this.bytes, 0x90),
    ];
  }
  public set relearnMoves(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes.set(uint16ToBytesLittleEndian(value[i]), 0x8a + 2 * i);
    }
  }
  public get currentHP() {
    return bytesToUint16LittleEndian(this.bytes, 0x92);
  }
  public set currentHP(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x92);
  }
  public get ivs() {
    let ivBytes = bytesToUint32LittleEndian(this.bytes, 0x94);
    return {
      hp: ivBytes & 0x1f,
      atk: (ivBytes >> 5) & 0x1f,
      def: (ivBytes >> 10) & 0x1f,
      spe: (ivBytes >> 15) & 0x1f,
      spa: (ivBytes >> 20) & 0x1f,
      spd: (ivBytes >> 25) & 0x1f,
    };
  }
  public set ivs(value: stats) {
    writeIVsToBuffer(value, this.bytes, 0x94, this.isEgg, this.isNicknamed);
  }
  public get isEgg() {
    return getFlag(this.bytes, 0x94, 30);
  }
  public set isEgg(value: boolean) {
    setFlag(this.bytes, 0x94, 30, value);
  }
  public get isNicknamed() {
    return getFlag(this.bytes, 0x94, 31);
  }
  public set isNicknamed(value: boolean) {
    setFlag(this.bytes, 0x94, 31, value);
  }
  public get dynamaxLevel() {
    return this.bytes[0x98];
  }
  public set dynamaxLevel(value: number) {
    this.bytes[0x98] = value;
  }
  public get statusCondition() {
    return bytesToUint32LittleEndian(this.bytes, 0x9c);
  }
  public set statusCondition(value: number) {
    this.bytes.set(uint32ToBytesLittleEndian(value), 0x9c);
  }
  public get unknownA0() {
    return bytesToUint32LittleEndian(this.bytes, 0xa0);
  }
  public set unknownA0(value: number) {
    this.bytes.set(uint32ToBytesLittleEndian(value), 0xa0);
  }
  public get gvs() {
    return {
      hp: this.bytes[0xa4],
      atk: this.bytes[0xa5],
      def: this.bytes[0xa6],
      spe: this.bytes[0xa7],
      spa: this.bytes[0xa8],
      spd: this.bytes[0xa9],
    };
  }
  public set gvs(value: stats) {
    this.bytes[0xa4] = value.hp;
    this.bytes[0xa5] = value.atk;
    this.bytes[0xa6] = value.def;
    this.bytes[0xa7] = value.spa;
    this.bytes[0xa8] = value.spd;
    this.bytes[0xa9] = value.spe;
  }
  public get heightAbsoluteBytes() {
    return this.bytes.slice(0xac, 0xb0);
  }
  public set heightAbsoluteBytes(value: Uint8Array) {
    this.bytes.set(value, 0xac);
  }
  public get heightAbsolute() {
    return Buffer.from(this.heightAbsoluteBytes).readFloatLE();
  }
  public get weightAbsoluteBytes() {
    return this.bytes.slice(0xb0, 0xb4);
  }
  public set weightAbsoluteBytes(value: Uint8Array) {
    this.bytes.set(value, 0xb0);
  }
  public get weightAbsolute() {
    return Buffer.from(this.weightAbsoluteBytes).readFloatLE();
  }
  public get handlerNameBytes() {
    return this.bytes.slice(0xb8, 26);
  }
  public set handlerNameBytes(value: Uint8Array) {
    this.bytes.set(value, 0xb8);
  }
  public get handlerName() {
    return utf16BytesToString(this.bytes, 0xb8, 12);
  }
  public set handlerName(value: string) {
    let utfBytes = utf16StringToBytes(value, 12);
    this.bytes.set(utfBytes, 0xb8);
  }
  public get handlerGender() {
    return getFlag(this.bytes, 0xd2, 7) ? 1 : 0;
  }
  public set handlerGender(value: number) {
    setFlag(this.bytes, 0xd2, 7, !!value);
  }
  public get handlerLanguageIndex() {
    return this.bytes[0xd3];
  }
  public get handlerLanguage() {
    return Languages[this.languageIndex];
  }
  public set handlerLanguage(value: string) {
    let index = Languages.indexOf(value);
    if (index > -1) {
      this.bytes[0xd3] = index;
    }
  }
  public get handlerID() {
    return bytesToUint16LittleEndian(this.bytes, 0xd6);
  }
  public set handlerID(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0xd6);
  }
  public get handlerFriendship() {
    return this.bytes[0xd8];
  }
  public set handlerFriendship(value: number) {
    this.bytes[0xd8] = value;
  }
  public get handlerMemory() {
    return {
      intensity: this.bytes[0xd9],
      memory: this.bytes[0xda],
      feeling: this.bytes[0xdb],
      textVariables: bytesToUint16LittleEndian(this.bytes, 0xdc),
    };
  }
  public set handlerMemory(value: memory) {
    this.bytes[0xd9] = value.intensity;
    this.bytes[0xda] = value.memory;
    this.bytes[0xdb] = value.feeling;
    this.bytes.set(uint16ToBytesLittleEndian(value.textVariables), 0xdc);
  }
  public get fullness() {
    return this.bytes[0xec];
  }
  public set fullness(value: number) {
    this.bytes[0xec] = value;
  }
  public get enjoyment() {
    return this.bytes[0xed];
  }
  public set enjoyment(value: number) {
    this.bytes[0xed] = value;
  }
  public get gameOfOrigin() {
    return this.bytes[0xee];
  }
  public set gameOfOrigin(value: number) {
    this.bytes[0xee] = value;
  }
  public get gameOfOriginBattle() {
    return this.bytes[0xef];
  }
  public set gameOfOriginBattle(value: number) {
    this.bytes[0xef] = value;
  }
  public get languageIndex() {
    return this.bytes[0xf2];
  }
  public get language() {
    return Languages[this.languageIndex];
  }
  public set language(value: string) {
    let index = Languages.indexOf(value);
    if (index > -1) {
      this.bytes[0xf2] = index;
    }
  }
  public set unknownF3(value: number) {
    this.bytes[0xf3] = value;
  }
  public get unknownF3() {
    return this.bytes[0xf3];
  }
  public get formArgument() {
    return bytesToUint32LittleEndian(this.bytes, 0xf4);
  }
  public set formArgument(value: number) {
    this.bytes.set(uint32ToBytesLittleEndian(value), 0xf4);
  }
  public get affixedRibbon() {
    return this.bytes[0xf8] !== 0xff ? this.bytes[0xf8] : undefined;
  }
  public set affixedRibbon(value: number | undefined) {
    this.bytes[0xf8] = value ?? 0xff;
  }

  public get trainerNameBytes() {
    return this.bytes.slice(0x110, 26);
  }
  public set trainerNameBytes(value: Uint8Array) {
    this.bytes.set(value.slice(0, 12), 0x110);
  }
  public get trainerName() {
    return utf16BytesToString(this.bytes, 0x110, 12);
  }
  public set trainerName(value: string) {
    let utfBytes = utf16StringToBytes(value, 12);
    this.bytes.set(utfBytes, 0x110);
  }
  public get trainerFriendship() {
    return this.bytes[0x12a];
  }
  public set trainerFriendship(value: number) {
    this.bytes[0x12a] = value;
  }
  public get trainerMemory() {
    return {
      intensity: this.bytes[0x12b],
      memory: this.bytes[0x12c],
      feeling: this.bytes[0x130],
      textVariables: bytesToUint16LittleEndian(this.bytes, 0x12e),
    };
  }
  public set trainerMemory(value: memory) {
    this.bytes[0x12b] = value.intensity;
    this.bytes[0x12c] = value.memory;
    this.bytes[0x130] = value.feeling;
    this.bytes.set(uint16ToBytesLittleEndian(value.textVariables), 0x12e);
  }
  public get eggDate() {
    return {
      year: this.bytes[0x131],
      month: this.bytes[0x132],
      day: this.bytes[0x133],
    };
  }
  public set eggDate(value: pokedate) {
    this.bytes[0x131] = value.year;
    this.bytes[0x132] = value.month;
    this.bytes[0x133] = value.day;
  }
  public get metDate() {
    return {
      year: this.bytes[0x134],
      month: this.bytes[0x135],
      day: this.bytes[0x136],
    };
  }
  public set metDate(value: pokedate) {
    this.bytes[0x134] = value.year;
    this.bytes[0x135] = value.month;
    this.bytes[0x136] = value.day;
  }
  public get ball() {
    return this.bytes[0x137];
  }
  public set ball(value: number) {
    this.bytes[0x137] = value;
  }
  public get eggLocationIndex() {
    return bytesToUint16LittleEndian(this.bytes, 0x13a);
  }
  public set eggLocationIndex(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x13a);
  }
  public get metLocationIndex() {
    return bytesToUint16LittleEndian(this.bytes, 0x13a);
  }
  public set metLocationIndex(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x13a);
  }
  public get metLevel() {
    return this.bytes[0x13d] & ~0x80;
  }
  public set metLevel(value: number) {
    this.bytes[0x13d] = (this.bytes[0x13d] & 0x80) | (value & ~0x80);
  }
  public get trainerGender() {
    return getFlag(this.bytes, 0x13d, 7) ? 1 : 0;
  }
  public set trainerGender(value: number) {
    setFlag(this.bytes, 0x13d, 7, !!value);
  }

  public get hyperTraining() {
    return {
      hp: getFlag(this.bytes, 0x13e, 0),
      atk: getFlag(this.bytes, 0x13e, 1),
      def: getFlag(this.bytes, 0x13e, 2),
      spa: getFlag(this.bytes, 0x13e, 3),
      spd: getFlag(this.bytes, 0x13e, 4),
      spe: getFlag(this.bytes, 0x13e, 5),
    };
  }
  public set hyperTraining(value: hyperTrainStats) {
    setFlag(this.bytes, 0x13e, 0, value.hp);
    setFlag(this.bytes, 0x13e, 1, value.atk);
    setFlag(this.bytes, 0x13e, 2, value.def);
    setFlag(this.bytes, 0x13e, 3, value.spa);
    setFlag(this.bytes, 0x13e, 4, value.spd);
    setFlag(this.bytes, 0x13e, 5, value.spe);
  }
  public get MoveFlagsLA() {
    return this.bytes.slice(0x13f, 0x13f + 14);
  }
  public set MoveFlagsLA(value: Uint8Array) {
    this.bytes.set(value.slice(0, 14), 0x13f);
  }
  public get homeTracker() {
    return this.bytes.slice(0x14d, 0x14d + 8);
  }
  public set homeTracker(value: Uint8Array) {
    this.bytes.set(value.slice(0, 8), 0x14d);
  }
  public get TutorFlagsLA() {
    return this.bytes.slice(0x155, 0x155 + 8);
  }
  public set TutorFlagsLA(value: Uint8Array) {
    this.bytes.set(value.slice(0, 8), 0x155);
  }
  public get MasterFlagsLA() {
    return this.bytes.slice(0x15d, 0x15d + 8);
  }
  public set MasterFlagsLA(value: Uint8Array) {
    this.bytes.set(value.slice(0, 8), 0x15d);
  }
  public get stats() {
    return {
      hp: bytesToUint16LittleEndian(this.bytes, 0x16a),
      atk: bytesToUint16LittleEndian(this.bytes, 0x16c),
      def: bytesToUint16LittleEndian(this.bytes, 0x16e),
      spe: bytesToUint16LittleEndian(this.bytes, 0x170),
      spa: bytesToUint16LittleEndian(this.bytes, 0x172),
      spd: bytesToUint16LittleEndian(this.bytes, 0x174),
    };
  }
  public set stats(value: stats) {
    this.bytes.set(uint16ToBytesLittleEndian(value.hp), 0x16a);
    this.bytes.set(uint16ToBytesLittleEndian(value.atk), 0x16c);
    this.bytes.set(uint16ToBytesLittleEndian(value.def), 0x16e);
    this.bytes.set(uint16ToBytesLittleEndian(value.spe), 0x170);
    this.bytes.set(uint16ToBytesLittleEndian(value.spa), 0x172);
    this.bytes.set(uint16ToBytesLittleEndian(value.spd), 0x174);
  }
  public get isShiny() {
    return (
      (this.trainerID ^
        this.secretID ^
        bytesToUint16LittleEndian(this.bytes, 0x1c) ^
        bytesToUint16LittleEndian(this.bytes, 0x1e)) <
      16
    );
  }
  public get isSquareShiny() {
    return (
      (this.trainerID ^
        this.secretID ^
        bytesToUint16LittleEndian(this.bytes, 0x1c) ^
        bytesToUint16LittleEndian(this.bytes, 0x1e)) ===
      0
    );
  }
  constructor(...args: any[]) {
    if (args[0] instanceof Uint8Array) {
      super(args[0]);
    } else if (args[0] instanceof PKM) {
      const other = args[0];
      super(new Uint8Array(376));
    }
  }
}
