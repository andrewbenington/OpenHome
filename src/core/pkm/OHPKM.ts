import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { intersection, Option, unique } from '@openhome-core/util/functional'
import {
  AbilityIndex,
  AbilityNumber,
  Ball,
  Gender,
  generatePk3CompatiblePid,
  Item,
  Language,
  Lookup,
  MetadataSummaryLookup,
  NatureIndex,
  OriginGames,
  PokeDate,
  ShinyLeaves,
  SpeciesAndForm,
  SpeciesLookup,
  Tag,
  TrainerData,
  TrainerMemory,
  updatePidIfWouldBecomeShinyGen345,
} from '@pkm-rs/pkg'
import { isWasmFormat, WasmPkmFormat } from '@pokemon-files/pkm/PKM'
import {
  AllPKMFields,
  FourMoves,
  getHeightCalculated,
  getStandardPKMStats,
  getWeightCalculated,
  MarkingShape,
  markingsHaveColor,
  Stats,
} from '@pokemon-files/util'
import * as jsTypes from '@pokemon-files/util/types'
import { NationalDex } from '@pokemon-resources/consts/NationalDex'
import { Gen34ContestRibbons, Gen34TowerRibbons } from '@pokemon-resources/index'
import dayjs, { Dayjs } from 'dayjs'
import Prando from 'prando'
import { OhpkmV2 as OhpkmV2Wasm } from '../../../pkm_rs/pkg'
import { PluginIdentifier, SAV } from '../save/interfaces'
import { convertPokeDate, convertPokeDateOptional } from './convert'
import { isEvolution } from './Lookup'
import {
  adjustMovePPBetweenFormats,
  generateIVs,
  getAbilityFromNumber,
  getPrevos,
  ivsFromDVs,
} from './util'

export class OHPKM extends OhpkmV2Wasm implements PKMInterface {
  static getFormat() {
    return 'OHPKM'
  }
  format: 'OHPKM' = 'OHPKM'

  private constructor(arg: Uint8Array | AllPKMFields) {
    if (arg instanceof Uint8Array) {
      super(arg)
    } else {
      const other = arg
      super(new Uint8Array())

      let prng: Prando

      if (other.personalityValue !== undefined && other.secretID !== undefined) {
        prng = new Prando(
          other.trainerName
            .concat(other.personalityValue.toString())
            .concat(other.secretID.toString())
            .concat(other.trainerID.toString())
        )

        if (other.format === 'PK3' || other.format === 'PK4' || other.format === 'PK5') {
          this.personalityValue = updatePidIfWouldBecomeShinyGen345(
            other.personalityValue,
            other.trainerID,
            other.secretID
          )
        } else {
          this.personalityValue = other.personalityValue
        }
      } else if (other.dvs) {
        const { hp, atk, def, spc, spe } = other.dvs

        prng = new Prando(
          other.trainerName
            .concat(`${hp}~${atk}~${def}~${spc}~${spe}`)
            .concat(other.trainerID.toString())
        )

        this.personalityValue = this.generatePk3CompatiblePid()
      } else {
        prng = new Prando(other.trainerName.concat(other.trainerID.toString()))
      }

      this.speciesAndForm = new SpeciesAndForm(other.dexNum, other.formNum)
      this.extraFormIndex = other.extraFormIndex

      if (other.personalityValue === undefined) {
        this.encryptionConstant = 0
      } else {
        this.encryptionConstant = other.encryptionConstant ?? this.personalityValue
      }

      this.heldItemIndex = other.heldItemIndex
      this.trainerName = other.trainerName
      this.trainerGender = other.trainerGender
      this.trainerID = other.trainerID
      this.secretID = other.secretID
      this.exp = other.exp

      this.moves = other.moves as FourMoves
      this.movePP = adjustMovePPBetweenFormats(this, other)
      this.movePPUps = other.movePPUps as FourMoves

      this.nickname = other.nickname
      if (this.nicknameMatchesSpeciesIgnoreCase()) {
        this.resetNicknameToSpecies()
      }

      this.language = other.language
      this.gameOfOrigin = other.gameOfOrigin
      this.gameOfOriginBattle = other.gameOfOriginBattle
      this.pluginOrigin = other.pluginOrigin
      this.isEgg = other.isEgg ?? false
      this.pokerusByte = other.pokerusByte ?? 0
      this.trainerFriendship = other.trainerFriendship ?? 40

      this.isFatefulEncounter = other.isFatefulEncounter ?? false

      if (other.format === 'PK1' || other.format === 'PK2') {
        this.abilityNum = 4 // hidden ability for GB mons to mirror virtual console + pokemon bank
        if (other.dexNum === NationalDex.Mew || other.dexNum === NationalDex.Celebi) {
          this.isFatefulEncounter = true
        }
        this.gender =
          other.gender ??
          (other.dvs
            ? this.metadata?.genderFromAtkDv(other.dvs.atk)
            : this.metadata?.genderFromPid(this.personalityValue)) ??
          Gender.Genderless
      } else {
        this.abilityNum = other.abilityNum ?? 0
        this.gender =
          other.gender ?? this.metadata?.genderFromPid(this.personalityValue) ?? Gender.Genderless
      }

      this.nature = other.nature ?? NatureIndex.newFromPid(this.personalityValue)

      this.ivs = other.ivs ?? (other.dvs !== undefined ? ivsFromDVs(other.dvs) : generateIVs(prng))

      if (other.evs) {
        this.evs = other.evs
      }

      if (other.contest) {
        this.contest = other.contest
      }

      this.ball = other.ball !== undefined ? other.ball : Ball.Poke
      this.markings = jsTypes.markingsSixShapesWithColorFromOther(other.markings)

      this.metLocationIndex = other.metLocationIndex ?? 0
      this.metLevel = other.metLevel ?? 0

      if (other.dvs && other.evsG12) {
        this.setGameboyData(other.dvs, other.metTimeOfDay ?? 0, other.evsG12)
      }

      this.metLocationIndex = other.metLocationIndex ?? 0
      this.ability =
        other.ability ??
        getAbilityFromNumber(this.dexNum, this.formNum, this.abilityNum) ??
        this.ability

      this.isShadow = other.isShadow ?? false

      if (other.metDate) {
        this.metDate = other.metDate
      } else {
        const now = new Date()

        this.metDate = {
          month: now.getMonth() + 1,
          day: now.getDate(),
          year: now.getFullYear(),
        }
      }

      // Gen 4+
      this.isNicknamed = other.isNicknamed ?? true
      if (this.nicknameMatchesSpecies()) {
        this.isNicknamed = false
      }

      this.eggDate = other.eggDate
      this.eggLocationIndex = other.eggLocationIndex

      this.encounterType = other.encounterType

      this.shinyLeaves = other.shinyLeaves
      this.performance = other.performance

      // Gen 5+
      this.pokeStarFame = other.pokeStarFame
      this.isNsPokemon = !!other.isNsPokemon

      // Gen 6+
      this.contestMemoryCount = other.contestMemoryCount ?? 0
      this.battleMemoryCount = other.battleMemoryCount ?? 0
      this.relearnMoves = other.relearnMoves ?? [0, 0, 0, 0]

      if (other.handlerName) {
        this.handlerName = other.handlerName ?? ''
        this.handlerGender = other.handlerGender ?? false
        this.isCurrentHandler = other.isCurrentHandler ?? false
        this.handlerFriendship = other.handlerFriendship ?? 0
        if (other.handlerMemory) {
          this.handlerMemory = other.handlerMemory
        }
      }

      if ('ribbons' in other) {
        const contestRibbons = intersection(other.ribbons, Gen34ContestRibbons)

        this.contestMemoryCount = Math.max(contestRibbons.length, this.contestMemoryCount)
        const battleRibbons = intersection(other.ribbons, Gen34TowerRibbons)

        this.battleMemoryCount = Math.max(battleRibbons.length, this.battleMemoryCount)
        this.ribbons = other.ribbons?.map((r) => r + ' Ribbon') ?? []
      }

      if (other.trainerMemory) {
        this.trainerMemory = other.trainerMemory
      }

      if (this.contestMemoryCount) {
        this.ribbons.push('Contest Memory')
      }
      if (this.battleMemoryCount) {
        this.ribbons.push('Battle Memory')
      }

      this.handlerAffection = other.handlerAffection ?? 0
      this.superTrainingFlags = other.superTrainingFlags
      this.superTrainingDistFlags = other.superTrainingDistFlags
      this.secretSuperTrainingUnlocked = other.secretSuperTrainingUnlocked
      this.secretSuperTrainingComplete = other.secretSuperTrainingComplete
      this.country = other.country
      this.region = other.region
      this.consoleRegion = other.consoleRegion ?? 0
      this.formArgument = other.formArgument ?? 0

      this.geolocations = other.geolocations

      this.trainerAffection = other.trainerAffection ?? 0

      this.trainingBagHits = other.trainingBagHits
      this.trainingBag = other.trainingBag

      this.fullness = other.fullness ?? 0
      this.enjoyment = other.enjoyment ?? 0

      if (other.hyperTraining) {
        this.hyperTraining = other.hyperTraining
      }

      if (other.heightScalar !== undefined && other.weightScalar !== undefined) {
        this.heightScalar = other.heightScalar
        this.weightScalar = other.weightScalar
      }

      this.resortEventStatus = other.resortEventStatus
      this.avs = other.avs

      this.handlerLanguage = other.handlerLanguage ?? 0
      this.statNature = other.statNature !== undefined ? other.statNature : this.nature
      this.affixedRibbon = other.affixedRibbon
      this.homeTracker = other.homeTracker ?? undefined

      if (other.obedienceLevel !== undefined) {
        this.obedienceLevel = other.obedienceLevel
      }

      this.sociability = other.sociability ?? 0

      this.dynamaxLevel = other.dynamaxLevel
      this.canGigantamax = other.canGigantamax

      this.palma = other.palma
      this.trFlagsSwSh = other.trFlagsSwSh

      this.tmFlagsBDSP = other.tmFlagsBDSP

      this.isAlpha = other.isAlpha || this.ribbons.includes('Alpha Mark')
      if (other.isAlpha && !this.ribbons.includes('Alpha Mark')) {
        this.ribbons = [...this.ribbons, 'Alpha Mark']
      }
      this.isNoble = other.isNoble ?? false
      this.alphaMove = other.alphaMove ?? 0
      this.gvs = other.gvs

      this.moveFlagsLA = other.moveFlagsLA
      this.tutorFlagsLA = other.tutorFlagsLA
      this.masterFlagsLA = other.masterFlagsLA
      this.flag2LA = other.flag2LA
      this.unknownA0 = other.unknownA0
      this.unknownF3 = other.unknownF3

      if (other.heightScalar !== undefined && other.weightScalar !== undefined) {
        this.heightScalar = other.heightScalar
        this.weightScalar = other.weightScalar
      }

      this.scale = other.scale ?? other.heightScalar ?? 127

      this.teraTypeOverride = other.teraTypeOverride ?? 19
      this.setTeraTypeOriginalIf(other.teraTypeOriginal)

      this.tmFlagsSV = other.tmFlagsSV
      this.tmFlagsSVDLC = other.tmFlagsSVDLC

      if (other.originalBytes) {
        const tag = monFormatToOriginalDataTag(other.format)
        if (tag) {
          try {
            this.trySetOriginalData(tag, new Uint8Array(other.originalBytes))
          } catch (e) {
            console.error('Failed to set original data from bytes', e)
          }
        } else {
          console.error(
            `No original data tag found for format ${other.format}, cannot set original bytes on OHPKM`
          )
        }
      }
    }
  }

  // static constructors

  static fromBytes(buffer: ArrayBufferLike): OHPKM {
    return new OHPKM(new Uint8Array(buffer))
  }

  static fromMonInSave(mon: PKMInterface, save: SAV): OHPKM {
    const ohpkm = OHPKM.fromMonUnknownSave(mon)
    ohpkm.syncWithGameData(mon, save)

    return ohpkm
  }

  static fromMonUnknownSave(mon: PKMInterface): OHPKM {
    const ohpkm = isWasmFormat(mon) ? OHPKM.fromWasmImpl(mon) : new OHPKM(mon)

    return ohpkm
  }

  static defaultWithSpecies(nationalDex: number, formIndex: number) {
    const bytes = OhpkmV2Wasm.defaultWithSpecies(nationalDex, formIndex).toByteArray()
    return OHPKM.fromBytes(bytes.buffer)
  }

  private static fromWasmImpl(mon: WasmPkmFormat): OHPKM {
    return new OHPKM(mon.inner.toOhpkm().toByteArray())
  }

  // getters / setters

  get dexNum() {
    return this.speciesAndForm.nationalDex
  }

  get ability() {
    return this.abilityIndex
  }
  set ability(value: AbilityIndex) {
    this.abilityIndex = value
  }

  get formNum() {
    return this.speciesAndForm.formIndex
  }

  get moves() {
    const values = Array.from(this.movesWasm)
    if (values.length !== 4) throw Error('move array length != 4')
    return values as FourMoves
  }
  set moves(value: FourMoves) {
    this.movesWasm = new Uint16Array(value)
  }

  get movePP() {
    const values = Array.from(this.movePpWasm)
    if (values.length !== 4) throw Error('move pp array length != 4')
    return values as FourMoves
  }
  set movePP(value: FourMoves) {
    this.movePpWasm = new Uint8Array(value)
  }

  get movePPUps() {
    const values = Array.from(this.movePpUpsWasm)
    if (values.length !== 4) throw Error('move pp up array length != 4')
    return values as FourMoves
  }
  set movePPUps(value: FourMoves) {
    this.movePpUpsWasm = new Uint8Array(value)
  }

  get relearnMoves() {
    const values = Array.from(this.relearnMovesWasm)
    if (values.length !== 4) throw Error('relearn move array length != 4')
    return values as FourMoves
  }
  set relearnMoves(value: FourMoves) {
    this.relearnMovesWasm = new Uint16Array(value)
  }

  get eggDate() {
    return convertPokeDateOptional(this.eggDateWasm)
  }
  set eggDate(value: jsTypes.PKMDate | undefined) {
    if (value) {
      this.eggDateWasm = new PokeDate(value.year, value.month, value.day)
    } else {
      this.eggDateWasm = undefined
    }
  }

  get metDate() {
    return convertPokeDate(this.metDateWasm)
  }
  set metDate(value: jsTypes.PKMDate) {
    this.metDateWasm = new PokeDate(value.year, value.month, value.day)
  }

  get shinyLeaves() {
    return this.shinyLeavesWasm
  }
  set shinyLeaves(value: ShinyLeaves | undefined) {
    this.shinyLeavesWasm = value
  }

  get pluginOrigin() {
    return this.pluginOriginWasm as Option<PluginIdentifier>
  }

  set pluginOrigin(origin: Option<PluginIdentifier>) {
    this.pluginOriginWasm = origin
  }

  get startedTrackingTimestamp() {
    const timestampSeconds = this.startedTrackingSeconds
    return timestampSeconds ? dayjs.unix(Number(timestampSeconds)) : undefined
  }

  set startedTrackingTimestamp(timestamp: Option<Dayjs>) {
    if (timestamp) {
      this.startedTrackingSeconds = BigInt(timestamp.unix())
    }
  }

  // derived fields

  public get heightAbsolute(): number {
    return getHeightCalculated(this)
  }

  public get weightAbsolute(): number {
    return getWeightCalculated(this)
  }

  public get abilityName() {
    return this.ability.name
  }

  public get heldItemName() {
    return Item.fromIndex(this.heldItemIndex)?.name ?? 'None'
  }

  public getLevel(): number {
    return this.speciesMetadata?.calculateLevel(this.exp) ?? 1
  }

  public getStats(): Stats {
    return getStandardPKMStats(this)
  }

  public toBytes() {
    return this.toByteArray().buffer as ArrayBuffer
  }

  public isShiny() {
    return this.isShinyWasm()
  }

  public isSquareShiny() {
    return this.isSquareShinyWasm()
  }

  public clone() {
    return new OHPKM(this.toByteArray())
  }

  public updateTrainerData(
    save: SAV,
    friendship: number,
    affection: number,
    memory?: TrainerMemory
  ): boolean {
    return this.registerHandler(
      new TrainerData(
        save.tid,
        save.sid ?? 0,
        save.name,
        friendship,
        memory,
        affection,
        save.trainerGender,
        save.language ?? Language.None,
        save.origin
      ),
      save.isPlugin ? save.pluginIdentifier : undefined
    )
  }

  public isFrom(save: SAV) {
    return (
      this.trainerID === save.tid &&
      save.origin === this.gameOfOrigin &&
      (save.sid === undefined || save.sid === this.secretID)
    )
  }

  public tradeToSave(save: SAV) {
    this.tradeToSaveWasm(save.origin)

    const isOriginalSave = this.isFrom(save)
    console.debug(
      { isOriginalSave, ohpkm_id: this.openhomeId, event: 'trade_to_save' },
      'Traded Pokémon to save file'
    )
    this.isCurrentHandler = !isOriginalSave
    if (isOriginalSave) {
      this.handlerName = ''
      this.handlerAffection = 0
      this.handlerFriendship = 0
      this.handlerMemory = { intensity: 0, memory: 0, feeling: 0, textVariables: 0 }
      this.handlerId = 0
      this.handlerLanguage = 0
      this.handlerGender = false
      return
    }

    this.handlerName = save.name

    const existingTrainerData = this.findKnownHandler(save.tid, save.sid ?? 0, save.origin)

    if (existingTrainerData) {
      this.updateTrainerData(
        save,
        existingTrainerData.friendship,
        existingTrainerData.affection,
        existingTrainerData.memory
      )
    } else {
      this.handlerFriendship = 70 // TODO: PER-FORM BASE FRIENDSHIP
      this.updateTrainerData(save, 70, 0)
    }
  }

  public setRecentSave(save: SAV): void {
    this.setRecentSaveWasm(save.origin, save.tid, save.sid ?? 0, save.name, save.filePath.raw)
  }

  static maxValidMove() {
    return 728
  }

  public get stats(): Stats {
    return getStandardPKMStats(this)
  }

  public get currentHP(): number {
    return this.stats.hp
  }

  public get metadata() {
    return MetadataSummaryLookup(this.dexNum, this.formNum)
  }

  public get speciesMetadata() {
    return SpeciesLookup(this.dexNum)
  }
  public syncWithGameData(other: PKMInterface, save?: SAV) {
    const updates: SyncUpdate[] = []

    if (other.exp !== this.exp) {
      updates.push(syncUpdate('experience', this.exp, other.exp))
      this.exp = other.exp
    }

    if (!arraysEqual(this.moves, other.moves)) {
      updates.push(syncUpdate('moves', this.moves, other.moves))
      this.moves = other.moves
    }
    if (!arraysEqual(this.movePP, other.movePP)) {
      updates.push(syncUpdate('move PP', this.movePP, other.movePP))
      this.movePP = adjustMovePPBetweenFormats(this, other)
    }
    if (!arraysEqual(this.movePPUps, other.movePPUps)) {
      updates.push(syncUpdate('move PP ups', this.movePPUps, other.movePPUps))
      this.movePPUps = other.movePPUps
    }

    const hasEvolved = this.dexNum !== other.dexNum && isEvolution(this, other)
    const changedForm =
      this.dexNum === other.dexNum &&
      (this.formNum !== other.formNum || this.extraFormIndex !== other.extraFormIndex)

    if (hasEvolved || changedForm) {
      this.speciesAndForm = new SpeciesAndForm(other.dexNum, other.formNum)
      this.extraFormIndex = other.extraFormIndex
    }

    if (hasEvolved) {
      updates.push(syncUpdateMessage(`${this.nickname} evolved!`, this.movePPUps, other.movePPUps))
    } else if (changedForm) {
      updates.push(syncUpdate(`${this.nickname} changed form!`, this.movePPUps, other.movePPUps))
    }

    // Don't update nickname if the only difference is that it's a truncated version of the original
    if (
      other.nickname !== this.nickname &&
      other.nickname !== this.nickname.slice(0, 10) &&
      !isPrevoOrCurrentSpeciesName(this.dexNum, this.formNum, other.nickname, this.language)
    ) {
      updates.push(syncUpdate('nickname', this.nickname, other.nickname))
      this.nickname = other.nickname
    }

    if (isPrevoOrCurrentSpeciesName(this.dexNum, this.formNum, this.nickname, this.language)) {
      this.nickname = Lookup.speciesName(this.dexNum, this.language)
    }

    if (this.heldItemIndex !== other.heldItemIndex) {
      updates.push(syncUpdate('held item', this.heldItemIndex, other.heldItemIndex))
      this.heldItemIndex = other.heldItemIndex
    }

    if (
      FORMATS_ALLOWING_ABILITY_CHANGE.includes(other.format) &&
      other.ability &&
      !FORMATS_WITHOUT_ABILITIES.includes(other.format)
    ) {
      // don't update if OHPKM has hidden ability and the other mon is from
      // a game without hidden abilities
      if (
        !this.ability ||
        this.ability?.index !== this.metadata?.hiddenAbility?.index ||
        !FORMATS_WITHOUT_HIDDEN_ABILITIES.includes(other.format)
      ) {
        if (this.ability?.index !== other.ability.index) {
          updates.push(syncUpdate('ability', this.ability.index, other.ability.index))
          this.ability = other.ability
        }
        if (other.abilityNum && this.abilityNum !== other.abilityNum) {
          updates.push(syncUpdate('ability number', this.abilityNum, other.abilityNum))
          this.abilityNum = other.abilityNum
        }
      }
    }

    if (other.avs && !deepEqual(this.avs, other.avs)) {
      updates.push(syncUpdate('AVs', this.avs, other.avs))
      this.avs = other.avs
    }

    if (other.evs && !deepEqual(this.evs, other.evs)) {
      updates.push(syncUpdate('EVs', this.evs, other.evs))
      this.evs = other.evs
    }
    if (other.evsG12 && !deepEqual(this.evsG12, other.evsG12)) {
      updates.push(syncUpdate('EVs (gen 1-2)', this.evsG12, other.evsG12))
      this.evsG12 = other.evsG12
    }
    if (other.hyperTraining && !deepEqual(this.hyperTraining, other.hyperTraining)) {
      updates.push(syncUpdate('hyper training', this.hyperTraining, other.hyperTraining))
      this.hyperTraining = other.hyperTraining
    }

    const prevRibbons = this.ribbons
    this.ribbons = unique([...this.ribbons, ...(other.ribbons ?? [])])
    if (!arraysEqual(prevRibbons, this.ribbons)) {
      updates.push(syncUpdate('ribbons', prevRibbons, this.ribbons))
    }

    if (other.contest && !deepEqual(this.contest, other.contest)) {
      updates.push(syncUpdate('contest stats', this.contest, other.contest))
      this.contest = other.contest
    }

    const otherMarkings = other.markings
    if (otherMarkings && markingsHaveColor(otherMarkings)) {
      if (!deepEqual(this.markings, otherMarkings)) {
        updates.push(syncUpdate('markings', this.markings, otherMarkings))
        this.markings = otherMarkings
      }
    } else if (otherMarkings) {
      const prevMarkings = { ...this.markings }
      for (const [markingType, markingVal] of Object.entries(otherMarkings)) {
        if (markingVal && this.markings[markingType as MarkingShape] === null) {
          this.markings[markingType as MarkingShape] = 'blue'
        } else if (!markingVal && this.markings[markingType as MarkingShape]) {
          this.markings[markingType as MarkingShape] = 'unset'
        }
      }
      if (!deepEqual(prevMarkings, this.markings)) {
        updates.push(syncUpdate('markings', prevMarkings, this.markings))
      }
    }

    // memory ribbons need to be updated if new ribbons were earned to add to the count
    const contestRibbons = intersection(this.ribbons, Gen34ContestRibbons)
    this.contestMemoryCount = Math.max(contestRibbons.length, this.contestMemoryCount)
    const battleRibbons = intersection(this.ribbons, Gen34TowerRibbons)
    this.battleMemoryCount = Math.max(battleRibbons.length, this.battleMemoryCount)

    if (other.pokerusByte && this.pokerusByte !== other.pokerusByte) {
      updates.push(syncUpdate('pokerusByte', this.pokerusByte, other.pokerusByte))
      this.pokerusByte = other.pokerusByte
    }

    if (save) {
      this.setRecentSave(save)
    }

    const saveIsOriginalGame = save
      ? save.tid === this.trainerID && (!save.sid || save.sid === this.secretID)
      : true

    if (saveIsOriginalGame) {
      // The updated data is from this mon's game/trainer, so the OT fields will be updated
      if (other.trainerFriendship && this.trainerFriendship !== other.trainerFriendship) {
        updates.push(
          syncUpdate('trainerFriendship', this.trainerFriendship, other.trainerFriendship)
        )
        this.trainerFriendship = other.trainerFriendship
      }

      if (other.trainerMemory && !deepEqual(this.trainerMemory, other.trainerMemory)) {
        updates.push(syncUpdate('trainerMemory', this.trainerMemory, other.trainerMemory))
        this.trainerMemory = other.trainerMemory
      }

      if (other.trainerAffection && this.trainerAffection !== other.trainerAffection) {
        updates.push(syncUpdate('trainerAffection', this.trainerAffection, other.trainerAffection))
        this.trainerAffection = other.trainerAffection
      }
    } else if (save) {
      // The updated data is not the original game/trainer, so the appropriate data is stored in "handler" fields
      if (
        this.updateTrainerData(
          save,
          other.handlerFriendship ?? 70,
          other.handlerAffection ?? 0,
          other.handlerMemory
        )
      ) {
        updates.push(
          syncUpdateMessage(
            `Handler data updated for ${save.name} in ${OriginGames.gameNameFull(save.origin)}`,
            this.handlerId,
            save.tid
          )
        )
      }
    }

    if (other.shinyLeaves && !deepEqual(this.shinyLeaves, other.shinyLeaves)) {
      updates.push(syncUpdate('shinyLeaves', this.shinyLeaves, other.shinyLeaves))
      this.shinyLeaves = other.shinyLeaves.clone()
    }
    if (other.performance && this.performance !== other.performance) {
      updates.push(syncUpdate('performance', this.performance, other.performance))
      this.performance = other.performance
    }

    if (other.pokeStarFame && this.pokeStarFame !== other.pokeStarFame) {
      updates.push(syncUpdate('pokeStarFame', this.pokeStarFame, other.pokeStarFame))
      this.pokeStarFame = other.pokeStarFame
    }

    if (other.superTrainingFlags && this.superTrainingFlags !== other.superTrainingFlags) {
      updates.push(
        syncUpdate('superTrainingFlags', this.superTrainingFlags, other.superTrainingFlags)
      )
      this.superTrainingFlags = other.superTrainingFlags
    }

    if (
      other.superTrainingDistFlags &&
      this.superTrainingDistFlags !== other.superTrainingDistFlags
    ) {
      updates.push(
        syncUpdate(
          'superTrainingDistFlags',
          this.superTrainingDistFlags,
          other.superTrainingDistFlags
        )
      )
      this.superTrainingDistFlags = other.superTrainingDistFlags
    }

    if (
      other.secretSuperTrainingUnlocked &&
      this.secretSuperTrainingUnlocked !== other.secretSuperTrainingUnlocked
    ) {
      updates.push(
        syncUpdate(
          'secretSuperTrainingUnlocked',
          this.secretSuperTrainingUnlocked,
          other.secretSuperTrainingUnlocked
        )
      )
      this.secretSuperTrainingUnlocked = other.secretSuperTrainingUnlocked
    }

    if (
      other.secretSuperTrainingComplete &&
      this.secretSuperTrainingComplete !== other.secretSuperTrainingComplete
    ) {
      updates.push(
        syncUpdate(
          'secretSuperTrainingComplete',
          this.secretSuperTrainingComplete,
          other.secretSuperTrainingComplete
        )
      )
      this.secretSuperTrainingComplete = other.secretSuperTrainingComplete
    }

    if (other.trainingBagHits && this.trainingBagHits !== other.trainingBagHits) {
      updates.push(syncUpdate('trainingBagHits', this.trainingBagHits, other.trainingBagHits))
      this.trainingBagHits = other.trainingBagHits
    }

    if (other.trainingBag && this.trainingBag !== other.trainingBag) {
      updates.push(syncUpdate('trainingBag', this.trainingBag, other.trainingBag))
      this.trainingBag = other.trainingBag
    }

    if (other.country && this.country !== other.country) {
      updates.push(syncUpdate('country', this.country, other.country))
      this.country = other.country
    }

    if (other.region && this.region !== other.region) {
      updates.push(syncUpdate('region', this.region, other.region))
      this.region = other.region
    }

    if (other.consoleRegion && this.consoleRegion !== other.consoleRegion) {
      updates.push(syncUpdate('consoleRegion', this.consoleRegion, other.consoleRegion))
      this.consoleRegion = other.consoleRegion
    }

    if (other.formArgument && this.formArgument !== other.formArgument) {
      updates.push(syncUpdate('formArgument', this.formArgument, other.formArgument))
      this.formArgument = other.formArgument
    }

    if (other.geolocations && !deepEqual(this.geolocations, other.geolocations)) {
      updates.push(syncUpdate('geolocations', this.geolocations, other.geolocations))
      this.geolocations = other.geolocations
    }

    if (other.statNature !== undefined && this.statNature.index !== other.statNature.index) {
      updates.push(syncUpdate('statNature', this.statNature.index, other.statNature.index))
      this.statNature = other.statNature
    }

    const otherGameOfOriginBattle = other.gameOfOriginBattle || undefined
    if (
      other.gameOfOriginBattle !== undefined &&
      this.gameOfOriginBattle !== otherGameOfOriginBattle
    ) {
      updates.push(
        syncUpdate('gameOfOriginBattle', this.gameOfOriginBattle, otherGameOfOriginBattle)
      )
      this.gameOfOriginBattle = otherGameOfOriginBattle
    }

    if (other.teraTypeOverride !== undefined && this.teraTypeOverride !== other.teraTypeOverride) {
      updates.push(syncUpdate('teraTypeOverride', this.teraTypeOverride, other.teraTypeOverride))
      this.teraTypeOverride = other.teraTypeOverride
    }

    if (other.trFlagsSwSh !== undefined && !arraysEqual(this.trFlagsSwSh, other.trFlagsSwSh)) {
      updates.push(syncUpdate('trFlagsSwSh', this.trFlagsSwSh, other.trFlagsSwSh))
      this.trFlagsSwSh = other.trFlagsSwSh
    }

    if (other.tmFlagsBDSP !== undefined && !arraysEqual(this.tmFlagsBDSP, other.tmFlagsBDSP)) {
      updates.push(syncUpdate('tmFlagsBDSP', this.tmFlagsBDSP, other.tmFlagsBDSP))
      this.tmFlagsBDSP = other.tmFlagsBDSP
    }

    if (other.tmFlagsSV !== undefined && !arraysEqual(this.tmFlagsSV, other.tmFlagsSV)) {
      updates.push(syncUpdate('tmFlagsSV', this.tmFlagsSV, other.tmFlagsSV))
      this.tmFlagsSV = other.tmFlagsSV
    }

    if (other.tmFlagsSVDLC !== undefined && !arraysEqual(this.tmFlagsSVDLC, other.tmFlagsSVDLC)) {
      updates.push(syncUpdate('tmFlagsSVDLC', this.tmFlagsSVDLC, other.tmFlagsSVDLC))
      this.tmFlagsSVDLC = other.tmFlagsSVDLC
    }

    if (other.obedienceLevel !== undefined && this.obedienceLevel !== other.obedienceLevel) {
      updates.push(syncUpdate('obedienceLevel', this.obedienceLevel, other.obedienceLevel))
      this.obedienceLevel = other.obedienceLevel
    }

    return updates
  }

  abilityNumFromPidGen34(): AbilityNumber {
    if (this.personalityValue % 2 === 1) {
      return AbilityNumber.Second
    } else {
      return AbilityNumber.First
    }
  }

  generatePk3CompatiblePid(): number {
    return generatePk3CompatiblePid(OhpkmV2Wasm.fromByteVectorFixingErrors(this.toByteArray()))
  }
}

export function monFormatToOriginalDataTag(format: string): Option<Tag> {
  switch (format) {
    case 'PK1':
      return Tag.Pk1
    case 'PK2':
      return Tag.Pk2
    case 'PK3':
      return Tag.Pk3
    case 'PK4':
      return Tag.Pk4
    case 'PK5':
      return Tag.Pk5
    case 'PK6':
      return Tag.Pk6
    case 'PK7':
      return Tag.Pk7
    case 'PB7':
      return Tag.Pb7
    case 'PK8':
      return Tag.Pk8
    case 'PA8':
      return Tag.Pa8
    case 'PB8':
      return Tag.Pb8
    case 'PK9':
      return Tag.Pk9
    case 'PA9':
      return Tag.Pa9
    case 'PK3RR':
      return Tag.Pk3Rr
    case 'PK3UB':
      return Tag.Pk3Ub
    case 'PB8LUMI':
      return Tag.Pb8Lumi
  }
}

export function originalDataTagToMonFormat(tag: Tag): string {
  switch (tag) {
    case Tag.Pk1:
      return 'PK1'
    case Tag.Pk2:
      return 'PK2'
    case Tag.Pk3:
      return 'PK3'
    case Tag.Pk4:
      return 'PK4'
    case Tag.Pk5:
      return 'PK5'
    case Tag.Pk6:
      return 'PK6'
    case Tag.Pk7:
      return 'PK7'
    case Tag.Pb7:
      return 'PB7'
    case Tag.Pk8:
      return 'PK8'
    case Tag.Pa8:
      return 'PA8'
    case Tag.Pb8:
      return 'PB8'
    case Tag.Pk9:
      return 'PK9'
    case Tag.Pa9:
      return 'PA9'
    case Tag.Pb8Lumi:
      return 'PB8LUMI'
    case Tag.Pk3Rr:
      return 'PK3RR'
    case Tag.Pk3Ub:
      return 'PK3UB'
  }
}

const FORMATS_WITHOUT_ABILITIES = ['PK1', 'PK2', 'PB7', 'PA8', 'PA9']

const FORMATS_ALLOWING_ABILITY_CHANGE = [
  'PK3RR',
  'PK3UB',
  'PK6',
  'PK7',
  'PK8',
  'PA8',
  'PB8',
  'PK9',
  'PA9',
  'PB8LUMI',
]

const FORMATS_WITHOUT_HIDDEN_ABILITIES = ['PK3', 'COLOPKM', 'XDPKM', 'PK4']

function isPrevoOrCurrentSpeciesName(
  dexNum: number,
  formNum: number,
  nickname: string,
  language: Language
): boolean {
  for (const nationalDex of [
    dexNum,
    ...getPrevos(dexNum, formNum).map((prevo) => prevo.nationalDex.index),
  ]) {
    if (nickname.toUpperCase() === Lookup.speciesName(nationalDex, language).toUpperCase()) {
      return true
    }
  }
  return false
}

type UpdatableType = string | number | bigint | object | boolean

type SyncUpdate = {
  field?: string
  message?: string
  prevValue?: UpdatableType
  newValue?: UpdatableType
}

function syncUpdate(
  field: string,
  prevValue?: UpdatableType,
  newValue?: UpdatableType
): SyncUpdate {
  return {
    field,
    prevValue,
    newValue,
  }
}

function syncUpdateMessage(
  message: string,
  prevValue?: UpdatableType,
  newValue?: UpdatableType
): SyncUpdate {
  return {
    message,
    prevValue,
    newValue,
  }
}

function arraysEqual<T>(first?: T[] | Uint8Array, second?: T[] | Uint8Array): boolean {
  if (first === undefined || second === undefined) {
    return first === second
  }
  return (
    first.length === second.length &&
    first.every((item, i) => {
      if (isObject(item) && isObject(second[i])) {
        return deepEqual(item, second[i])
      } else {
        return item === second[i]
      }
    })
  )
}

function deepEqual(first?: object, second?: object): boolean {
  if (first === undefined || second === undefined) {
    return first === second
  }

  if (Array.isArray(first) && Array.isArray(second)) {
    return arraysEqual(first, second)
  }

  if (isObject(first) && isObject(second)) {
    return objectsEqual(first, second)
  }

  return first === second
}

type IndexableObject = object & Record<string, any>

export function objectsEqual(object1: IndexableObject, object2: IndexableObject) {
  if (object1 === null || object2 === null) {
    return object1 === object2
  }

  const objKeys1 = Object.keys(object1)
  const objKeys2 = Object.keys(object2)

  if (objKeys1.length !== objKeys2.length) return false

  for (const key of objKeys1) {
    const value1 = object1[key]
    const value2 = object2[key]

    const isObjects = isObject(value1) && isObject(value2)

    if ((isObjects && !deepEqual(value1, value2)) || (!isObjects && value1 !== value2)) {
      return false
    }
  }
  return true
}

function isObject(object: unknown): object is IndexableObject {
  return object !== null && typeof object === 'object'
}
