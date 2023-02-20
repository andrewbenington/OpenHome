import { assert } from 'console';
import { uniq } from 'lodash';
import { Abilities } from '../consts/Abilities';
import { Items } from '../consts/Items';
import { Languages } from '../consts/Languages';
import { MONS_LIST } from '../consts/Mons';
import { OpenHomeRibbons } from '../consts/Ribbons';
import { getMetLocation } from '../renderer/MetLocation/MetLocation';
import {
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
  getFlag,
  setFlag,
  uint16ToBytesLittleEndian,
  uint32ToBytesLittleEndian,
} from '../util/ByteLogic';
import {
  getHPGen3Onward,
  getLevelGen3Onward,
  getStatGen3Onward,
} from '../util/StatCalc';
import {
  utf16BytesToString,
  utf16StringToBytes,
} from '../util/Strings/StringConverter';
import {
  contestStats,
  hyperTrainStats,
  marking,
  memory,
  pkm,
  pokedate,
  stats,
  statsPreSplit,
} from './pkm';
import {
  dvsFromIVs,
  formatHasColorMarkings,
  generateIVs,
  generatePersonalityValue,
  generateTeraType,
  getAbilityFromNumber,
  gvsFromIVs,
  ivsFromDVs,
  writeIVsToBuffer,
} from './util';

class OHPKM extends pkm {
  static fileSize = 376;

  constructor(...args: any[]) {
    if (args[0] instanceof Uint8Array) {
      super(args[0]);
    } else if (args[0] instanceof pkm) {
      const other = args[0];
      super(new Uint8Array(420));
      this.sanity = other.sanity;
      this.dexNum = other.dexNum;
      this.heldItem = other.heldItem;
      this.trainerID = other.trainerID;
      this.secretID = other.secretID;
      this.exp = other.exp;
      this.abilityNum = other.abilityNum;
      this.ability = getAbilityFromNumber(
        this.dexNum,
        this.formNum,
        this.abilityNum
      );
      // console.log(other.markings);
      // if (other.markings) {
      //   other.markings?.forEach((value, index) => {
      //     let temp = this.markings;
      //     temp[index] = value;
      //     this.markings = temp;
      //   });
      // }

      console.log('after markings');
      this.alphaMove = other.alphaMove ?? 0;
      if (other.personalityValue) {
        this.personalityValue = other.personalityValue;
      } else {
        this.personalityValue = generatePersonalityValue();
        if (other.dexNum === 201) {
          this.personalityValue =
            (this.personalityValue & 0xffffffe0) | other.formNum;
        }
        if (other.isShiny) {
          let pvBytes = uint32ToBytesLittleEndian(this.personalityValue);
          let pvLower16 = bytesToUint16LittleEndian(pvBytes, 0);
          let pvUpper16 = pvLower16 ^ this.trainerID ^ this.secretID;
          pvBytes.set(uint16ToBytesLittleEndian(pvUpper16), 2);
          this.personalityValue = bytesToUint32LittleEndian(pvBytes, 0);
        } else if (this.isShiny) {
          this.personalityValue = this.personalityValue ^ 0x10000000;
        }
      }
      this.encryptionConstant =
        other.encryptionConstant ??
        other.personalityValue ??
        generatePersonalityValue();
      this.nature = other.nature ?? this.personalityValue % 25;
      this.statNature = other.statNature ?? this.nature;
      this.isFatefulEncounter = other.isFatefulEncounter;
      this.flag2LA = other.flag2LA ?? false;
      this.gender = other.gender;
      this.formNum = other.formNum;
      this.evs = other.evs ?? { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
      this.contest = other.contest;
      this.pokerusByte = other.pokerusByte;
      this.contestMemoryCount = other.contestMemoryCount;
      this.battleMemoryCount = other.battleMemoryCount;
      // handle ribbons
      this.ribbons = other.ribbons;
      this.sociability = other.sociability ?? 0;
      this.height = other.height;
      this.weight = other.weight;
      this.scale = other.scale;
      this.moves = other.moves;
      this.movePP = other.movePP;
      this.nickname = other.nickname;
      this.avs = other.avs;
      this.movePPUps = other.movePPUps;
      this.relearnMoves = other.relearnMoves ?? [0, 0, 0, 0];
      this.currentHP = other.currentHP;
      if (other.ivs) {
        this.ivs = other.ivs;
      } else if (other.dvs) {
        this.ivs = ivsFromDVs(other.dvs);
      } else {
        this.ivs = generateIVs();
      }
      this.isEgg = other.isEgg;
      this.isNicknamed = other.isNicknamed;
      this.teraTypeOriginal =
        other.teraTypeOriginal ??
        generateTeraType(this.dexNum, this.formNum) ??
        0;
      this.teraTypeOverride = other.teraTypeOverride ?? 0x13;
      this.statusCondition = other.statusCondition;
      this.unknownA0 = other.unknownA0 ?? 0;
      this.gvs = other.gvs ?? gvsFromIVs(this.ivs);
      this.dvs = other.dvs ?? dvsFromIVs(this.ivs, other.isShiny);
      this.heightAbsoluteBytes = other.heightAbsoluteBytes ?? new Uint8Array(4);
      this.weightAbsoluteBytes = other.weightAbsoluteBytes ?? new Uint8Array(4);
      this.handlerName = other.handlerName ?? '';
      // this.handlerGender
      this.handlerLanguage = other.handlerLanguage ?? 'ENG';
      this.isCurrentHandler = other.isCurrentHandler;
      this.handlerID = other.handlerID ?? 0;
      this.handlerFriendship = 0;
      this.handlerMemory = other.handlerMemory ?? {
        memory: 0,
        intensity: 0,
        textVariables: 0,
        feeling: 0,
      };
      // this.superTraining
      this.shinyLeaves = other.shinyLeaves ?? 0;
      this.fullness = other.fullness ?? 0;
      this.enjoyment = other.enjoyment ?? 0;
      this.gameOfOrigin = other.gameOfOrigin;
      this.gameOfOriginBattle = other.gameOfOriginBattle;
      // this.region
      // this.consoleRegion
      this.language = other.languageIndex === 0 ? 'ENG' : other.language;
      this.unknownF3 = other.unknownF3 ?? 0;
      this.formArgument = other.formArgument ?? 0;
      this.affixedRibbon = other.affixedRibbon ?? 0;
      // this.geoRegions, this.geoCountries
      // this.distByte
      this.groundTile = other.groundTile ?? 0;
      this.performance = other.performance ?? 0;
      this.trainerName = other.trainerName;
      this.trainerFriendship = other.trainerFriendship;
      this.trainerMemory = other.trainerMemory ?? {
        memory: 0,
        intensity: 0,
        textVariables: 0,
        feeling: 0,
      };
      this.eggDate = other.eggDate;
      let now = new Date();
      this.metDate = other.metDate ?? {
        month: now.getMonth(),
        day: now.getDate(),
        year: now.getFullYear() - 2000,
      };
      this.ball = other.ball ?? 4;
      this.eggLocationIndex = other.eggLocationIndex;
      this.metLocationIndex = other.metLocationIndex ?? 0;
      this.metLevel = other.metLevel ?? this.level;
      this.trainerGender = other.trainerGender;
      this.hyperTraining = other.hyperTraining ?? {
        hp: false,
        atk: false,
        def: false,
        spa: false,
        spd: false,
        spe: false,
      };
      this.homeTracker = other.homeTracker ?? new Uint8Array(8);
      this.evsG12 = other.evsG12 ?? { hp: 0, atk: 0, def: 0, spc: 0, spe: 0 };
      this.ability =
        (this.abilityNum === 1
          ? MONS_LIST[this.dexNum]?.formes[this.formNum]?.ability1
          : this.abilityNum === 2
          ? MONS_LIST[this.dexNum]?.formes[this.formNum]?.ability2
          : MONS_LIST[this.dexNum]?.formes[this.formNum]?.abilityH) ?? 'None';
      this.abilityIndex = Abilities.indexOf(this.ability);
    } else {
      super(new Uint8Array());
    }
  }

  public get format() {
    return 'ohpkm';
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
    const abilityIndex = Abilities.indexOf(value);
    if (abilityIndex > -1) {
      this.abilityIndex = abilityIndex;
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

  public get markings() {
    const markingsValue = bytesToUint16LittleEndian(this.bytes, 0x18);
    return [
      markingsValue & 3,
      (markingsValue >> 2) & 3,
      (markingsValue >> 4) & 3,
      (markingsValue >> 6) & 3,
      (markingsValue >> 8) & 3,
      (markingsValue >> 10) & 3,
    ] as any as [marking, marking, marking, marking, marking, marking];
  }

  public set markings(
    value: [marking, marking, marking, marking, marking, marking]
  ) {
    let markingsValue = 0;
    for (let i = 0; i < 6; i++) {
      let shift = i * 2;
      markingsValue =
        (markingsValue & (0xffff ^ (3 << shift))) | (value[i] << shift);
    }
    this.bytes.set(uint16ToBytesLittleEndian(markingsValue), 0x18);
  }

  public get alphaMove() {
    return bytesToUint16LittleEndian(this.bytes, 0x1a);
  }

  public set alphaMove(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x1a);
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

  public get contestMemoryCount() {
    return this.bytes[0x34];
  }

  public set contestMemoryCount(value: number) {
    this.bytes[0x34] = value;
  }

  public get battleMemoryCount() {
    return this.bytes[0x35];
  }

  public set battleMemoryCount(value: number) {
    this.bytes[0x35] = value;
  }

  public get ribbonBytes() {
    return this.bytes.slice(0x36, 0x4c);
  }

  public set ribbonBytes(value: Uint8Array) {
    this.bytes.set(value.slice(0, 22), 0x36);
  }

  public get ribbons() {
    const ribbons = [];
    const rBytes = this.ribbonBytes;
    for (let byte = 0; byte < 22; byte++) {
      const ribbonsUint8 = rBytes[byte];
      for (let bit = 0; bit < 8; bit++) {
        if (
          ribbonsUint8 & (2 ** bit) &&
          8 * byte + bit < OpenHomeRibbons.length
        ) {
          ribbons.push(OpenHomeRibbons[8 * byte + bit]);
        }
      }
    }
    return ribbons;
  }

  public set ribbons(value: string[]) {
    this.ribbonBytes = new Uint8Array(16);
    value.forEach((ribbon) => {
      const index = OpenHomeRibbons.indexOf(ribbon);
      if (index > 0) {
        setFlag(this.bytes, 0x36, index, true);
      }
    });
  }

  public get sociability() {
    return bytesToUint32LittleEndian(this.bytes, 0x4c);
  }

  public set sociability(value: number) {
    this.bytes.set(uint32ToBytesLittleEndian(value), 0x4c);
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
    const utfBytes = utf16StringToBytes(value, 12);
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
    const ivBytes = bytesToUint32LittleEndian(this.bytes, 0x94);
    return {
      hp: ivBytes & 0x1f,
      atk: (ivBytes >> 5) & 0x1f,
      def: (ivBytes >> 10) & 0x1f,
      spa: (ivBytes >> 15) & 0x1f,
      spd: (ivBytes >> 20) & 0x1f,
      spe: (ivBytes >> 25) & 0x1f,
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

  public get teraTypeOriginal() {
    return this.bytes[0x99];
  }

  public set teraTypeOriginal(value: number) {
    this.bytes[0x99] = value;
  }

  public get teraTypeOverride() {
    return this.bytes[0x9a];
  }

  public set teraTypeOverride(value: number) {
    this.bytes[0x9a] = value;
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
    const utfBytes = utf16StringToBytes(value, 12);
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
    const index = Languages.indexOf(value);
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

  public get shinyLeaves() {
    return this.bytes[0xeb];
  }

  public set shinyLeaves(value: number) {
    this.bytes[0xeb] = value;
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

  public get displayID() {
    return this.gameOfOrigin < 30
      ? this.trainerID
      : bytesToUint32LittleEndian(this.bytes, 0x0c) % 1000000;
  }

  public get languageIndex() {
    return this.bytes[0xf2];
  }

  public get language() {
    return Languages[this.languageIndex];
  }

  public set language(value: string) {
    const index = Languages.indexOf(value);
    if (index > -1) {
      this.bytes[0xf2] = index;
    }
  }

  public get unknownF3() {
    return this.bytes[0xf3];
  }

  public set unknownF3(value: number) {
    this.bytes[0xf3] = value;
  }

  public get formArgument() {
    return bytesToUint32LittleEndian(this.bytes, 0xf4);
  }

  public set formArgument(value: number) {
    this.bytes.set(uint32ToBytesLittleEndian(value), 0xf4);
  }

  public get affixedRibbon() {
    return this.bytes[0xf8];
  }

  public set affixedRibbon(value: number) {
    this.bytes[0xf8] = value;
  }

  public get groundTile() {
    return this.bytes[0x10e];
  }

  public set groundTile(value: number) {
    this.bytes[0x10e] = value;
  }

  public set performance(value: number) {
    this.bytes[0x10f] = value;
  }

  public get performance() {
    return this.bytes[0x10f];
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
    const utfBytes = utf16StringToBytes(value, 12);
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
      textVariables: bytesToUint16LittleEndian(this.bytes, 0x12d),
      feeling: this.bytes[0x12f],
    };
  }

  public set trainerMemory(value: memory) {
    this.bytes[0x12b] = value.intensity;
    this.bytes[0x12c] = value.memory;
    this.bytes.set(uint16ToBytesLittleEndian(value.textVariables), 0x12d);
    this.bytes[0x12f] = value.feeling;
  }

  public get eggDate() {
    return this.bytes[0x130]
      ? {
          month: this.bytes[0x130],
          day: this.bytes[0x131],
          year: this.bytes[0x132],
        }
      : undefined;
  }

  public set eggDate(value: pokedate | undefined) {
    if (value) {
      this.bytes[0x130] = value.year;
      this.bytes[0x131] = value.month;
      this.bytes[0x132] = value.day;
    } else {
      this.bytes[0x130] = 0;
      this.bytes[0x131] = 0;
      this.bytes[0x132] = 0;
    }
  }

  public get metDate() {
    return {
      year: this.bytes[0x133],
      month: this.bytes[0x134],
      day: this.bytes[0x135],
    };
  }

  public set metDate(value: pokedate) {
    console.log(value);
    this.bytes[0x133] = value.year;
    this.bytes[0x134] = value.month;
    this.bytes[0x135] = value.day;
  }

  public get ball() {
    return this.bytes[0x136];
  }

  public set ball(value: number) {
    this.bytes[0x136] = value;
  }

  public get eggLocationIndex() {
    return bytesToUint16LittleEndian(this.bytes, 0x137);
  }

  public set eggLocationIndex(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x137);
  }

  public get eggLocation() {
    return (
      getMetLocation(this.gameOfOrigin, this.eggLocationIndex, false, true) ??
      this.eggLocationIndex.toString()
    );
  }

  public get metLocationIndex() {
    return bytesToUint16LittleEndian(this.bytes, 0x139);
  }

  public set metLocationIndex(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x139);
  }

  public get metLocation() {
    return (
      getMetLocation(this.gameOfOrigin, this.metLocationIndex) ??
      this.metLocationIndex.toString()
    );
  }

  public get metLevel() {
    return this.bytes[0x13c] & ~0x80;
  }

  public set metLevel(value: number) {
    this.bytes[0x13c] = (this.bytes[0x13c] & 0x80) | (value & ~0x80);
  }

  public get trainerGender() {
    return getFlag(this.bytes, 0x13c, 7) ? 1 : 0;
  }

  public set trainerGender(value: number) {
    setFlag(this.bytes, 0x13c, 7, !!value);
  }

  public get hyperTraining() {
    return {
      hp: getFlag(this.bytes, 0x13d, 0),
      atk: getFlag(this.bytes, 0x13d, 1),
      def: getFlag(this.bytes, 0x13d, 2),
      spa: getFlag(this.bytes, 0x13d, 3),
      spd: getFlag(this.bytes, 0x13d, 4),
      spe: getFlag(this.bytes, 0x13d, 5),
    };
  }

  public set hyperTraining(value: hyperTrainStats) {
    setFlag(this.bytes, 0x13d, 0, value.hp);
    setFlag(this.bytes, 0x13d, 1, value.atk);
    setFlag(this.bytes, 0x13d, 2, value.def);
    setFlag(this.bytes, 0x13d, 3, value.spa);
    setFlag(this.bytes, 0x13d, 4, value.spd);
    setFlag(this.bytes, 0x13d, 5, value.spe);
  }

  public get homeTracker() {
    return this.bytes.slice(0x13f, 0x14d + 8);
  }

  public set homeTracker(value: Uint8Array) {
    this.bytes.set(value.slice(0, 8), 0x13f);
  }

  public get TRFlagsSwSh() {
    return this.bytes.slice(0x146, 0x146 + 8);
  }

  public set TRFlagsSwSh(value: Uint8Array) {
    this.bytes.set(value.slice(0, 14), 0x146);
  }

  public get TMFlagsBDSP() {
    return this.bytes.slice(0x154, 0x154 + 14);
  }

  public set TMFlagsBDSP(value: Uint8Array) {
    this.bytes.set(value.slice(0, 14), 0x154);
  }

  public get MoveFlagsLA() {
    return this.bytes.slice(0x162, 0x162 + 14);
  }

  public set MoveFlagsLA(value: Uint8Array) {
    this.bytes.set(value.slice(0, 14), 0x162);
  }

  public get TutorFlagsLA() {
    return this.bytes.slice(0x170, 0x170 + 8);
  }

  public set TutorFlagsLA(value: Uint8Array) {
    this.bytes.set(value.slice(0, 8), 0x170);
  }

  public get MasterFlagsLA() {
    return this.bytes.slice(0x178, 0x178 + 8);
  }

  public set MasterFlagsLA(value: Uint8Array) {
    this.bytes.set(value.slice(0, 8), 0x178);
  }

  public get TMFlagsSV() {
    return this.bytes.slice(0x180, 0x180 + 26);
  }

  public set TMFlagsSV(value: Uint8Array) {
    this.bytes.set(value.slice(0, 26), 0x180);
  }

  public get evsG12() {
    return {
      hp: bytesToUint16LittleEndian(this.bytes, 0x19a),
      atk: bytesToUint16LittleEndian(this.bytes, 0x19c),
      def: bytesToUint16LittleEndian(this.bytes, 0x19e),
      spe: bytesToUint16LittleEndian(this.bytes, 0x1a0),
      spc: bytesToUint16LittleEndian(this.bytes, 0x1a2),
    };
  }

  public set evsG12(value: statsPreSplit) {
    this.bytes.set(uint16ToBytesLittleEndian(value.hp), 0x19a);
    this.bytes.set(uint16ToBytesLittleEndian(value.atk), 0x19c);
    this.bytes.set(uint16ToBytesLittleEndian(value.def), 0x19e);
    this.bytes.set(uint16ToBytesLittleEndian(value.spe), 0x1a0);
    this.bytes.set(uint16ToBytesLittleEndian(value.spc), 0x1a2);
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

  public updateData(other: pkm) {
    if (other.evs) {
      this.evs = other.evs;
    }
    if (other.evsG12) {
      this.evsG12 = other.evsG12;
    }
    if (other.ribbons) {
      this.ribbons = uniq([...this.ribbons, ...other.ribbons]);
    }
    if (other.markings !== undefined) {
      if (!formatHasColorMarkings(other.format)) {
        for (let i = 0; i < other.markings.length; i++) {
          this.markings[i] = (
            other.markings[i] > 0
              ? Math.max(this.markings[i], other.markings[i])
              : 0
          ) as marking;
        }
      } else {
        other.markings.forEach((value, index) => {
          this.markings[index] = value;
        });
      }
    }
  }
}

export default OHPKM;
