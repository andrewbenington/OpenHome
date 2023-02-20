import { BigInteger } from 'big-integer';
import { RibbonTitles } from 'consts/Ribbons';
import { GameOfOrigin } from '../consts/GameOfOrigin';

export class pkm {
  static markingCount = 4;
  static markingColors = 1;

  bytes: Uint8Array = new Uint8Array();
  private _format: string = 'pkm';
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
  private _ability: string = 'No Ability';
  public get ability(): string {
    return this._ability;
  }
  public set ability(value: string) {
    this._ability = value;
  }
  private _abilityNum: number = 1;
  public get abilityNum(): number {
    return this._abilityNum;
  }
  public set abilityNum(value: number) {
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
    console.log('setting markings', value);
    this._markings = value;
  }

  private _favorite: boolean = false;
  public get favorite(): boolean {
    return this._favorite;
  }
  public set favorite(value: boolean) {
    this._favorite = value;
  }
  private _circleMarking?: marking | undefined;
  public get circleMarking(): marking | undefined {
    return this._circleMarking;
  }
  public set circleMarking(value: marking | undefined) {
    this._circleMarking = value;
  }
  private _squareMarking?: marking | undefined;
  public get squareMarking(): marking | undefined {
    return this._squareMarking;
  }
  public set squareMarking(value: marking | undefined) {
    this._squareMarking = value;
  }
  private _triangleMarking?: marking | undefined;
  public get triangleMarking(): marking | undefined {
    return this._triangleMarking;
  }
  public set triangleMarking(value: marking | undefined) {
    this._triangleMarking = value;
  }
  private _heartMarking?: marking | undefined;
  public get heartMarking(): marking | undefined {
    return this._heartMarking;
  }
  public set heartMarking(value: marking | undefined) {
    this._heartMarking = value;
  }
  public starMarking?: marking;
  public diamondMarking?: marking;

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
  private _contest: contestStats = {
    cool: 0,
    beauty: 0,
    cute: 0,
    smart: 0,
    tough: 0,
    sheen: 0,
  };
  public get contest(): contestStats {
    return this._contest;
  }
  public set contest(value: contestStats) {
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
  isCurrentHandler?: number;
  private _handlerID?: number | undefined;
  public get handlerID(): number | undefined {
    return this._handlerID;
  }
  public set handlerID(value: number | undefined) {
    this._handlerID = value;
  }
  private _handlerMemory?: memory | undefined;
  public get handlerMemory(): memory | undefined {
    return this._handlerMemory;
  }
  public set handlerMemory(value: memory | undefined) {
    this._handlerMemory = value;
  }
  private _shinyLeaves?: number | undefined;
  public get shinyLeaves(): number | undefined {
    return this._shinyLeaves;
  }
  public set shinyLeaves(value: number | undefined) {
    this._shinyLeaves = value;
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
    return this.affixedRibbon ? RibbonTitles[this.affixedRibbon] : ''
  }


  // Gen4
  private _groundTile?: number
    // HGSS
    | undefined;
  public get groundTile(): number
    // HGSS
    | undefined {
    return this._groundTile;
  }
  public set groundTile(value: number
    // HGSS
    | undefined) {
    this._groundTile = value;
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
  private _eggLocation: string = 'a distant land';
  public get eggLocation(): string {
    return this._eggLocation;
  }
  public set eggLocation(value: string) {
    this._eggLocation = value;
  }
  private _eggLocationIndex: number = 0;
  public get eggLocationIndex(): number {
    return this._eggLocationIndex;
  }
  public set eggLocationIndex(value: number) {
    this._eggLocationIndex = value;
  }
  private _metLocation?: string;
  public get metLocation(): string | undefined {
    return this._metLocation;
  }
  public set metLocation(value: string | undefined) {
    this._metLocation = value;
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

  public get isGameBoy() {
    return (
      this.gameOfOrigin >= GameOfOrigin.Red &&
      this.gameOfOrigin <= GameOfOrigin.Crystal
    );
  }

  constructor(arg: any) {
    if (arg instanceof Uint8Array) {
      this.bytes = arg;
    } else if (arg instanceof pkm) {
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

interface markingsFourShapes {
  circle: boolean;
  square: boolean;
  triangle: boolean;
  heart: boolean;
}

interface markingsSixShapes {
  circle: boolean;
  square: boolean;
  triangle: boolean;
  heart: boolean;
  star: boolean;
  diamond: boolean;
}

// 1 = blue/black, 2 = red
export type marking = 0 | 1 | 2;
