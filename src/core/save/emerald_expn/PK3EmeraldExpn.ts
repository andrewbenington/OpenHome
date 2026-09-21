import { PluginPKMInterface, RomHackFormat } from '@openhome-core/pkm/interfaces'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { PkmConstructorOptions } from '@openhome-core/pkm/PKM'
import { Errorable, Option, R } from '@openhome-core/util/functional'
import { FourMoves, PKMDate, Stats, ToBytesOptions } from '@openhome-core/util/types'
import {
  AbilityIndex,
  Ball,
  BinaryGender,
  ContestStats,
  ConvertStrategies,
  ConvertStrategy,
  ExtraFormIndex,
  Geolocations,
  HyperTraining,
  MarkingsFourShapes,
  MetadataSummaryLookup,
  NatureIndex,
  OriginGame,
  PkmFormat,
  PlusMoveFlags,
  Pokerus,
  ShinyLeaves,
  SpeciesLookup,
  Stats16Le,
  StatsPreSplit,
  TeraType,
  TrainerMemory,
} from '@pkm-rs/pkg'
import { PluginIdentifier } from '../interfaces'
import { Move } from '@openhome-core/resources'
import { MonTag } from '@openhome-ui/util/tags'
import {
  Pk3EExpnWasm
} from '@pkm-rs/pkg/pkm_rs_emerald_expn'

export default abstract class PK3EmeraldExpn implements PluginPKMInterface {
  abstract format: RomHackFormat

  abstract pluginIdentifier: PluginIdentifier
  pluginOrigin?: PluginIdentifier
  extraFormIndex: Option<ExtraFormIndex>
  abstract internalSpeciesIndex: number
  abstract heldItemIndex: number

  pluginForm?: number

  abstract selectColor: string

  abstract getMonFormat(): PkmFormat
  inner: Pk3EExpnWasm

  protected constructor(arg: Pk3EExpnWasm | OHPKM, options: PkmConstructorOptions) {
    if (arg instanceof Pk3EExpnWasm) {
      this.inner = arg
    } else {
      const ohpkmBytes = new Uint8Array(arg.toBytes())

      this.inner = Pk3EExpnWasm.fromOhpkmBytes(
        ohpkmBytes,
        options.strategy || ConvertStrategies.getDefault()
      )
    }
  }
  ability?: AbilityIndex | undefined
  affixedRibbon?: number | undefined
  alphaMove?: number | undefined
  avs?: Stats16Le | undefined
  battleMemoryCount?: number | undefined
  canGigantamax?: boolean | undefined
  consoleRegion?: number | undefined
  contestMemoryCount?: number | undefined
  country?: number | undefined
  dvs?: StatsPreSplit | undefined
  dynamaxLevel?: number | undefined
  eggDate?: PKMDate | undefined
  eggLocationIndex?: number | undefined
  encounterType?: number | undefined
  encryptionConstant?: number | undefined
  enjoyment?: number | undefined
  evsG12?: StatsPreSplit | undefined
  favorite?: boolean | undefined
  flag2LA?: boolean | undefined
  formArgument?: number | undefined
  fullness?: number | undefined
  gameOfOriginBattle?: number | undefined
  geolocations?: Geolocations | undefined
  gvs?: Stats16Le | undefined
  handlerAffection?: number | undefined
  handlerFriendship?: number | undefined
  handlerGender?: BinaryGender | undefined
  handlerID?: number | undefined
  handlerLanguage?: number | undefined
  handlerMemory?: TrainerMemory | undefined
  handlerName?: string | undefined
  heightScalar?: number | undefined
  homeTracker?: bigint | undefined
  hyperTraining?: HyperTraining | undefined
  isAlpha?: boolean | undefined
  isCurrentHandler?: boolean | undefined
  isMega?: number | undefined
  isNoble?: boolean | undefined
  isNsPokemon?: boolean | undefined
  isShadow?: boolean | undefined
  level?: number | undefined
  masterFlagsLA?: Uint8Array<ArrayBufferLike> | undefined
  megaForme?: number | undefined
  metDate?: PKMDate | undefined
  metLocationIndex?: number | undefined
  metTimeOfDay?: number | undefined
  moveFlagsLA?: Uint8Array<ArrayBufferLike> | undefined
  movePP: FourMoves
  movePPUps: FourMoves
  moves: FourMoves
  obedienceLevel?: number | undefined
  palma?: number | undefined
  performance?: number | undefined
  pokeStarFame?: number | undefined
  region?: number | undefined
  relearnMoves?: FourMoves | undefined
  resortEventStatus?: number | undefined
  scale?: number | undefined
  secretSuperTrainingComplete?: boolean | undefined
  secretSuperTrainingUnlocked?: boolean | undefined
  shadowID?: number | undefined
  shinyLeaves?: ShinyLeaves | undefined
  sociability?: number | undefined
  statLevel?: number | undefined
  statNature?: NatureIndex | undefined
  stats?: Stats16Le | undefined
  superTrainingDistFlags?: number | undefined
  superTrainingFlags?: number | undefined
  tags?: MonTag[] | undefined
  teraTypeOriginal?: TeraType | undefined
  teraTypeOverride?: TeraType | undefined
  tmFlagsLzaBase?: Uint8Array<ArrayBufferLike> | undefined
  tmFlagsLzaDlc?: Uint8Array<ArrayBufferLike> | undefined
  tmMovesLza?: Move[] | undefined
  plusMoveFlags?: PlusMoveFlags | undefined
  tmFlagsSV?: Uint8Array<ArrayBufferLike> | undefined
  tmMovesSv?: Move[] | undefined
  tmFlagsSVDLC?: Uint8Array<ArrayBufferLike> | undefined
  tmMovesSVDLC?: Move[] | undefined
  trFlagsSwSh?: Uint8Array<ArrayBufferLike> | undefined
  trMovesSwSh?: Move[] | undefined
  trainerAffection?: number | undefined
  trainerMemory?: TrainerMemory | undefined
  trainingBag?: number | undefined
  trainingBagHits?: number | undefined
  tutorFlagsLA?: Uint8Array<ArrayBufferLike> | undefined
  tutorMovesLa?: Move[] | undefined
  type1?: number | undefined
  type2?: number | undefined
  unknownA0?: number | undefined
  unknownF3?: number | undefined
  weightScalar?: number | undefined
  heightAbsolute?: number | undefined
  heightDeviation?: number | undefined
  weightAbsolute?: number | undefined
  weightDeviation?: number | undefined
  calculateChecksum?: (() => number) | undefined
  originalBytes?: ArrayBuffer | undefined
  toBytes: ((_options?: ToBytesOptions) => ArrayBuffer) | (() => ArrayBuffer)
  isFakemon?: boolean | undefined
  displayColor?: string | undefined

  static fromBytes<T extends PK3EmeraldExpn>(
    this: new (buffer: ArrayBuffer, options: PkmConstructorOptions) => T,
    buffer: ArrayBuffer,
    encrypted?: boolean
  ): T {
    const bytes = new Uint8Array(buffer)
    const pk3ExpnWasm = encrypted
      ? Pk3EExpnWasm.fromEncryptedBytes(bytes)
      : Pk3EExpnWasm.fromBytes(bytes)
    let pk3EExpn: PK3EmeraldExpn = PK3EmeraldExpn.fromWasm(pk3ExpnWasm)
    return pk3EExpn as T
  }

  static fromOhpkm<T extends PK3EmeraldExpn>(
    this: new (ohpkm: OHPKM, options: PkmConstructorOptions) => T,
    ohpkm: OHPKM,
    strategy: ConvertStrategy
  ): Errorable<T> {
    return R.tryFrom(() => new this(ohpkm, { strategy }))
  }

  static fromWasm<T extends PK3EmeraldExpn>(
    this: new (pk3ex: Pk3EExpnWasm, options: PkmConstructorOptions) => T,
    pk3ex: Pk3EExpnWasm
  ): T {
    return new this(pk3ex, {})
  }

  get sanity() {
    return this.inner.sanity
  }
  set sanity(value: number) {
    this.inner.sanity = value
  }

  get checksum() {
    return this.inner.checksum
  }
  set checksum(value: number) {
    this.inner.checksum = value
  }

  get nationalDex() {
    return this.inner.nationalDex
  }
  set nationalDex(value: number) {
    try {
      this.inner.nationalDex = value
    } catch (e) {
      console.error(`invalid dex number ${value} for PK3EXPN: ${e}`)
    }
  }

  get trainerID() {
    return this.inner.trainer_id
  }
  set trainerID(value: number) {
    this.inner.trainer_id = value
  }

  get secretID() {
    return this.inner.secret_id
  }
  set secretID(value: number) {
    this.inner.secret_id = value
  }

  get exp() {
    return this.inner.exp
  }
  set exp(value: number) {
    this.inner.exp = value
  }

  get abilityNum() {
    return this.inner.abilityNum
  }
  set abilityNum(value: number) {
    this.inner.abilityNum = value
  }

  get markings() {
    return this.inner.markings
  }
  set markings(value: MarkingsFourShapes) {
    this.inner.markings = value
  }

  get personalityValue() {
    return this.inner.personality_value
  }
  set personalityValue(value: number) {
    this.inner.personality_value = value
  }

  get nature() {
    return this.inner.nature.copy()
  }

  get isFatefulEncounter() {
    return this.inner.is_fateful_encounter
  }
  set isFatefulEncounter(value: boolean) {
    this.inner.is_fateful_encounter = value
  }

  get gender() {
    return this.inner.gender
  }
  set gender(value: number) {
    this.inner.gender = value
  }

  get formIndex() {
    return this.inner.formIndex
  }

  get evs() {
    return this.inner.evs
  }
  set evs(value: Stats) {
    this.inner.evs = value
  }

  get contest() {
    return this.inner.contest
  }
  set contest(value: ContestStats) {
    this.inner.contest = value
  }

  get pokerusByte() {
    return this.inner.pokerus.toByte()
  }
  set pokerusByte(value: number) {
    this.inner.pokerus = Pokerus.fromByte(value)
  }

  get nickname() {
    return this.inner.nickname
  }
  set nickname(value: string) {
    this.inner.nickname = value // TODO: account for extra two characters
  }

  // TODO: moves(), movePP(), movePPUps()

  get ivs() {
    return this.inner.ivs
  }
  set ivs(value: Stats) {
    this.inner.ivs = value
  }

  get isEgg() {
    return this.inner.is_egg
  }
  set isEgg(value: boolean) {
    this.inner.is_egg = value
  }

  get isNicknamed() {
    return this.inner.isNicknamed
  }

  get trainerName() {
    return this.inner.trainerName
  }
  set trainerName(value: string) {
    this.inner.trainerName = value
  }

  get trainerFriendship() {
    return this.inner.trainer_friendship
  }
  set trainerFriendship(value: number) {
    this.inner.trainer_friendship = value
  }

  get ball() {
    return this.inner.ball
  }
  set ball(value: number) {
    this.inner.ball = value
  }

  get metLevel() {
    return this.inner.met_level
  }
  set metLevel(value: number) {
    this.inner.met_level = value
  }

  get gameOfOrigin() {
    return this.inner.game_of_origin
  }
  set gameOfOrigin(value: OriginGame) {
    this.inner.game_of_origin = value
  }

  get language() {
    return this.inner.language
  }
  set language(value: number) {
    this.inner.language = value
  }

  get statusCondition() {
    return this.inner.status_condition
  }
  set statusCondition(value: number) {
    this.inner.status_condition = value
  }

  get currentHP() {
    return this.inner.current_hp
  }
  set currentHP(value: number) {
    this.inner.current_hp = value
  }

  get ribbons() {
    return this.inner.ribbons.map((ribbonName: string) =>
      ribbonName.endsWith('Ribbon') ? ribbonName.substring(0, ribbonName.length - 7) : ribbonName
    )
  }
  set ribbons(ribbonNames: string[]) {
    this.inner.ribbons = ribbonNames.map((r) => `${r} Ribbon`)
  }

  get trainerGender() {
    return this.inner.trainer_gender
  }
  set trainerGender(value: BinaryGender) {
    this.inner.trainer_gender = value
  }

  get heldItemName() {
    return this.inner.heldItemName ?? 'None'
  }

  public refreshChecksum() {
    this.inner.refreshChecksum()
  }

  // TODO: toPCBytes()

  public getLevel() {
    return this.speciesMetadata?.calculateLevel(this.exp) ?? 1
  }

  public getStats() {
    return this.inner.calculateStats()
  }

  public recalculateStats() {
    this.inner.recalculateStats()
  }

  public toJson() {
    return JSON.parse(this.inner.toJson())
  }

  isShiny() {
    return (
      (this.trainerID ^
        this.secretID ^
        (this.personalityValue & 0xffff) ^
        ((this.personalityValue >> 16) & 0xffff)) <
      8
    )
  }

  isSquareShiny() {
    return !(
      this.trainerID ^
      this.secretID ^
      (this.personalityValue & 0xffff) ^
      ((this.personalityValue >> 16) & 0xffff)
    )
  }

  public get metadata() {
    return MetadataSummaryLookup(this.nationalDex, this.formIndex)
  }

  public get speciesMetadata() {
    return SpeciesLookup(this.nationalDex)
  }

  static maxValidMove() {
    return 919
  }

  static maxValidBall() {
    return Ball.Strange
  }

  getPluginIdentifier(): PluginIdentifier {
    return this.pluginIdentifier
  }

  extraDisplayFields() {
    return {
      'Internal Species Index': this.internalSpeciesIndex,
    }
  }

  abstract getFormat(): RomHackFormat
}
