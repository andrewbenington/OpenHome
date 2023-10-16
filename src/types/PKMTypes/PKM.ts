import {
  contestStats,
  geolocation,
  hyperTrainStats,
  marking,
  memory,
  pokedate,
  stats,
  statsPreSplit,
} from '../types'

export interface PKM {
  fileSize: number

  markingCount: number
  markingColors: number

  bytes: Uint8Array

  format: string

  personalityValue?: number
  encryptionConstant?: number

  sanity?: number
  checksum?: number

  dexNum: number

  heldItemIndex: number

  heldItem: string

  trainerID: number
  secretID: number
  displayID: number

  exp: number
  level: number

  ability?: string
  abilityNum?: number
  abilityIndex?: number

  markings?:
    | [marking, marking, marking, marking, marking, marking]
    | [marking, marking, marking, marking]

  favorite?: boolean

  nature?: number
  statNature?: number

  isFatefulEncounter: boolean

  gender?: number
  formNum: number

  evs?: stats
  evsG12?: statsPreSplit

  avs?: stats
  contest?: contestStats

  pokerusByte?: number

  ribbonBytes?: Uint8Array
  contestMemoryCount?: number
  battleMemoryCount?: number
  ribbons?: string[]

  alphaMove?: number

  sociability?: number

  height?: number
  weight?: number
  scale?: number

  nickname: string
  nicknameBytes?: Uint8Array

  moves: [number, number, number, number]
  movePP: [number, number, number, number]
  movePPUps: [number, number, number, number]
  relearnMoves?: [number, number, number, number]

  currentHP: number
  ivs?: stats

  dvs?: statsPreSplit

  isEgg?: boolean
  isNicknamed?: boolean
  statusCondition: number
  gvs?: stats

  heightAbsoluteBytes?: Uint8Array
  weightAbsoluteBytes?: Uint8Array

  heightAbsolute?: number
  weightAbsolute?: number

  teraTypeOriginal?: number

  teraTypeOverride?: number

  handlerName?: string

  handlerNameBytes?: Uint8Array
  handlerLanguageIndex?: number
  handlerLanguage?: string

  currentHandler?: number

  handlerID?: number

  handlerFriendship?: number

  handlerMemory?: memory

  handlerAffection?: number

  resortEventStatus?: number

  superTrainingFlags?: number

  superTrainingDistFlags?: number

  secretSuperTrainingUnlocked?: boolean

  secretSuperTrainingComplete?: boolean

  trainingBag?: number

  trainingBagHits?: number

  pokeStarFame?: number

  metTimeOfDay?: number

  isNsPokemon?: boolean

  shinyLeaves?: number

  handlerGender?: boolean

  fullness?: number

  enjoyment?: number

  gameOfOrigin: number
  gameOfOriginBattle?: number
  country?: number

  region?: number

  consoleRegion?: number

  formArgument?: number

  languageIndex?: number
  language?: string

  affixedRibbon?: number

  geolocations?: [geolocation, geolocation, geolocation, geolocation, geolocation] | undefined

  // Gen4
  encounterType?:
    | number
    // HGSS
    | undefined

  // HGSS
  performance?: number

  trainerName: string
  trainerFriendship?: number
  trainerMemory?: memory

  trainerAffection?: number

  eggDay?: number

  eggMonth?: number

  eggYear?: number

  eggDate?: pokedate

  metDay?: number

  metMonth?: number

  metYear?: number

  metDate?: pokedate

  obedienceLevel?: number

  eggLocationIndex?: number
  metLocationIndex?: number

  ball?: number

  metLevel?: number

  trainerGender: number
  hyperTraining?: hyperTrainStats

  homeTracker?: Uint8Array

  trFlagsSwSh?: Uint8Array
  tmFlagsBDSP?: Uint8Array
  moveFlagsLA?: Uint8Array
  tutorFlagsLA?: Uint8Array
  masterFlagsLA?: Uint8Array
  tmFlagsSV?: Uint8Array
  tmFlagsSVDLC?: Uint8Array

  stats: stats | statsPreSplit

  // general flags
  isShiny: boolean
  isShadow?: boolean

  canGigantamax?: boolean

  isSquareShiny?: boolean

  dynamaxLevel?: number

  isAlpha?: boolean

  isNoble?: boolean

  // PLA Unknowns
  flag2LA?: boolean

  unknownA0?: number

  unknownF3?: number

  palma?: number

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
