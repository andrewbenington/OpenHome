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
  Pk8Wasm,
  PokeDate,
  SpeciesLookup,
  TrainerMemory,
} from '@pkm-rs/pkg'
import { PkmConstructorOptions } from './PKM'
import { convertPokeDate, convertPokeDateOptional } from './wasm/convert'

export default class PK8 {
  static getFormat() {
    return 'PK8' as const
  }
  format = 'PK8' as const

  static getBoxSize() {
    return 344
  }
  inner: Pk8Wasm

  constructor(arg: OHPKM | Pk8Wasm, options: PkmConstructorOptions) {
    if (arg instanceof Pk8Wasm) {
      this.inner = arg
    } else {
      const ohpkmBytes = new Uint8Array(arg.toBytes())

      this.inner = Pk8Wasm.fromOhpkmBytes(
        ohpkmBytes,
        options.strategy || ConvertStrategies.getDefault()
      )
    }
  }

  get encryptionConstant() {
    return this.inner.encryption_constant
  }
  set encryptionConstant(value: number) {
    this.inner.encryption_constant = value
  }

  static fromBytes(buffer: ArrayBuffer, encrypted?: boolean): PK8 {
    const byteArray = new Uint8Array(buffer)
    return PK8.fromWasm(
      encrypted ? Pk8Wasm.fromEncryptedBytes(byteArray) : Pk8Wasm.fromBytes(byteArray)
    )
  }

  static fromOhpkm(ohpkm: OHPKM, strategy: ConvertStrategy): Errorable<PK8> {
    return R.tryFrom(() => new PK8(ohpkm, { strategy }))
  }

  static fromWasm(pk8: Pk8Wasm): PK8 {
    return new PK8(pk8, {})
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

  get canGigantamax() {
    return this.inner.can_gigantamax
  }
  set canGigantamax(value: boolean) {
    this.inner.can_gigantamax = value
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

  get pokerusByte() {
    return this.inner.pokerus_byte
  }
  set pokerusByte(value: number) {
    this.inner.pokerus_byte = value
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

  get sociability() {
    return this.inner.sociability
  }
  set sociability(value: number) {
    this.inner.sociability = value
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
      throw new Error(`PK8 WASM struct has move array length of ${moves.length} (expected 4)`)
    }

    return moves as FourMoves
  }
  set moves(value: FourMoves) {
    this.inner.move_indices = new Uint16Array(value)
  }

  get movePP() {
    const movePP = Array.from(this.inner.move_pp)
    if (movePP.length !== 4) {
      throw new Error(`PK8 WASM struct has move PP array length of ${movePP.length} (expected 4)`)
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
        `PK8 WASM struct has move PP up array length of ${movePPUps.length} (expected 4)`
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
        `PK8 WASM struct has relearn move array length of ${relearnMoves.length} (expected 4)`
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

  get dynamaxLevel() {
    return this.inner.dynamax_level
  }
  set dynamaxLevel(value: number) {
    this.inner.dynamax_level = value
  }

  get palma() {
    return this.inner.palma
  }
  set palma(value: number) {
    this.inner.palma = value
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

  get fullness() {
    return this.inner.fullness
  }
  set fullness(value: number) {
    this.inner.fullness = value
  }

  get enjoyment() {
    return this.inner.enjoyment
  }
  set enjoyment(value: number) {
    this.inner.enjoyment = value
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

  get trFlagsSwSh() {
    return this.inner.trFlagsSwSh
  }

  get homeTracker() {
    return this.inner.home_tracker
  }
  set homeTracker(value: Option<bigint>) {
    this.inner.home_tracker = value
  }

  public getStats() {
    return this.inner.calculateStats()
  }

  // stored stats
  public get stats() {
    return this.inner.stats
  }

  public get abilityName() {
    return this.inner.abilityIndex.name
  }

  public get heldItemName() {
    return Item.fromIndex(this.heldItemIndex)?.name ?? 'None'
  }

  public calculateChecksum() {
    return this.inner.calculateChecksum()
  }

  public recalculateStats() {
    this.inner.recalculateStats()
  }

  public toBytes() {
    return this.inner.toBytes().buffer as ArrayBuffer
  }

  public refreshChecksum() {
    this.checksum = this.calculateChecksum()
  }

  public toPCBytes() {
    return this.inner.toBoxBytesEncrypted()
  }

  public getLevel() {
    return this.inner.calculateLevel()
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
    return 826
  }

  static maxValidBall() {
    return 26
  }
}
