import { Errorable, Option, R } from '@openhome-core/util/functional'
import { FourMoves, PKMDate } from '@openhome-core/util/types'
import {
  BinaryGender,
  ConvertStrategies,
  ConvertStrategy,
  Item,
  Language,
  ModernRibbon,
  NatureIndex,
  OriginGame,
  OriginGames,
  PkhPa9DataWasm,
  PkhPb7DataWasm,
  PkhPk8DataWasm,
  PkhPk9DataWasm,
  PkhWasm,
  PlusMoveFlags,
  PokeDate,
  SpeciesLookup,
} from '@pkm-rs/pkg'
import { OHPKM } from './OHPKM'
import { PkmConstructorOptions } from './PKM'
import { convertPokeDate, convertPokeDateOptional } from './wasm/convert'

export default class PH4 {
  format = 'PH4' as const
  inner: PkhWasm

  constructor(arg: OHPKM | PkhWasm, options: PkmConstructorOptions) {
    if (arg instanceof PkhWasm) {
      this.inner = arg
    } else {
      const ohpkmBytes = new Uint8Array(arg.toBytes())

      this.inner = PkhWasm.fromOhpkmBytes(
        ohpkmBytes,
        options.strategy || ConvertStrategies.getDefault()
      )
    }
  }

  static getFormat() {
    return 'PH4' as const
  }

  static fromBytes(buffer: ArrayBuffer): PH4 {
    const byteArray = new Uint8Array(buffer)
    return PH4.fromWasm(PkhWasm.fromBytes(byteArray))
  }

  static fromOhpkm(ohpkm: OHPKM, strategy: ConvertStrategy): Errorable<PH4> {
    return R.tryFrom(() => new PH4(ohpkm, { strategy }))
  }

  static fromWasm(pkh: PkhWasm): PH4 {
    return new PH4(pkh, {})
  }

  get dataVersion() {
    return this.inner.data_version
  }

  get encryptionSeed() {
    return this.inner.encryption_seed
  }

  get checksum() {
    return this.inner.checksum
  }
  set checksum(value: number) {
    this.inner.checksum = value
  }

  get encodedDataSize() {
    return this.inner.encoded_data_size
  }
  set encodedDataSize(value: number) {
    this.inner.encoded_data_size = value
  }

  get coreDataSize() {
    return this.inner.core_data_size
  }
  set coreDataSize(value: number) {
    this.inner.core_data_size = value
  }

  get gameDataSize() {
    return this.inner.game_data_size
  }
  set gameDataSize(value: number) {
    this.inner.game_data_size = value
  }

  // Core data

  get homeTracker() {
    return this.inner.core_data.home_tracker
  }
  set homeTracker(value: bigint) {
    this.inner.core_data.home_tracker = value
  }

  get encryptionConstant() {
    return this.inner.core_data.encryption_constant
  }
  set encryptionConstant(value: number) {
    this.inner.core_data.encryption_constant = value
  }

  get isBadEgg() {
    return this.inner.core_data.is_bad_egg
  }
  set isBadEgg(value: boolean) {
    this.inner.core_data.is_bad_egg = value
  }

  get nationalDex() {
    return this.inner.core_data.species_and_form.nationalDex
  }

  get formIndex() {
    return this.inner.core_data.species_and_form.formIndex
  }

  get trainerID() {
    return this.inner.core_data.trainer_id
  }
  set trainerID(value: number) {
    this.inner.core_data.trainer_id = value
  }

  get secretID() {
    return this.inner.core_data.secret_id
  }
  set secretID(value: number) {
    this.inner.core_data.secret_id = value
  }

  get exp() {
    return this.inner.core_data.exp
  }
  set exp(value: number) {
    this.inner.core_data.exp = value
  }

  get isFavorite() {
    return this.inner.core_data.is_favorite
  }
  set isFavorite(value: boolean) {
    this.inner.core_data.is_favorite = value
  }

  get markings() {
    return this.inner.markings
  }

  get personalityValue() {
    return this.inner.core_data.personality_value
  }
  set personalityValue(value: number) {
    this.inner.core_data.personality_value = value
  }

  get nature() {
    return this.inner.core_data.nature.copy()
  }
  set nature(value: NatureIndex) {
    this.inner.core_data.nature = value.copy()
  }

  get statNature() {
    return this.inner.core_data.mint_nature.copy()
  }
  set statNature(value: NatureIndex) {
    this.inner.core_data.mint_nature = value.copy()
  }

  get isFatefulEncounter() {
    return this.inner.core_data.is_fateful_encounter
  }
  set isFatefulEncounter(value: boolean) {
    this.inner.core_data.is_fateful_encounter = value
  }

  get gender() {
    return this.inner.core_data.gender
  }
  set gender(value: number) {
    this.inner.core_data.gender = value
  }

  get evs() {
    return this.inner.evs
  }

  get contest() {
    return this.inner.contest
  }

  get ribbons() {
    return this.inner.ribbons
  }

  get contestMemoryCount() {
    return this.inner.core_data.contest_memory_count
  }
  set contestMemoryCount(value: number) {
    this.inner.core_data.contest_memory_count = value
  }

  get battleMemoryCount() {
    return this.inner.core_data.battle_memory_count
  }
  set battleMemoryCount(value: number) {
    this.inner.core_data.battle_memory_count = value
  }

  get heightScalar() {
    return this.inner.core_data.height_scalar
  }
  set heightScalar(value: number) {
    this.inner.core_data.height_scalar = value
  }

  get weightScalar() {
    return this.inner.core_data.weight_scalar
  }
  set weightScalar(value: number) {
    this.inner.core_data.weight_scalar = value
  }

  get nickname() {
    return this.inner.core_data.nickname
  }
  set nickname(value: string) {
    this.inner.core_data.nickname = value
  }

  get currentHP() {
    return this.inner.core_data.current_hp
  }
  set currentHP(value: number) {
    this.inner.core_data.current_hp = value
  }

  get ivs() {
    return this.inner.ivs
  }

  get isEgg() {
    return this.inner.core_data.is_egg
  }

  get isNicknamed() {
    return this.inner.core_data.is_nicknamed
  }
  set isNicknamed(value: boolean) {
    this.inner.core_data.is_nicknamed = value
  }

  get statusCondition() {
    return this.inner.core_data.status_condition
  }
  set statusCondition(value: number) {
    this.inner.core_data.status_condition = value
  }

  get handlerName() {
    return this.inner.core_data.handler_name
  }
  set handlerName(value: string) {
    this.inner.core_data.handler_name = value
  }

  get handlerGender() {
    return this.inner.core_data.handler_gender
  }
  set handlerGender(value: BinaryGender) {
    this.inner.core_data.handler_gender = value
  }

  get handlerLanguage() {
    return this.inner.core_data.handler_language
  }
  set handlerLanguage(value: Option<Language>) {
    this.inner.core_data.handler_language = value
  }

  get isCurrentHandler() {
    return this.inner.core_data.is_current_handler
  }
  set isCurrentHandler(value: boolean) {
    this.inner.core_data.is_current_handler = value
  }

  get handlerFriendship() {
    return this.inner.core_data.handler_friendship
  }
  set handlerFriendship(value: number) {
    this.inner.core_data.handler_friendship = value
  }

  get handlerMemory() {
    return this.inner.handlerMemory
  }

  get gameOfOrigin() {
    return this.inner.core_data.game_of_origin
  }
  set gameOfOrigin(value: OriginGame) {
    this.inner.core_data.game_of_origin = value
  }

  get gameOfOriginBattle() {
    return this.inner.core_data.game_of_origin_battle
  }
  set gameOfOriginBattle(value: Option<OriginGame>) {
    this.inner.core_data.game_of_origin_battle = value
  }

  get language() {
    return this.inner.core_data.language
  }
  set language(value: number) {
    this.inner.core_data.language = value
  }

  get formArgument() {
    return this.inner.core_data.form_argument
  }
  set formArgument(value: number) {
    this.inner.core_data.form_argument = value
  }

  get affixedRibbon() {
    return this.inner.core_data.affixed_ribbon
  }
  set affixedRibbon(value: Option<ModernRibbon>) {
    this.inner.core_data.affixed_ribbon = value
  }

  get trainerName() {
    return this.inner.core_data.trainer_name
  }
  set trainerName(value: string) {
    this.inner.core_data.trainer_name = value
  }

  get trainerFriendship() {
    return this.inner.core_data.trainer_friendship
  }
  set trainerFriendship(value: number) {
    this.inner.core_data.trainer_friendship = value
  }

  get trainerMemory() {
    return this.inner.trainerMemory
  }

  get eggDate() {
    return convertPokeDateOptional(this.inner.core_data.egg_date)
  }

  set eggDate(value: PKMDate | undefined) {
    if (value) {
      this.inner.core_data.egg_date = new PokeDate(value.year, value.month, value.day)
    } else {
      this.inner.core_data.egg_date = undefined
    }
  }

  get metDate() {
    return convertPokeDate(this.inner.core_data.met_date)
  }
  set metDate(value: PKMDate) {
    this.inner.core_data.met_date = new PokeDate(value.year, value.month, value.day)
  }

  get metLevel() {
    return this.inner.core_data.met_level
  }
  set metLevel(value: number) {
    this.inner.core_data.met_level = value
  }

  get trainerGender() {
    return this.inner.core_data.trainer_gender
  }
  set trainerGender(value: BinaryGender) {
    this.inner.core_data.trainer_gender = value
  }

  get hyperTraining() {
    return this.inner.hyperTraining
  }

  get heldItemIndex() {
    return this.inner.core_data.held_item_index
  }
  set heldItemIndex(value: number) {
    this.inner.core_data.held_item_index = value
  }

  // LGPE data

  get avs() {
    return this.inner.avs
  }

  get resortEventStatus() {
    return this.inner.pb7_data?.resort_event_status
  }

  get movesLGPE() {
    if (this.inner.pb7_data) {
      const moves = Array.from(this.inner.pb7_data.moves.indices)
      if (moves.length !== 4) {
        throw new Error(`PKH PB7 WASM struct has move array length of ${moves.length} (expected 4)`)
      }

      return moves as FourMoves
    }
  }

  get movesPpLGPE() {
    if (this.inner.pb7_data) {
      const movesPP = Array.from(this.inner.pb7_data.moves.pp)
      if (movesPP.length !== 4) {
        throw new Error(
          `PKH PB7 WASM struct has move PP array length of ${movesPP.length} (expected 4)`
        )
      }

      return movesPP as FourMoves
    }
  }

  get movesPpUpsLGPE() {
    if (this.inner.pb7_data) {
      const movesPPUps = Array.from(this.inner.pb7_data.moves.pp_ups)
      if (movesPPUps.length !== 4) {
        throw new Error(
          `PKH PB7 WASM struct has move PP Up array length of ${movesPPUps.length} (expected 4)`
        )
      }

      return movesPPUps as FourMoves
    }
  }

  get relearnMovesLGPE() {
    if (this.inner.relearnMovesLgpeWasm) {
      const relearnMoves = Array.from(this.inner.relearnMovesLgpeWasm)
      if (relearnMoves.length !== 4) {
        throw new Error(
          `PKH PB7 WASM struct has relearn move array length of ${relearnMoves.length} (expected 4)`
        )
      }

      return relearnMoves as FourMoves
    }
  }

  get spirit() {
    return this.inner.pb7_data?.spirit
  }

  get mood() {
    return this.inner.pb7_data?.mood
  }

  get rank() {
    return this.inner.pb7_data?.rank
  }

  // TODO: received time, since it is a full timestamp, not just date

  get enjoyment() {
    return this.inner.pb7_data?.enjoyment
  }

  get geoPadding() {
    return this.inner.pb7_data?.geo_padding
  }

  // PK8 data (for Pokemon from SwSh, Bank, GO via GO Transporter, FRLG Switch)

  get canGigantamax() {
    return this.inner.pk8_data?.can_gigantamax
  }

  get sociability() {
    return this.inner.pk8_data?.sociability
  }

  get movesPK8() {
    if (this.inner.pk8_data) {
      const moves = Array.from(this.inner.pk8_data.moves.indices)
      if (moves.length !== 4) {
        throw new Error(`PKH PK8 WASM struct has move array length of ${moves.length} (expected 4)`)
      }

      return moves as FourMoves
    }
  }

  get movesPpPK8() {
    if (this.inner.pk8_data) {
      const movesPP = Array.from(this.inner.pk8_data.moves.pp)
      if (movesPP.length !== 4) {
        throw new Error(
          `PKH PK8 WASM struct has move PP array length of ${movesPP.length} (expected 4)`
        )
      }

      return movesPP as FourMoves
    }
  }

  get movesPpUpsPK8() {
    if (this.inner.pk8_data) {
      const movesPPUps = Array.from(this.inner.pk8_data.moves.pp_ups)
      if (movesPPUps.length !== 4) {
        throw new Error(
          `PKH PK8 WASM struct has move PP Up array length of ${movesPPUps.length} (expected 4)`
        )
      }

      return movesPPUps as FourMoves
    }
  }

  get relearnMovesPK8() {
    if (this.inner.pk8_data) {
      const relearnMoves = Array.from(this.inner.pk8_data.relearn_move_indices)
      if (relearnMoves.length !== 4) {
        throw new Error(
          `PKH PK8 WASM struct has relearn move array length of ${relearnMoves.length} (expected 4)`
        )
      }

      return relearnMoves as FourMoves
    }
  }

  get dynamaxLevel() {
    return this.inner.pk8_data?.dynamax_level
  }

  get trFlagsSwSh() {
    return this.inner.pk8_data?.trFlags
  }

  get palma() {
    return this.inner.pk8_data?.palma
  }

  // PLA data

  get isNoble() {
    return this.inner.pa8_data?.is_noble
  }

  get alphaMove() {
    return this.inner.pa8_data?.alpha_move?.index
  }

  get movesPLA() {
    if (this.inner.movesLa) {
      const moves = Array.from(this.inner.movesLa)
      if (moves.length !== 4) {
        throw new Error(`PKH PA8 WASM struct has move array length of ${moves.length} (expected 4)`)
      }

      return moves as FourMoves
    }
  }

  get movePpPLA() {
    if (this.inner.movePpLa) {
      const movePP = Array.from(this.inner.movePpLa)
      if (movePP.length !== 4) {
        throw new Error(
          `PKH PA8 WASM struct has move PP array length of ${movePP.length} (expected 4)`
        )
      }

      return movePP as FourMoves
    }
  }

  get gvs() {
    return this.inner.gvs
  }

  get tutorFlagsPLA() {
    return this.inner.tutorFlagsLa
  }

  get masteryFlagsPLA() {
    return this.inner.masterFlagsLa
  }

  // BDSP data

  get movesBDSP() {
    if (this.inner.pb8_data) {
      const moves = Array.from(this.inner.pb8_data.moves.indices)
      if (moves.length !== 4) {
        throw new Error(`PKH PB8 WASM struct has move array length of ${moves.length} (expected 4)`)
      }

      return moves as FourMoves
    }
  }

  get movesPpBDSP() {
    if (this.inner.pb8_data) {
      const movesPP = Array.from(this.inner.pb8_data.moves.pp)
      if (movesPP.length !== 4) {
        throw new Error(
          `PKH PB8 WASM struct has move PP array length of ${movesPP.length} (expected 4)`
        )
      }

      return movesPP as FourMoves
    }
  }

  get movesPpUpsBDSP() {
    if (this.inner.pb8_data) {
      const movesPPUps = Array.from(this.inner.pb8_data.moves.pp_ups)
      if (movesPPUps.length !== 4) {
        throw new Error(
          `PKH PB8 WASM struct has move PP Up array length of ${movesPPUps.length} (expected 4)`
        )
      }

      return movesPPUps as FourMoves
    }
  }

  get relearnMovesBDSP() {
    if (this.inner.pb8_data) {
      const relearnMoves = Array.from(this.inner.pb8_data.relearn_move_indices)
      if (relearnMoves.length !== 4) {
        throw new Error(
          `PKH PB8 WASM struct has relearn move array length of ${relearnMoves.length} (expected 4)`
        )
      }

      return relearnMoves as FourMoves
    }
  }

  get tmFlagsBDSP() {
    return this.inner.pb8_data?.tmFlagsBdsp
  }

  // SV data

  get movesSV() {
    if (this.inner.pk9_data) {
      const moves = Array.from(this.inner.pk9_data.moves.indices)
      if (moves.length !== 4) {
        throw new Error(`PKH PK9 WASM struct has move array length of ${moves.length} (expected 4)`)
      }

      return moves as FourMoves
    }
  }

  get movesPpSV() {
    if (this.inner.pk9_data) {
      const movesPP = Array.from(this.inner.pk9_data.moves.pp)
      if (movesPP.length !== 4) {
        throw new Error(
          `PKH PK9 WASM struct has move PP array length of ${movesPP.length} (expected 4)`
        )
      }

      return movesPP as FourMoves
    }
  }

  get movesPpUpsSV() {
    if (this.inner.pk9_data) {
      const movesPPUps = Array.from(this.inner.pk9_data.moves.pp_ups)
      if (movesPPUps.length !== 4) {
        throw new Error(
          `PKH PK9 WASM struct has move PP Up array length of ${movesPPUps.length} (expected 4)`
        )
      }

      return movesPPUps as FourMoves
    }
  }

  get relearnMovesSV() {
    if (this.inner.pk9_data) {
      const relearnMoves = Array.from(this.inner.pk9_data.relearn_move_indices)
      if (relearnMoves.length !== 4) {
        throw new Error(
          `PKH PK9 WASM struct has relearn move array length of ${relearnMoves.length} (expected 4)`
        )
      }

      return relearnMoves as FourMoves
    }
  }

  get teraTypeOriginal() {
    return this.inner.teraTypeOriginal
  }

  get teraTypeOverride() {
    return this.inner.teraTypeOverride
  }

  get tmFlagsSVBaseGame() {
    return this.inner.pk9_data?.tmFlagsBaseGame
  }

  get tmFlagsSVDLC() {
    return this.inner.pk9_data?.tmFlagsDLC
  }

  // ZA data

  get movesLza() {
    if (this.inner.pa9_data) {
      const moves = Array.from(this.inner.pa9_data.move_indices)
      if (moves.length !== 4) {
        throw new Error(`PKH PA9 WASM struct has move array length of ${moves.length} (expected 4)`)
      }

      return moves as FourMoves
    }
  }

  get plusMoveFlags() {
    return this.inner.pa9_data?.plusFlagsLza ?? PlusMoveFlags.empty()
  }

  // Shared game data

  get primaryGameData() {
    if (
      this.inner.pb7_data &&
      (OriginGames.isLetsGo(this.gameOfOrigin) || this.gameOfOrigin === OriginGame.Go)
    ) {
      return this.inner.pb7_data
    } else if (
      this.inner.pk8_data &&
      (OriginGames.isSwSh(this.gameOfOrigin) ||
        this.gameOfOrigin < OriginGame.LetsGoPikachu || // Bank
        this.gameOfOrigin === OriginGame.Go || // GO via GO Transporter
        OriginGames.isFrlgSwitch(this.gameOfOrigin))
    ) {
      return this.inner.pk8_data
    } else if (this.inner.pa8_data && this.gameOfOrigin === OriginGame.LegendsArceus) {
      return this.inner.pa8_data
    } else if (this.inner.pb8_data && OriginGames.isBdsp(this.gameOfOrigin)) {
      return this.inner.pb8_data
    } else if (this.inner.pk9_data && OriginGames.isScarletViolet(this.gameOfOrigin)) {
      return this.inner.pk9_data
    } else if (this.inner.pa9_data && this.gameOfOrigin === OriginGame.LegendsZa) {
      return this.inner.pa9_data
    } else {
      return this.inner.pk8_data
    }
  }

  get moves() {
    if (this.primaryGameData instanceof PkhPa9DataWasm) {
      return this.movesLza
    } else if (this.primaryGameData?.moves) {
      const moves = Array.from(this.primaryGameData?.moves.indices)
      if (moves.length !== 4) {
        throw new Error(`PKH WASM struct has move length of ${moves.length} (expected 4)`)
      }

      return moves as FourMoves
    } else {
      throw new Error('PKH WASM struct has no moves')
    }
  }

  get movePP() {
    if (this.primaryGameData instanceof PkhPa9DataWasm) {
      return Array.from([0, 0, 0, 0])
    }
    const movePP = Array.from(this.primaryGameData?.moves.pp ?? [0, 0, 0, 0])
    if (movePP.length !== 4) {
      throw new Error(`PKH WASM struct has move PP array length of ${movePP.length} (expected 4)`)
    }

    return movePP as FourMoves
  }

  get movePPUps() {
    if (this.primaryGameData instanceof PkhPa9DataWasm) {
      return Array.from([0, 0, 0, 0])
    }
    const movePPUps = Array.from(this.primaryGameData?.moves.pp_ups ?? [0, 0, 0, 0])
    if (movePPUps.length !== 4) {
      throw new Error(
        `PKH WASM struct has move PP Up array length of ${movePPUps.length} (expected 4)`
      )
    }

    return movePPUps as FourMoves
  }

  get ball() {
    return this.primaryGameData?.ball
  }

  get eggLocationIndex() {
    return this.primaryGameData?.egg_location_index
  }

  get metLocationIndex() {
    return this.primaryGameData?.met_location_index
  }

  get ability() {
    return this.inner.abilityIndex
  }

  get abilityNum() {
    return this.primaryGameData?.ability_num
  }

  get fullness() {
    if (
      this.primaryGameData instanceof PkhPb7DataWasm ||
      this.primaryGameData instanceof PkhPk8DataWasm
    ) {
      return this.primaryGameData.fullness
    }
  }

  get pokerus() {
    if (!(
      this.primaryGameData instanceof PkhPk9DataWasm ||
      this.primaryGameData instanceof PkhPa9DataWasm
    )) {
      return this.primaryGameData?.pokerus
    }
  }

  get isAlpha() {
    if (this.inner.pa8_data) {
      return this.inner.pa8_data.is_alpha
    }
    if (this.inner.pa9_data) {
      return this.inner.pa9_data.is_alpha
    }
  }

  get scale() {
    if (this.inner.pa9_data) {
      return this.inner.pa9_data.scale
    }
    if (this.inner.pk9_data) {
      return this.inner.pk9_data.scale
    }
  }

  get obedienceLevel() {
    if (
      this.primaryGameData instanceof PkhPk9DataWasm ||
      this.primaryGameData instanceof PkhPa9DataWasm
    ) {
      return this.primaryGameData.obedience_level
    }
  }

  public get heldItemName() {
    return Item.fromIndex(this.heldItemIndex)?.name ?? 'None'
  }

  toBytes() {
    return this.inner.toBytes().buffer as ArrayBuffer
  }

  getLevel() {
    return this.speciesMetadata?.calculateLevel(this.exp) ?? 1
  }

  getStats() {
    return this.inner.calculateStats()
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

  public get speciesMetadata() {
    return SpeciesLookup(this.nationalDex)
  }

  static maxValidMove() {
    return 920
  }

  static maxValidBall() {
    return 26
  }
}

export var PKH = PH4
