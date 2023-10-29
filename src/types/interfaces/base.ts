import { stats, statsPreSplit } from '../types'

export interface PKMFormData {
  dexNum: number
  formNum: number
}

export interface BasePKMData extends PKMFormData {
  fileSize: number

  markingCount: number
  markingColors: number

  bytes: Uint8Array

  format: string

  heldItemIndex: number

  heldItem: string

  trainerID: number
  secretID: number
  displayID: number

  exp: number
  level: number

  height?: number
  weight?: number
  scale?: number

  nickname: string
  isShiny: boolean

  moves: [number, number, number, number]
  movePP: [number, number, number, number]
  movePPUps: [number, number, number, number]

  currentHP: number

  statusCondition: number

  gameOfOrigin: number

  languageIndex?: number
  language: string

  trainerName: string

  trainerGender: number

  stats: stats | statsPreSplit

  //     public get isNatureFromPersonalityValue() {
  //   return (
  //     this.format === 'PK3' ||
  //     this.format === 'COLOPKM' ||
  //     this.format === 'XDPKM' ||
  //     this.format === 'PK4'
  //   );
  // }

  // public get characteristic() {
  //   const tiebreaker = this.encryptionConstant ?? this.personalityValue;
  //   if (!this.ivs || !tiebreaker) return '';
  //   const statFields = ['hp', 'atk', 'def', 'spe', 'spa', 'spd'];
  //   const maxIV = max(Object.values(this.ivs));
  //   const lastIndex = tiebreaker % 6 === 0 ? 5 : (tiebreaker % 6) - 1;
  //   let determiningIV = 'hp';
  //   for (let i = tiebreaker % 6; i !== lastIndex; i = (i + 1) % 6) {
  //     if ((this.ivs as any)[statFields[i]] === maxIV) {
  //       determiningIV = statFields[i];
  //       break;
  //     }
  //   }
  //   switch (determiningIV) {
  //     case 'hp':
  //       return ['PK1', 'PK2', 'PK3', 'COLOPKM', 'XDPKM', 'PK4', 'PK5'].includes(
  //         this.format
  //       )
  //         ? HPCharacteristicsPre6[maxIV % 5]
  //         : HPCharacteristics[maxIV % 5];
  //     case 'atk':
  //       return AttackCharacteristics[maxIV % 5];
  //     case 'def':
  //       return DefenseCharacteristics[maxIV % 5];
  //     case 'spa':
  //       return SpecialAtkCharacteristics[maxIV % 5];
  //     case 'spd':
  //       return SpecialDefCharacteristics[maxIV % 5];
  //     default:
  //       return SpeedCharacteristics[maxIV % 5];
  //   }
  // }

  // public get metLocation() {
  //   if (!this.metLocationIndex) return undefined;
  //   return getLocation(
  //     this.gameOfOrigin,
  //     this.metLocationIndex,
  //     this.format,
  //     false
  //   );
  // }

  // public get eggLocation() {
  //   if (!this.eggLocationIndex) return undefined;
  //   return getLocation(
  //     this.gameOfOrigin,
  //     this.eggLocationIndex,
  //     this.format,
  //     true
  //   );
  // }

  // public get shinyLeafValues() {
  //   if (!this.shinyLeaves) return undefined;
  //   return {
  //     first: !!(this.shinyLeaves & 1),
  //     second: !!(this.shinyLeaves & 2),
  //     third: !!(this.shinyLeaves & 4),
  //     fourth: !!(this.shinyLeaves & 8),
  //     fifth: !!(this.shinyLeaves & 16),
  //     crown: !!(this.shinyLeaves & 32),
  //   };
  // }

  // public get encounterTypeLabel() {
  //   if (
  //     this.encounterType !== undefined &&
  //     this.gameOfOrigin >= GameOfOrigin.HeartGold &&
  //     this.gameOfOrigin <= GameOfOrigin.Platinum
  //   ) {
  //     return EncounterTypes[this.encounterType];
  //   }
  //   return undefined;
  // }

  // constructor(arg: any) {
  //   if (arg instanceof Uint8Array) {
  //     this.bytes = arg;
  //   }
  // }

  // getLevel() {
  //   return 1;
  // }

  // getPokerusDays() {
  //   return this.pokerusByte & 0xf;
  // }

  // getPokerusStrain() {
  //   return this.pokerusByte >> 4;
  // }
}
