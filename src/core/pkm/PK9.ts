import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { ModernRibbons } from '@openhome-core/resources'
import { Errorable, Option, R } from '@openhome-core/util/functional'
import { FourMoves, PKMDate, Stats } from '@openhome-core/util/types'
import {
  AbilityIndex,
  BinaryGender,
  ContestStats,
  ConvertStrategies,
  ConvertStrategy,
  HyperTraining,
  Item,
  Language,
  MarkingsSixShapesColors,
  MetadataSummaryLookup,
  ModernRibbon,
  NatureIndex,
  OriginGame,
  Pk9Wasm,
  PkmFormat,
  PokeDate,
  SpeciesLookup,
  TeraTypeWasm,
  TrainerMemory,
} from '@pkm-rs/pkg'
import { PkmConstructorOptions } from './PKM'
import * as encryption from './util/encryption'
import { convertPokeDate, convertPokeDateOptional } from './wasm/convert'

export default class PK9 {
  format: PkmFormat = 'PK9'

  inner: Pk9Wasm

  constructor(arg: OHPKM | Pk9Wasm, options: PkmConstructorOptions) {
    if (arg instanceof Pk9Wasm) {
      this.inner = arg
    } else {
      const ohpkmBytes = new Uint8Array(arg.toBytes())

      this.inner = Pk9Wasm.fromOhpkmBytes(
        ohpkmBytes,
        options.strategy || ConvertStrategies.getDefault()
      )
    }
  }

  static getFormat(): PkmFormat {
    return 'PK9'
  }

  static getBoxSize() {
    return 344
  }

  static fromBytes(buffer: ArrayBuffer, encrypted?: boolean): PK9 {
    const byteArray = new Uint8Array(buffer)
    return PK9.fromWasm(
      encrypted ? Pk9Wasm.fromEncryptedBytes(byteArray) : Pk9Wasm.fromBytes(byteArray)
    )
  }

  static fromOhpkm(ohpkm: OHPKM, strategy: ConvertStrategy): Errorable<PK9> {
    return R.tryFrom(() => new PK9(ohpkm, { strategy }))
  }

  static fromWasm(pk9: Pk9Wasm): PK9 {
    return new PK9(pk9, {})
  }

  get encryptionConstant() {
    return this.inner.encryption_constant
  }
  set encryptionConstant(value: number) {
    this.inner.encryption_constant = value
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

  get dexNum() {
    return this.inner.nationalDex
  }

  get heldItemIndex() {
    return this.inner.held_item_index
  }
  set heldItemIndex(value: number) {
    this.inner.held_item_index = value
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

  get ability() {
    return this.inner.abilityIndex
  }
  set ability(value: AbilityIndex) {
    this.inner.abilityIndex = AbilityIndex.fromIndex(value.index) || value
  }

  get abilityNum() {
    return this.inner.ability_num
  }
  set abilityNum(value: number) {
    this.inner.ability_num = value
  }

  get markings() {
    return this.inner.markings
  }
  set markings(value: MarkingsSixShapesColors) {
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
  set nature(value: NatureIndex) {
    this.inner.nature = value.copy()
  }

  get statNature() {
    return this.inner.mint_nature.copy()
  }
  set statNature(value: NatureIndex) {
    this.inner.mint_nature = value.copy()
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

  get formNum() {
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

  get contestMemoryCount() {
    return this.inner.contest_memory_count
  }
  set contestMemoryCount(value: number) {
    this.inner.contest_memory_count = value
  }

  get battleMemoryCount() {
    return this.inner.battle_memory_count
  }
  set battleMemoryCount(value: number) {
    this.inner.battle_memory_count = value
  }

  get heightScalar() {
    return this.inner.height_scalar
  }
  set heightScalar(value: number) {
    this.inner.height_scalar = value
  }

  get weightScalar() {
    return this.inner.weight_scalar
  }
  set weightScalar(value: number) {
    this.inner.weight_scalar = value
  }

  get scale() {
    return this.inner.scale
  }
  set scale(value: number) {
    this.inner.scale = value
  }

  get formArgument() {
    return this.inner.form_argument
  }
  set formArgument(value: number) {
    this.inner.form_argument = value
  }

  get nickname() {
    return this.inner.nickname
  }
  set nickname(value: string) {
    this.inner.nickname = value
  }

  get moves() {
    const moves = Array.from(this.inner.move_indices)
    if (moves.length !== 4) {
      throw new Error(`PK9 WASM struct has move array length of ${moves.length} (expected 4)`)
    }

    return moves as FourMoves
  }
  set moves(value: FourMoves) {
    this.inner.move_indices = new Uint16Array(value)
  }

  get movePP() {
    const movePP = Array.from(this.inner.move_pp)
    if (movePP.length !== 4) {
      throw new Error(`PK9 WASM struct has move PP array length of ${movePP.length} (expected 4)`)
    }

    return movePP as FourMoves
  }
  set movePP(value: FourMoves) {
    this.inner.move_pp = new Uint8Array(value)
  }

  get movePPUps() {
    const movePPUps = Array.from(this.inner.move_pp_ups)
    if (movePPUps.length !== 4) {
      throw new Error(
        `PK9 WASM struct has move PP up array length of ${movePPUps.length} (expected 4)`
      )
    }

    return movePPUps as FourMoves
  }
  set movePPUps(value: FourMoves) {
    this.inner.move_pp_ups = new Uint8Array(value)
  }

  get relearnMoves() {
    const relearnMoves = Array.from(this.inner.move_pp_ups)
    if (relearnMoves.length !== 4) {
      throw new Error(
        `PK9 WASM struct has relearn move array length of ${relearnMoves.length} (expected 4)`
      )
    }
    return relearnMoves as FourMoves
  }
  set relearnMoves(value: FourMoves) {
    this.inner.relearn_move_indices = new Uint16Array(value)
  }

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
    return this.inner.is_nicknamed
  }
  set isNicknamed(value: boolean) {
    this.inner.is_nicknamed = value
  }

  get teraTypeOriginal() {
    return this.inner.teraTypeOriginal
  }
  set teraTypeOriginal(value: TeraTypeWasm) {
    this.inner.teraTypeOriginal = value
  }

  get teraTypeOverride() {
    return this.inner.teraTypeOverride
  }
  set teraTypeOverride(value: Option<TeraTypeWasm>) {
    this.inner.teraTypeOverride = value
  }

  get obedienceLevel() {
    return this.inner.obedienceLevel
  }
  set obedienceLevel(value: number) {
    this.inner.obedienceLevel = value
  }

  get handlerName() {
    return this.inner.handler_name
  }
  set handlerName(value: string) {
    this.inner.handler_name = value
  }

  get handlerGender() {
    return this.inner.handler_gender
  }
  set handlerGender(value: BinaryGender) {
    this.inner.handler_gender = value
  }

  get handlerLanguage() {
    return this.inner.handler_language
  }
  set handlerLanguage(value: Option<Language>) {
    this.inner.handler_language = value
  }

  get isCurrentHandler() {
    return this.inner.is_current_handler
  }
  set isCurrentHandler(value: boolean) {
    this.inner.is_current_handler = value
  }

  get handlerFriendship() {
    return this.inner.handler_friendship
  }
  set handlerFriendship(value: number) {
    this.inner.handler_friendship = value
  }

  get trainerName() {
    return this.inner.trainer_name
  }
  set trainerName(value: string) {
    this.inner.trainer_name = value
  }

  get trainerFriendship() {
    return this.inner.trainer_friendship
  }
  set trainerFriendship(value: number) {
    this.inner.trainer_friendship = value
  }

  get eggDate() {
    return convertPokeDateOptional(this.inner.egg_date)
  }

  set eggDate(value: PKMDate | undefined) {
    if (value) {
      this.inner.egg_date = new PokeDate(value.year, value.month, value.day)
    } else {
      this.inner.egg_date = undefined
    }
  }

  get metDate() {
    return convertPokeDate(this.inner.met_date)
  }
  set metDate(value: PKMDate) {
    this.inner.met_date = new PokeDate(value.year, value.month, value.day)
  }

  get eggLocationIndex() {
    return this.inner.egg_location_index
  }
  set eggLocationIndex(value: number) {
    this.inner.egg_location_index = value
  }

  get metLocationIndex() {
    return this.inner.met_location_index
  }
  set metLocationIndex(value: number) {
    this.inner.met_location_index = value
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

  get hyperTraining() {
    return this.inner.hyper_training
  }
  set hyperTraining(value: HyperTraining) {
    this.inner.hyper_training = value
  }

  get gameOfOrigin() {
    return this.inner.game_of_origin
  }
  set gameOfOrigin(value: OriginGame) {
    this.inner.game_of_origin = value
  }

  get gameOfOriginBattle() {
    return this.inner.game_of_origin_battle
  }
  set gameOfOriginBattle(value: Option<OriginGame>) {
    this.inner.game_of_origin_battle = value
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
    return this.inner.ribbons.map((ribbonName) =>
      ribbonName.endsWith('Ribbon') ? ribbonName.substring(0, ribbonName.length - 7) : ribbonName
    )
  }
  set ribbons(ribbonNames: string[]) {
    this.inner.ribbon_indices = new Uint32Array(
      ribbonNames.map((name) => ModernRibbons.indexOf(name)).filter((idx) => idx !== -1)
    )
  }

  get affixedRibbon() {
    return this.inner.affixed_ribbon
  }
  set affixedRibbon(value: Option<ModernRibbon>) {
    this.inner.affixed_ribbon = value
  }

  get handlerMemory() {
    return this.inner.handler_memory
  }
  set handlerMemory(value: TrainerMemory) {
    this.inner.handler_memory = value
  }

  get trainerMemory() {
    return this.inner.trainer_memory
  }
  set trainerMemory(value: TrainerMemory) {
    this.inner.trainer_memory = value
  }

  get trainerGender() {
    return this.inner.trainer_gender
  }
  set trainerGender(value: BinaryGender) {
    this.inner.trainer_gender = value
  }

  get tmFlagsBaseGame() {
    return this.inner.tmFlagsBaseGame
  }

  get tmFlagsDlc() {
    return this.inner.tmFlagsDlc
  }

  get homeTracker() {
    return this.inner.home_tracker
  }
  set homeTracker(value: Option<bigint>) {
    this.inner.home_tracker = value
  }

  getStats() {
    return this.inner.calculateStats()
  }

  // stored stats
  get stats() {
    return this.inner.stats
  }

  get abilityName() {
    return this.inner.abilityIndex.name
  }

  toBytes() {
    return this.inner.toBytes().buffer as ArrayBuffer
  }

  get heldItemName() {
    return Item.fromIndex(this.heldItemIndex)?.name ?? 'None'
  }

  calculateChecksum() {
    return encryption.get16BitChecksumLittleEndian(this.toBytes(), 0x08, 0x148)
  }

  refreshChecksum() {
    this.checksum = encryption.get16BitChecksumLittleEndian(this.toBytes(), 0x08, 0x148)
  }

  toPCBytes() {
    const shuffledBytes = encryption.shuffleBlocksGen89(this.toBytes())
    return encryption.decryptByteArrayGen89(shuffledBytes)
  }

  getLevel() {
    return this.speciesMetadata?.calculateLevel(this.exp) ?? 1
  }

  isShiny() {
    return (
      (this.trainerID ^
        this.secretID ^
        (this.personalityValue & 0xffff) ^
        ((this.personalityValue >> 16) & 0xffff)) <
      16
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
    return MetadataSummaryLookup(this.dexNum, this.formNum)
  }

  public get speciesMetadata() {
    return SpeciesLookup(this.dexNum)
  }

  static maxValidMove() {
    return 919
  }

  static maxValidBall() {
    return 0
  }

  static allowedBalls() {
    return [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
      27,
    ]
  }
}
