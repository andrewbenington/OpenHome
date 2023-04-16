import bigInt from 'big-integer';
import { max } from 'lodash';
import Prando from 'prando';
import {
  AttackCharacteristics,
  DefenseCharacteristics,
  EncounterTypes,
  GameOfOrigin,
  HPCharacteristics,
  HPCharacteristicsPre6,
  RibbonTitles,
  SpecialAtkCharacteristics,
  SpecialDefCharacteristics,
  SpeedCharacteristics,
} from '../../consts';
import { getLocation } from '../../consts/MetLocation/MetLocation';
import { NDex } from '../../consts/NationalDex';
import {
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
  uint16ToBytesLittleEndian,
  uint32ToBytesLittleEndian,
} from '../../util/ByteLogic';
import { getGen3To5Gender } from '../../util/GenderCalc';
import { getUnownLetterGen3 } from './util';

export class PKM {
  static markingCount = 4;
  static markingColors = 1;

  bytes: Uint8Array = new Uint8Array();
  private _format: string = 'PKM';
  public get format(): string {
    return this._format;
  }
  public set format(value: string) {
    this._format = value;
  }

  private _personalityValue?: number;
  public get personalityValue(): number | undefined {
    return this._personalityValue;
  }
  public set personalityValue(value: number | undefined) {
    this._personalityValue = value;
  }
  private _encryptionConstant?: number | undefined;
  public get encryptionConstant(): number | undefined {
    return this._encryptionConstant;
  }
  public set encryptionConstant(value: number | undefined) {
    this._encryptionConstant = value;
  }
  private _sanity: number = 0;
  public get sanity(): number {
    return this._sanity;
  }
  public set sanity(value: number) {
    this._sanity = value;
  }
  private _checksum: number = 0;
  public get checksum(): number {
    return this._checksum;
  }
  public set checksum(value: number) {
    this._checksum = value;
  }

  private _dexNum: number = 0;
  public get dexNum(): number {
    return this._dexNum;
  }
  public set dexNum(value: number) {
    this._dexNum = value;
  }
  private _heldItemIndex: number = 0;
  public get heldItemIndex(): number {
    return this._heldItemIndex;
  }
  public set heldItemIndex(value: number) {
    this._heldItemIndex = value;
  }
  private _heldItem: string = 'None';
  public get heldItem(): string {
    return this._heldItem;
  }
  public set heldItem(value: string) {
    this._heldItem = value;
  }
  private _trainerID: number = 0;
  public get trainerID(): number {
    return this._trainerID;
  }
  public set trainerID(value: number) {
    this._trainerID = value;
  }
  private _secretID: number = 0;
  public get secretID(): number {
    return this._secretID;
  }
  public set secretID(value: number) {
    this._secretID = value;
  }
  private _displayID: number = 0;
  public get displayID(): number {
    return this._displayID;
  }
  // get rid of this
  public set displayID(value: number) {
    this._displayID = value;
  }
  private _exp: number = 0;
  public get exp(): number {
    return this._exp;
  }
  public set exp(value: number) {
    this._exp = value;
  }
  private _level: number = 1;
  public get level(): number {
    return this._level;
  }
  // get rid of this
  public set level(value: number) {
    this._level = value;
  }
  private _ability?: string;
  public get ability(): string | undefined {
    return this._ability;
  }
  public set ability(value: string | undefined) {
    this._ability = value;
  }
  private _abilityNum: number | undefined;
  public get abilityNum(): number | undefined {
    return this._abilityNum;
  }
  public set abilityNum(value: number | undefined) {
    this._abilityNum = value;
  }
  private _abilityIndex: number = 0;
  public get abilityIndex(): number {
    return this._abilityIndex;
  }
  public set abilityIndex(value: number) {
    this._abilityIndex = value;
  }
  private _markings?:
    | [marking, marking, marking, marking, marking, marking]
    | [marking, marking, marking, marking];
  public get markings():
    | [marking, marking, marking, marking, marking, marking]
    | [marking, marking, marking, marking]
    | undefined {
    return this._markings;
  }
  public set markings(
    value:
      | [marking, marking, marking, marking, marking, marking]
      | [marking, marking, marking, marking]
      | undefined
  ) {
    this._markings = value;
  }

  private _favorite: boolean = false;
  public get favorite(): boolean {
    return this._favorite;
  }
  public set favorite(value: boolean) {
    this._favorite = value;
  }

  private _nature?: number | undefined;
  public get nature(): number | undefined {
    return this._nature;
  }
  public set nature(value: number | undefined) {
    this._nature = value;
  }
  private _statNature?: number | undefined;
  public get statNature(): number | undefined {
    return this._statNature;
  }
  public set statNature(value: number | undefined) {
    this._statNature = value;
  }
  private _isFatefulEncounter: boolean = false;
  public get isFatefulEncounter(): boolean {
    return this._isFatefulEncounter;
  }
  public set isFatefulEncounter(value: boolean) {
    this._isFatefulEncounter = value;
  }
  private _gender: number = 2;
  public get gender(): number {
    return this._gender;
  }
  public set gender(value: number) {
    this._gender = value;
  }

  private _formNum: number = 0;
  public get formNum(): number {
    return this._formNum;
  }
  public set formNum(value: number) {
    this._formNum = value;
  }
  private _evs?: stats | undefined;
  public get evs(): stats | undefined {
    return this._evs;
  }
  public set evs(value: stats | undefined) {
    this._evs = value;
  }
  private _evsG12?: statsPreSplit | undefined;
  public get evsG12(): statsPreSplit | undefined {
    return this._evsG12;
  }
  public set evsG12(value: statsPreSplit | undefined) {
    this._evsG12 = value;
  }
  avs?: stats;
  private _contest?: contestStats;
  public get contest(): contestStats | undefined {
    return this._contest;
  }
  public set contest(value: contestStats | undefined) {
    this._contest = value;
  }
  private _pokerusByte: number = 0;
  public get pokerusByte(): number {
    return this._pokerusByte;
  }
  public set pokerusByte(value: number) {
    this._pokerusByte = value;
  }
  private _ribbonBytes: Uint8Array = new Uint8Array(16);
  public get ribbonBytes(): Uint8Array {
    return this._ribbonBytes;
  }

  private _contestMemoryCount: number = 0;
  public get contestMemoryCount(): number {
    return this._contestMemoryCount;
  }
  public set contestMemoryCount(value: number) {
    this._contestMemoryCount = value;
  }

  private _battleMemoryCount: number = 0;
  public get battleMemoryCount(): number {
    return this._battleMemoryCount;
  }
  public set battleMemoryCount(value: number) {
    this._battleMemoryCount = value;
  }

  public set ribbonBytes(value: Uint8Array) {
    this._ribbonBytes = value;
  }
  private _ribbons: string[] = [];
  public get ribbons(): string[] {
    return this._ribbons;
  }
  public set ribbons(value: string[]) {
    this._ribbons = value;
  }

  private _alphaMove?: number | undefined;
  public get alphaMove(): number | undefined {
    return this._alphaMove;
  }
  public set alphaMove(value: number | undefined) {
    this._alphaMove = value;
  }

  private _sociability?: number | undefined;
  public get sociability(): number | undefined {
    return this._sociability;
  }
  public set sociability(value: number | undefined) {
    this._sociability = value;
  }

  private _height: number = 0;
  public get height(): number {
    return this._height;
  }
  public set height(value: number) {
    this._height = value;
  }
  private _weight: number = 0;
  public get weight(): number {
    return this._weight;
  }
  public set weight(value: number) {
    this._weight = value;
  }
  private _scale: number = 0;
  public get scale(): number {
    return this._scale;
  }
  public set scale(value: number) {
    this._scale = value;
  }

  private _nickname: string = 'Bad Egg';
  public get nickname(): string {
    return this._nickname;
  }
  public set nickname(value: string) {
    this._nickname = value;
  }
  private _nicknameBytes: Uint8Array = new Uint8Array(13);
  public get nicknameBytes(): Uint8Array {
    return this._nicknameBytes;
  }
  public set nicknameBytes(value: Uint8Array) {
    this._nicknameBytes = value;
  }
  private _moves: [number, number, number, number] = [0, 0, 0, 0];
  public get moves(): [number, number, number, number] {
    return this._moves;
  }
  public set moves(value: [number, number, number, number]) {
    this._moves = value;
  }
  private _movePP: [number, number, number, number] = [0, 0, 0, 0];
  public get movePP(): [number, number, number, number] {
    return this._movePP;
  }
  public set movePP(value: [number, number, number, number]) {
    this._movePP = value;
  }
  private _movePPUps: [number, number, number, number] = [0, 0, 0, 0];
  public get movePPUps(): [number, number, number, number] {
    return this._movePPUps;
  }
  public set movePPUps(value: [number, number, number, number]) {
    this._movePPUps = value;
  }
  private _relearnMoves?: [number, number, number, number] | undefined;
  public get relearnMoves(): [number, number, number, number] | undefined {
    return this._relearnMoves;
  }
  public set relearnMoves(value: [number, number, number, number] | undefined) {
    this._relearnMoves = value;
  }

  private _currentHP: number = 0;
  public get currentHP(): number {
    return this._currentHP;
  }
  public set currentHP(value: number) {
    this._currentHP = value;
  }
  private _ivs?: stats | undefined;
  public get ivs(): stats | undefined {
    return this._ivs;
  }
  public set ivs(value: stats | undefined) {
    this._ivs = value;
  }
  private _dvs?: statsPreSplit | undefined;
  public get dvs(): statsPreSplit | undefined {
    return this._dvs;
  }
  public set dvs(value: statsPreSplit | undefined) {
    this._dvs = value;
  }
  private _isEgg: boolean = false;
  public get isEgg(): boolean {
    return this._isEgg;
  }
  public set isEgg(value: boolean) {
    this._isEgg = value;
  }
  private _isNicknamed: boolean = false;
  public get isNicknamed(): boolean {
    return this._isNicknamed;
  }
  public set isNicknamed(value: boolean) {
    this._isNicknamed = value;
  }
  private _statusCondition: number = 0;
  public get statusCondition(): number {
    return this._statusCondition;
  }
  public set statusCondition(value: number) {
    this._statusCondition = value;
  }
  private _gvs?: stats | undefined;
  public get gvs(): stats | undefined {
    return this._gvs;
  }
  public set gvs(value: stats | undefined) {
    this._gvs = value;
  }
  private _heightAbsoluteBytes?: Uint8Array;
  public get heightAbsoluteBytes(): Uint8Array | undefined {
    return this._heightAbsoluteBytes;
  }
  public set heightAbsoluteBytes(value: Uint8Array | undefined) {
    this._heightAbsoluteBytes = value;
  }
  private _weightAbsoluteBytes?: Uint8Array;
  public get weightAbsoluteBytes(): Uint8Array | undefined {
    return this._weightAbsoluteBytes;
  }
  public set weightAbsoluteBytes(value: Uint8Array | undefined) {
    this._weightAbsoluteBytes = value;
  }
  private _heightAbsolute?: number;
  public get heightAbsolute(): number | undefined {
    return this._heightAbsolute;
  }
  private _weightAbsolute?: number;
  public get weightAbsolute(): number | undefined {
    return this._weightAbsolute;
  }
  private _teraTypeOriginal?: number | undefined;
  public get teraTypeOriginal(): number | undefined {
    return this._teraTypeOriginal;
  }
  public set teraTypeOriginal(value: number | undefined) {
    this._teraTypeOriginal = value;
  }
  private _teraTypeOverride?: number | undefined;
  public get teraTypeOverride(): number | undefined {
    return this._teraTypeOverride;
  }
  public set teraTypeOverride(value: number | undefined) {
    this._teraTypeOverride = value;
  }

  private _handlerName?: string | undefined;
  public get handlerName(): string | undefined {
    return this._handlerName;
  }
  public set handlerName(value: string | undefined) {
    this._handlerName = value;
  }
  private _handlerNameBytes: Uint8Array = new Uint8Array(13);
  public get handlerNameBytes(): Uint8Array {
    return this._handlerNameBytes;
  }
  public set handlerNameBytes(value: Uint8Array) {
    this._handlerNameBytes = value;
  }
  private _handlerLanguageIndex: number = 0;
  public get handlerLanguageIndex(): number {
    return this._handlerLanguageIndex;
  }
  public set handlerLanguageIndex(value: number) {
    this._handlerLanguageIndex = value;
  }
  private _handlerLanguage?: string | undefined;
  public get handlerLanguage(): string | undefined {
    return this._handlerLanguage;
  }
  public set handlerLanguage(value: string | undefined) {
    this._handlerLanguage = value;
  }
  private _isCurrentHandler?: boolean | undefined;
  public get isCurrentHandler(): boolean | undefined {
    return this._isCurrentHandler;
  }
  public set isCurrentHandler(value: boolean | undefined) {
    this._isCurrentHandler = value;
  }
  private _handlerID?: number | undefined;
  public get handlerID(): number | undefined {
    return this._handlerID;
  }
  public set handlerID(value: number | undefined) {
    this._handlerID = value;
  }
  private _handlerFriendship?: number | undefined;
  public get handlerFriendship(): number | undefined {
    return this._handlerFriendship;
  }
  public set handlerFriendship(value: number | undefined) {
    this._handlerFriendship = value;
  }
  private _handlerMemory?: memory | undefined;
  public get handlerMemory(): memory | undefined {
    return this._handlerMemory;
  }
  public set handlerMemory(value: memory | undefined) {
    this._handlerMemory = value;
  }
  private _handlerAffection?: number | undefined;
  public get handlerAffection(): number | undefined {
    return this._handlerAffection;
  }
  public set handlerAffection(value: number | undefined) {
    this._handlerAffection = value;
  }
  private _resortEventStatus?: number | undefined;
  public get resortEventStatus(): number | undefined {
    return this._resortEventStatus;
  }
  public set resortEventStatus(value: number | undefined) {
    this._resortEventStatus = value;
  }
  private _superTrainingFlags?: number | undefined;
  public get superTrainingFlags(): number | undefined {
    return this._superTrainingFlags;
  }
  public set superTrainingFlags(value: number | undefined) {
    this._superTrainingFlags = value;
  }
  private _superTrainingDistFlags?: number | undefined;
  public get superTrainingDistFlags(): number | undefined {
    return this._superTrainingDistFlags;
  }
  public set superTrainingDistFlags(value: number | undefined) {
    this._superTrainingDistFlags = value;
  }
  private _secretSuperTrainingUnlocked?: boolean | undefined;
  public get secretSuperTrainingUnlocked(): boolean | undefined {
    return this._secretSuperTrainingUnlocked;
  }
  public set secretSuperTrainingUnlocked(value: boolean | undefined) {
    this._secretSuperTrainingUnlocked = value;
  }
  private _secretSuperTrainingComplete?: boolean | undefined;
  public get secretSuperTrainingComplete(): boolean | undefined {
    return this._secretSuperTrainingComplete;
  }
  public set secretSuperTrainingComplete(value: boolean | undefined) {
    this._secretSuperTrainingComplete = value;
  }
  private _trainingBag?: number | undefined;
  public get trainingBag(): number | undefined {
    return this._trainingBag;
  }
  public set trainingBag(value: number | undefined) {
    this._trainingBag = value;
  }
  private _trainingBagHits?: number | undefined;
  public get trainingBagHits(): number | undefined {
    return this._trainingBagHits;
  }
  public set trainingBagHits(value: number | undefined) {
    this._trainingBagHits = value;
  }

  private _pokeStarFame?: number | undefined;
  public get pokeStarFame(): number | undefined {
    return this._pokeStarFame;
  }
  public set pokeStarFame(value: number | undefined) {
    this._pokeStarFame = value;
  }

  private _metTimeOfDay?: number | undefined;
  public get metTimeOfDay(): number | undefined {
    return this._metTimeOfDay;
  }
  public set metTimeOfDay(value: number | undefined) {
    this._metTimeOfDay = value;
  }

  private _isNsPokemon?: boolean | undefined;
  public get isNsPokemon(): boolean | undefined {
    return this._isNsPokemon;
  }
  public set isNsPokemon(value: boolean | undefined) {
    this._isNsPokemon = value;
  }

  private _shinyLeaves?: number | undefined;
  public get shinyLeaves(): number | undefined {
    return this._shinyLeaves;
  }
  public set shinyLeaves(value: number | undefined) {
    this._shinyLeaves = value;
  }
  private _handlerGender?: boolean | undefined;
  public get handlerGender(): boolean | undefined {
    return this._handlerGender;
  }
  public set handlerGender(value: boolean | undefined) {
    this._handlerGender = value;
  }

  private _fullness?: number | undefined;
  public get fullness(): number | undefined {
    return this._fullness;
  }
  public set fullness(value: number | undefined) {
    this._fullness = value;
  }
  private _enjoyment?: number | undefined;
  public get enjoyment(): number | undefined {
    return this._enjoyment;
  }
  public set enjoyment(value: number | undefined) {
    this._enjoyment = value;
  }
  private _gameOfOrigin: number = 0xfe;
  public get gameOfOrigin(): number {
    return this._gameOfOrigin;
  }
  public set gameOfOrigin(value: number) {
    this._gameOfOrigin = value;
  }
  private _gameOfOriginBattle: number = 0xfe;
  public get gameOfOriginBattle(): number {
    return this._gameOfOriginBattle;
  }
  public set gameOfOriginBattle(value: number) {
    this._gameOfOriginBattle = value;
  }
  private _country?: number | undefined;
  public get country(): number | undefined {
    return this._country;
  }
  public set country(value: number | undefined) {
    this._country = value;
  }
  private _region?: number | undefined;
  public get region(): number | undefined {
    return this._region;
  }
  public set region(value: number | undefined) {
    this._region = value;
  }
  private _consoleRegion?: number | undefined;
  public get consoleRegion(): number | undefined {
    return this._consoleRegion;
  }
  public set consoleRegion(value: number | undefined) {
    this._consoleRegion = value;
  }
  private _formArgument?: number | undefined = 0;
  public get formArgument(): number | undefined {
    return this._formArgument;
  }
  public set formArgument(value: number | undefined) {
    this._formArgument = value;
  }
  private _languageIndex: number = 0;
  public get languageIndex(): number {
    return this._languageIndex;
  }
  public set languageIndex(value: number) {
    this._languageIndex = value;
  }
  private _language: string = '';
  public get language(): string {
    return this._language;
  }
  public set language(value: string) {
    this._language = value;
  }

  private _affixedRibbon?: number | undefined;
  public get affixedRibbon(): number | undefined {
    return this._affixedRibbon;
  }
  public set affixedRibbon(value: number | undefined) {
    this._affixedRibbon = value;
  }

  public get affixedRibbonTitle() {
    return this.affixedRibbon !== undefined && this.affixedRibbon !== 0xff
      ? RibbonTitles[this.affixedRibbon]
      : '';
  }
  private _geolocations?:
    | [geolocation, geolocation, geolocation, geolocation, geolocation]
    | undefined;
  public get geolocations():
    | [geolocation, geolocation, geolocation, geolocation, geolocation]
    | undefined {
    return this._geolocations;
  }
  public set geolocations(
    value:
      | [geolocation, geolocation, geolocation, geolocation, geolocation]
      | undefined
  ) {
    this._geolocations = value;
  }

  // Gen4
  private _encounterType?:
    | number
    // HGSS
    | undefined;
  public get encounterType():
    | number
    // HGSS
    | undefined {
    return this._encounterType;
  }
  public set encounterType(
    value:
      | number
      // HGSS
      | undefined
  ) {
    this._encounterType = value;
  }
  // HGSS
  private _performance?: number | undefined;
  public get performance(): number | undefined {
    return this._performance;
  }
  public set performance(value: number | undefined) {
    this._performance = value;
  }
  private _trainerName: string = 'TRAINER';
  public get trainerName(): string {
    return this._trainerName;
  }
  public set trainerName(value: string) {
    this._trainerName = value;
  }
  private _trainerNameBytes: Uint8Array = new Uint8Array(13);
  public get trainerNameBytes(): Uint8Array {
    return this._trainerNameBytes;
  }
  public set trainerNameBytes(value: Uint8Array) {
    this._trainerNameBytes = value;
  }
  private _trainerFriendship: number = 0;
  public get trainerFriendship(): number {
    return this._trainerFriendship;
  }
  public set trainerFriendship(value: number) {
    this._trainerFriendship = value;
  }
  private _trainerMemory?: memory | undefined;
  public get trainerMemory(): memory | undefined {
    return this._trainerMemory;
  }
  public set trainerMemory(value: memory | undefined) {
    this._trainerMemory = value;
  }
  private _trainerAffection?: number | undefined;
  public get trainerAffection(): number | undefined {
    return this._trainerAffection;
  }
  public set trainerAffection(value: number | undefined) {
    this._trainerAffection = value;
  }
  eggDay?: number;
  eggMonth?: number;
  eggYear?: number;
  private _eggDate?: pokedate | undefined;
  public get eggDate(): pokedate | undefined {
    return this._eggDate;
  }
  public set eggDate(value: pokedate | undefined) {
    this._eggDate = value;
  }
  metDay?: number;
  metMonth?: number;
  metYear?: number;
  private _metDate?: pokedate | undefined;
  public get metDate(): pokedate | undefined {
    return this._metDate;
  }
  public set metDate(value: pokedate | undefined) {
    this._metDate = value;
  }
  obedienceLevel?: number;
  private _eggLocationIndex: number = 0;
  public get eggLocationIndex(): number {
    return this._eggLocationIndex;
  }
  public set eggLocationIndex(value: number) {
    this._eggLocationIndex = value;
  }
  private _metLocationIndex?: number;
  public get metLocationIndex(): number | undefined {
    return this._metLocationIndex;
  }
  public set metLocationIndex(value: number | undefined) {
    this._metLocationIndex = value;
  }
  private _ball?: number | undefined;
  public get ball(): number | undefined {
    return this._ball;
  }
  public set ball(value: number | undefined) {
    this._ball = value;
  }
  private _metLevel?: number | undefined;
  public get metLevel(): number | undefined {
    return this._metLevel;
  }
  public set metLevel(value: number | undefined) {
    this._metLevel = value;
  }
  private _trainerGender: number = 0;
  public get trainerGender(): number {
    return this._trainerGender;
  }
  public set trainerGender(value: number) {
    this._trainerGender = value;
  }
  private _hyperTraining?: hyperTrainStats | undefined;
  public get hyperTraining(): hyperTrainStats | undefined {
    return this._hyperTraining;
  }
  public set hyperTraining(value: hyperTrainStats | undefined) {
    this._hyperTraining = value;
  }

  private _homeTracker?: Uint8Array | undefined;
  public get homeTracker(): Uint8Array | undefined {
    return this._homeTracker;
  }
  public set homeTracker(value: Uint8Array | undefined) {
    this._homeTracker = value;
  }

  private _TRFlagsSwSh?: Uint8Array | undefined;
  public get TRFlagsSwSh(): Uint8Array | undefined {
    return this._TRFlagsSwSh;
  }
  public set TRFlagsSwSh(value: Uint8Array | undefined) {
    this._TRFlagsSwSh = value;
  }
  private _TMFlagsBDSP?: Uint8Array | undefined;
  public get TMFlagsBDSP(): Uint8Array | undefined {
    return this._TMFlagsBDSP;
  }
  public set TMFlagsBDSP(value: Uint8Array | undefined) {
    this._TMFlagsBDSP = value;
  }
  private _MoveFlagsLA?: Uint8Array | undefined;
  public get MoveFlagsLA(): Uint8Array | undefined {
    return this._MoveFlagsLA;
  }
  public set MoveFlagsLA(value: Uint8Array | undefined) {
    this._MoveFlagsLA = value;
  }
  private _TutorFlagsLA?: Uint8Array | undefined;
  public get TutorFlagsLA(): Uint8Array | undefined {
    return this._TutorFlagsLA;
  }
  public set TutorFlagsLA(value: Uint8Array | undefined) {
    this._TutorFlagsLA = value;
  }
  private _MasterFlagsLA?: Uint8Array | undefined;
  public get MasterFlagsLA(): Uint8Array | undefined {
    return this._MasterFlagsLA;
  }
  public set MasterFlagsLA(value: Uint8Array | undefined) {
    this._MasterFlagsLA = value;
  }
  private _TMFlagsSV?: Uint8Array | undefined;
  public get TMFlagsSV(): Uint8Array | undefined {
    return this._TMFlagsSV;
  }
  public set TMFlagsSV(value: Uint8Array | undefined) {
    this._TMFlagsSV = value;
  }

  private _stats: stats = {
    hp: 0,
    atk: 0,
    def: 0,
    spa: 0,
    spd: 0,
    spe: 0,
  };
  public get stats(): stats {
    return this._stats;
  }
  public set stats(value: stats) {
    this._stats = value;
  }

  // general flags
  private _isShiny: boolean = false;
  public get isShiny(): boolean {
    return this._isShiny;
  }
  public set isShiny(value: boolean) {
    this._isShiny = value;
  }
  isShadow: boolean = false;

  private _canGigantamax?: boolean | undefined;
  public get canGigantamax(): boolean | undefined {
    return this._canGigantamax;
  }
  public set canGigantamax(value: boolean | undefined) {
    this._canGigantamax = value;
  }
  private _isSquareShiny?: boolean | undefined;
  public get isSquareShiny(): boolean | undefined {
    return this._isSquareShiny;
  }
  public set isSquareShiny(value: boolean | undefined) {
    this._isSquareShiny = value;
  }
  private _dynamaxLevel?: number | undefined;
  public get dynamaxLevel(): number | undefined {
    return this._dynamaxLevel;
  }
  public set dynamaxLevel(value: number | undefined) {
    this._dynamaxLevel = value;
  }

  private _isAlpha?: boolean | undefined;
  public get isAlpha(): boolean | undefined {
    return this._isAlpha;
  }
  public set isAlpha(value: boolean | undefined) {
    this._isAlpha = value;
  }
  private _isNoble?: boolean | undefined;
  public get isNoble(): boolean | undefined {
    return this._isNoble;
  }
  public set isNoble(value: boolean | undefined) {
    this._isNoble = value;
  }

  // PLA Unknowns
  private _flag2LA?: boolean | undefined;
  public get flag2LA(): boolean | undefined {
    return this._flag2LA;
  }
  public set flag2LA(value: boolean | undefined) {
    this._flag2LA = value;
  }
  private _unknownA0?: number | undefined;
  public get unknownA0(): number | undefined {
    return this._unknownA0;
  }
  public set unknownA0(value: number | undefined) {
    this._unknownA0 = value;
  }
  private _unknownF3?: number | undefined;
  public get unknownF3(): number | undefined {
    return this._unknownF3;
  }
  public set unknownF3(value: number | undefined) {
    this._unknownF3 = value;
  }

  public get isNatureFromPersonalityValue() {
    return (
      this.format === 'PK3' ||
      this.format === 'COLOPKM' ||
      this.format === 'XDPKM' ||
      this.format === 'PK4'
    );
  }

  public get isGameBoyOrigin() {
    return (
      this.gameOfOrigin >= GameOfOrigin.Red &&
      this.gameOfOrigin <= GameOfOrigin.Crystal
    );
  }

  public get characteristic() {
    const tiebreaker = this.encryptionConstant ?? this.personalityValue;
    if (!this.ivs || !tiebreaker) return '';
    let stats = ['hp', 'atk', 'def', 'spe', 'spa', 'spd'];
    let maxIV = max(Object.values(this.ivs));
    let lastIndex = tiebreaker % 6 === 0 ? 5 : (tiebreaker % 6) - 1;
    let determiningIV = 'hp';
    for (let i = tiebreaker % 6; i !== lastIndex; i = (i + 1) % 6) {
      if ((this.ivs as any)[stats[i]] === maxIV) {
        determiningIV = stats[i];
        break;
      }
    }
    switch (determiningIV) {
      case 'hp':
        return ['PK1', 'PK2', 'PK3', 'COLOPKM', 'XDPKM', 'PK4', 'PK5'].includes(
          this.format
        )
          ? HPCharacteristicsPre6[maxIV % 5]
          : HPCharacteristics[maxIV % 5];
      case 'atk':
        return AttackCharacteristics[maxIV % 5];
      case 'def':
        return DefenseCharacteristics[maxIV % 5];
      case 'spa':
        return SpecialAtkCharacteristics[maxIV % 5];
      case 'spd':
        return SpecialDefCharacteristics[maxIV % 5];
      default:
        return SpeedCharacteristics[maxIV % 5];
    }
  }

  public get metLocation() {
    if (!this.metLocationIndex) return undefined;
    return getLocation(
      this.gameOfOrigin,
      this.metLocationIndex,
      this.format,
      false
    );
  }

  public get eggLocation() {
    if (!this.eggLocationIndex) return undefined;
    return getLocation(
      this.gameOfOrigin,
      this.eggLocationIndex,
      this.format,
      true
    );
  }

  public get shinyLeafValues() {
    if (!this.shinyLeaves) return undefined;
    return {
      first: !!(this.shinyLeaves & 1),
      second: !!(this.shinyLeaves & 2),
      third: !!(this.shinyLeaves & 4),
      fourth: !!(this.shinyLeaves & 8),
      fifth: !!(this.shinyLeaves & 16),
      crown: !!(this.shinyLeaves & 32),
    };
  }

  public get encounterTypeLabel() {
    if (
      this.encounterType !== undefined &&
      this.gameOfOrigin >= GameOfOrigin.HeartGold &&
      this.gameOfOrigin <= GameOfOrigin.Platinum
    ) {
      return EncounterTypes[this.encounterType];
    }
  }

  constructor(arg: any) {
    if (arg instanceof Uint8Array) {
      this.bytes = arg;
    } else if (arg instanceof PKM) {
    }
  }

  getLevel() {
    return 1;
  }

  getPokerusDays() {
    return this.pokerusByte & 0xf;
  }

  getPokerusStrain() {
    return this.pokerusByte >> 4;
  }

  createPersonalityValueFromOtherPreGen6(
    other: PKM,
    prng: Prando = new Prando()
  ) {
    this.personalityValue =
      other.personalityValue ?? prng.nextInt(0, 0xffffffff);
    let otherNature = other.statNature ?? other.nature;
    // xoring the other three values with this to calculate upper half of personality value
    // will ensure shininess or non-shininess depending on original mon
    let otherGender = other.gender;
    let otherAbilityNum = other.abilityNum ?? 4;
    let i = 0;
    let newPersonalityValue = bigInt(this.personalityValue);
    let shouldCheckUnown = other.dexNum === NDex.UNOWN && this.format === 'PK3';
    while (i < 0x10000) {
      let newGender = getGen3To5Gender(
        newPersonalityValue.toJSNumber(),
        this.dexNum
      );
      let newNature = newPersonalityValue.mod(25).toJSNumber();
      if (
        (!shouldCheckUnown ||
          getUnownLetterGen3(newPersonalityValue.toJSNumber()) ===
            other.formNum) &&
        newGender === otherGender &&
        (otherAbilityNum === 4 ||
          shouldCheckUnown ||
          newPersonalityValue.and(1).add(1).toJSNumber() === otherAbilityNum) &&
        (otherNature === undefined || newNature === otherNature) &&
        getIsShinyPreGen6(
          this.trainerID,
          this.secretID,
          newPersonalityValue.toJSNumber()
        ) === other.isShiny
      ) {
        this.personalityValue = newPersonalityValue.toJSNumber();
        return;
      }
      i++;
      let pvBytes = uint32ToBytesLittleEndian(this.personalityValue);
      let pvLower16, pvUpper16;
      if (other.dexNum === NDex.UNOWN) {
        pvLower16 = prng.nextInt(0, 0xffff);
        pvUpper16 = prng.nextInt(0, 0xffff);
        if (other.isShiny) {
          pvUpper16 =
            ((this.trainerID ^ this.secretID ^ pvLower16) & 0xfcfc) |
            (pvUpper16 & 0x0303);
        }
        const shinyXor = this.trainerID ^ this.secretID ^ pvLower16 ^ pvUpper16;
      } else {
        pvLower16 = bytesToUint16LittleEndian(pvBytes, 0);
        pvUpper16 = bytesToUint16LittleEndian(pvBytes, 2);
        pvLower16 ^= i;
        if (other.isShiny) {
          let shinyXor = other.isSquareShiny ? 0 : 1;
          pvUpper16 = this.trainerID ^ this.secretID ^ pvLower16 ^ shinyXor;
        }
      }
      pvBytes.set(uint16ToBytesLittleEndian(pvUpper16), 2);
      pvBytes.set(uint16ToBytesLittleEndian(pvLower16), 0);
      newPersonalityValue = bigInt(bytesToUint32LittleEndian(pvBytes, 0));
    }
  }
}

export interface pokedate {
  month: number;
  day: number;
  year: number;
}

export interface memory {
  intensity: number;
  memory: number;
  feeling: number;
  textVariables: number;
}

export interface stats {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

export interface statsPreSplit {
  hp: number;
  atk: number;
  def: number;
  spc: number;
  spe: number;
}

export interface hyperTrainStats {
  hp: boolean;
  atk: boolean;
  def: boolean;
  spa: boolean;
  spd: boolean;
  spe: boolean;
}

export interface contestStats {
  cool: number;
  beauty: number;
  cute: number;
  smart: number;
  tough: number;
  sheen: number;
}

export interface geolocation {
  region: number;
  country: number;
}

const getIsShinyPreGen6 = (
  trainerID: number,
  secretID: number,
  personalityValue: number
) =>
  (trainerID ^
    secretID ^
    ((personalityValue >> 16) & 0xffff) ^
    (personalityValue & 0xffff)) <
  8;

// 1 = blue/black, 2 = red
export type marking = 0 | 1 | 2;
