import {
  gen5StringToUTF,
  utf16StringToGen5,
} from '../../util/Strings/StringConverter';
import { GameOfOrigin } from '../../consts';
import { Abilities } from '../../consts/Abilities';
import { Items } from '../../consts/Items';
import { Languages } from '../../consts/Languages';
import {
  Gen4RibbonsPart1,
  Gen4RibbonsPart2,
  Gen4RibbonsPart3,
} from '../../consts/Ribbons';
import {
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
  getFlag,
  setFlag,
  uint16ToBytesLittleEndian,
  uint32ToBytesLittleEndian,
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
import { contestStats, marking, PKM, pokedate, stats } from './PKM';
import { writeIVsToBuffer } from './util';

export class PK5 extends PKM {
  static fileSize = 136;

  constructor(bytes: Uint8Array, encrypted: boolean = false) {
    if (encrypted) {
      let unencryptedBytes = decryptByteArrayGen45(bytes);
      let unshuffledBytes = unshuffleBlocksGen45(unencryptedBytes);
      super(unshuffledBytes);
    } else {
      super(bytes);
    }
  }

  public get format() {
    return 'PK5';
  }

  public get personalityValue() {
    return bytesToUint32LittleEndian(this.bytes, 0x00);
  }

  public set personalityValue(value: number) {
    this.bytes.set(uint32ToBytesLittleEndian(value), 0x00);
  }

  public get checksum() {
    return bytesToUint16LittleEndian(this.bytes, 0x06);
  }

  public get dexNum() {
    return bytesToUint16LittleEndian(this.bytes, 0x08);
  }

  public set dexNum(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x08);
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
    const itemIndex = Items.indexOf(value);
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
    return this.trainerID;
  }

  public get exp() {
    return bytesToUint32LittleEndian(this.bytes, 0x10);
  }

  public set exp(value: number) {
    this.bytes.set(uint32ToBytesLittleEndian(value), 0x10);
  }

  public get level() {
    return this.dexNum > 0 ? getLevelGen3Onward(this.dexNum, this.exp) : 0;
  }

  public get trainerFriendship() {
    return this.bytes[0x14];
  }

  public set trainerFriendship(value: number) {
    this.bytes[0x14] = value;
  }

  public get abilityNum() {
    if (this.gameOfOrigin < GameOfOrigin.White) {
      return (this.personalityValue & 1) + 1;
    } else {
      return this.bytes[0x42] & 1 ? 3 : ((this.personalityValue >> 16) & 1) + 1;
    }
  }

  public get abilityIndex() {
    return this.bytes[0x15];
  }

  public set abilityIndex(value: number) {
    this.bytes[0x15] = value;
  }

  public get ability() {
    return Abilities[this.abilityIndex];
  }

  public set ability(value: string) {
    this.abilityIndex = Abilities.indexOf(value);
  }

  public get markings() {
    const markingsValue = this.bytes[0x16];
    return [
      markingsValue & 1,
      (markingsValue >> 1) & 1,
      (markingsValue >> 2) & 1,
      (markingsValue >> 3) & 1,
      (markingsValue >> 4) & 1,
      (markingsValue >> 5) & 1,
    ] as any as [marking, marking, marking, marking, marking, marking];
  }

  public set markings(
    value: [marking, marking, marking, marking, marking, marking]
  ) {
    let markingsValue = 0;
    for (let i = 0; i < 6; i++) {
      if (value[i]) {
        markingsValue = markingsValue | Math.pow(2, i);
      }
    }
    this.bytes[0x16] = markingsValue;
  }

  public get languageIndex() {
    return this.bytes[0x17];
  }

  public get language() {
    return Languages[this.languageIndex];
  }

  public set language(value: string) {
    const index = Languages.indexOf(value);
    if (index > -1) {
      this.bytes[0x17] = index;
    }
  }

  public get evs() {
    return {
      hp: this.bytes[0x18],
      atk: this.bytes[0x19],
      def: this.bytes[0x1a],
      spe: this.bytes[0x1b],
      spa: this.bytes[0x1c],
      spd: this.bytes[0x1d],
    };
  }

  public set evs(value: stats) {
    this.bytes[0x18] = value.hp;
    this.bytes[0x19] = value.atk;
    this.bytes[0x1a] = value.def;
    this.bytes[0x1b] = value.spe;
    this.bytes[0x1c] = value.spa;
    this.bytes[0x1d] = value.spd;
  }

  public get contest() {
    return {
      cool: this.bytes[0x1e],
      beauty: this.bytes[0x1f],
      cute: this.bytes[0x20],
      smart: this.bytes[0x21],
      tough: this.bytes[0x22],
      sheen: this.bytes[0x23],
    };
  }

  public set contest(value: contestStats) {
    this.bytes[0x1e] = value.cool;
    this.bytes[0x1f] = value.beauty;
    this.bytes[0x20] = value.cute;
    this.bytes[0x21] = value.smart;
    this.bytes[0x22] = value.tough;
    this.bytes[0x23] = value.sheen;
  }

  public get ribbonBytes() {
    return this.bytes.slice(0x4c, 0x50);
  }

  public set ribbonBytes(value: Uint8Array) {
    this.bytes.set(value.slice(0, 4), 0x4c);
  }

  public get ribbons() {
    const ribbons: string[] = [];
    for (let byte = 0; byte < 4; byte++) {
      let ribbonsUint8 = this.bytes[0x24 + byte];
      for (let bit = 0; bit < 8; bit++) {
        if (ribbonsUint8 & Math.pow(2, bit)) {
          if (8 * byte + bit < Gen4RibbonsPart1.length) {
            ribbons.push(Gen4RibbonsPart1[8 * byte + bit]);
          }
        }
      }
    }
    for (let byte = 0; byte < 4; byte++) {
      let ribbonsUint8 = this.bytes[0x3c + byte];
      for (let bit = 0; bit < 8; bit++) {
        if (ribbonsUint8 & Math.pow(2, bit)) {
          if (8 * byte + bit < Gen4RibbonsPart2.length) {
            ribbons.push(Gen4RibbonsPart2[8 * byte + bit]);
          }
        }
      }
    }
    for (let byte = 0; byte < 4; byte++) {
      let ribbonsUint8 = this.bytes[0x60 + byte];
      for (let bit = 0; bit < 8; bit++) {
        if (ribbonsUint8 & Math.pow(2, bit)) {
          if (8 * byte + bit < Gen4RibbonsPart3.length) {
            ribbons.push(Gen4RibbonsPart3[8 * byte + bit]);
          }
        }
      }
    }
    return ribbons;
  }

  public set ribbons(value: string[]) {
    value.forEach((ribbon) => {
      let index = Gen4RibbonsPart1.indexOf(ribbon);
      if (index > -1) {
        setFlag(this.bytes, 0x24, index, true);
        return;
      }
      index = Gen4RibbonsPart2.indexOf(ribbon);
      if (index > -1) {
        setFlag(this.bytes, 0x3c, index, true);
        return;
      }
      index = Gen4RibbonsPart2.indexOf(ribbon);
      if (index > -1) {
        setFlag(this.bytes, 0x60, index, true);
        return;
      }
    });
  }

  public get moves() {
    return [
      bytesToUint16LittleEndian(this.bytes, 0x28),
      bytesToUint16LittleEndian(this.bytes, 0x2a),
      bytesToUint16LittleEndian(this.bytes, 0x2c),
      bytesToUint16LittleEndian(this.bytes, 0x2e),
    ];
  }

  public set moves(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes.set(uint16ToBytesLittleEndian(value[i]), 0x28 + 2 * i);
    }
  }

  public get movePP() {
    return [
      this.bytes[0x30],
      this.bytes[0x31],
      this.bytes[0x32],
      this.bytes[0x33],
    ];
  }

  public set movePP(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes[0x30 + i] = value[i];
    }
  }

  public get movePPUps() {
    return [
      this.bytes[0x34],
      this.bytes[0x35],
      this.bytes[0x36],
      this.bytes[0x37],
    ];
  }

  public set movePPUps(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes[0x34 + i] = value[i];
    }
  }

  public get ivs() {
    const ivBytes = bytesToUint32LittleEndian(this.bytes, 0x38);
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
    writeIVsToBuffer(value, this.bytes, 0x38, this.isEgg, this.isNicknamed);
  }

  public get isEgg() {
    return getFlag(this.bytes, 0x38, 30);
  }

  public set isEgg(value: boolean) {
    setFlag(this.bytes, 0x38, 30, value);
  }

  public get isNicknamed() {
    return getFlag(this.bytes, 0x38, 31);
  }

  public set isNicknamed(value: boolean) {
    setFlag(this.bytes, 0x38, 31, value);
  }

  public get isFatefulEncounter() {
    return !!(this.bytes[0x40] & 1);
  }

  public set isFatefulEncounter(value: boolean) {
    const bit = 0;
    setFlag(this.bytes, 0x40, bit, value);
  }

  public get gender() {
    return (this.bytes[0x40] >> 1) & 3;
  }

  public set gender(value: number) {
    this.bytes[0x40] = (this.bytes[0x40] & 0b11111001) | ((value & 0b11) << 1);
  }

  public get formNum() {
    return this.bytes[0x40] >> 3;
  }

  public set formNum(value: number) {
    this.bytes[0x40] = (this.bytes[0x40] & 0b111) | (value << 3);
  }

  public get nature() {
    return this.bytes[0x41];
  }

  public set nature(value: number) {
    this.bytes[0x41] = value;
  }

  public get isHiddenAbiliity() {
    return !!(this.bytes[0x42] & 1);
  }

  public set isHiddenAbiliity(value: boolean) {
    this.bytes[0x41] = (this.bytes[0x41] & 0b11111110) | (value ? 1 : 0);
  }

  public get isNsPokemon() {
    return !!(this.bytes[0x42] & 2);
  }

  public set isNsPokemon(value: boolean) {
    this.bytes[0x41] = (this.bytes[0x41] & 0b11111101) | (value ? 1 : 0);
  }

  public get eggLocationIndex() {
    const dpLocation = bytesToUint16LittleEndian(this.bytes, 0x7e);
    return dpLocation !== 0xbba
      ? dpLocation
      : bytesToUint16LittleEndian(this.bytes, 0x44);
  }

  public set eggLocationIndex(value: number) {
    if (value >= 0x0070) {
      // show "faraway place" in diamond/pearl for platinum/hgss locations
      this.bytes.set(uint16ToBytesLittleEndian(0xbba), 0x7e);
    } else {
      this.bytes.set(uint16ToBytesLittleEndian(value), 0x7e);
    }
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x44);
  }

  public get metLocationIndex() {
    return bytesToUint16LittleEndian(this.bytes, 0x80);
  }

  public set metLocationIndex(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x80);
  }

  public get nickname() {
    return gen5StringToUTF(this.bytes, 0x48, 11);
  }

  public set nickname(value: string) {
    const utfBytes = utf16StringToGen5(value, 11, true);
    this.bytes.set(utfBytes, 0x48);
  }

  public get gameOfOrigin() {
    return this.bytes[0x5f];
  }

  public set gameOfOrigin(value: number) {
    this.bytes[0x5f] = value;
  }

  public get trainerName() {
    return gen5StringToUTF(this.bytes, 0x68, 8);
  }

  public set trainerName(value: string) {
    const utfBytes = utf16StringToGen5(value, 8, true);
    this.bytes.set(utfBytes, 0x68);
  }

  public get eggDate() {
    return this.bytes[0x79]
      ? {
          year: this.bytes[0x78],
          month: this.bytes[0x79],
          day: this.bytes[0x7a],
        }
      : undefined;
  }

  public set eggDate(value: pokedate | undefined) {
    if (value) {
      this.bytes[0x78] = value.year;
      this.bytes[0x79] = value.month;
      this.bytes[0x7a] = value.day;
    } else {
      this.bytes[0x78] = 0;
      this.bytes[0x79] = 0;
      this.bytes[0x7a] = 0;
    }
  }

  public get metDate() {
    return {
      year: this.bytes[0x7b],
      month: this.bytes[0x7c],
      day: this.bytes[0x7d],
    };
  }

  public set metDate(value: pokedate) {
    this.bytes[0x7b] = value.year;
    this.bytes[0x7c] = value.month;
    this.bytes[0x7d] = value.day;
  }

  public get pokerusByte() {
    return this.bytes[0x82];
  }

  public set pokerusByte(value: number) {
    this.bytes[0x82] = value;
  }

  public get ball() {
    return this.bytes[0x83];
  }

  public set ball(value: number) {
    this.bytes[0x83] = value;
  }

  public get metLevel() {
    return this.bytes[0x84] & 0x7f;
  }

  public set metLevel(value: number) {
    this.bytes[0x84] = (this.bytes[0x84] & 0x80) | (value & 0x7f);
  }
  public get trainerGender() {
    return getFlag(this.bytes, 0x84, 7) ? 1 : 0;
  }

  public set trainerGender(value: number) {
    setFlag(this.bytes, 0x84, 7, !!value);
  }

  public get groundTile() {
    return this.bytes[0x85];
  }

  public set groundTile(value: number) {
    this.bytes[0x85] = value;
  }

  public get pokeStarFame() {
    return this.bytes[0x87];
  }

  public set pokeStarFame(value: number) {
    this.bytes[0x87] = value;
  }

  public get isShiny() {
    return (
      (this.trainerID ^
        this.secretID ^
        bytesToUint16LittleEndian(this.bytes, 0x00) ^
        bytesToUint16LittleEndian(this.bytes, 0x02)) <
      8
    );
  }

  public get stats(): stats {
    return {
      hp: getHPGen3Onward(this),
      atk: getStatGen3Onward('Atk', this),
      def: getStatGen3Onward('Def', this),
      spe: getStatGen3Onward('Spe', this),
      spa: getStatGen3Onward('SpA', this),
      spd: getStatGen3Onward('SpD', this),
    };
  }
}
