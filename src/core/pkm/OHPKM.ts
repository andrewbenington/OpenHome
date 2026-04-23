import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { intersection, Option, unique } from '@openhome-core/util/functional'
import {
  AbilityIndex,
  AbilityNumber,
  Ball,
  ExtraFormIndex,
  Gender,
  HyperTraining,
  Item,
  Language,
  Languages,
  Lookup,
  MetadataSummaryLookup,
  NatureIndex,
  PokeDate,
  ShinyLeaves,
  SpeciesAndForm,
  SpeciesLookup,
  Tag,
  TrainerData,
  TrainerMemory,
  updatePidIfWouldBecomeShinyGen345,
} from '@pkm-rs/pkg'
import {
  AllPKMFields,
  FourMoves,
  generatePersonalityValuePreservingAttributes,
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
import Prando from 'prando'
import { OhpkmV2 as OhpkmV2Wasm } from '../../../pkm_rs/pkg'
import { PluginIdentifier, SAV } from '../save/interfaces'
import {
  contestStatsFromWasm,
  contestStatsToWasm,
  convertPokeDate,
  convertPokeDateOptional,
  geolocationsFromWasm,
  geolocationsToWasm,
  markingsSixShapesColorsFromWasm,
  markingsSixShapesColorsToWasm,
  stats16LeToWasmNullable,
  stats8ToWasm,
  stats8ToWasmNullable,
  statsFromWasm,
  statsFromWasmNullable,
  statsPreSplitFromWasm,
  statsPreSplitFromWasmNullable,
  statsPreSplitToWasm,
  trainerMemoryToWasm,
} from './convert'
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

  constructor(arg: Uint8Array | AllPKMFields) {
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

        this.personalityValue = generatePersonalityValuePreservingAttributes(other)
      } else {
        prng = new Prando(other.trainerName.concat(other.trainerID.toString()))
      }

      this.SpeciesAndForm = new SpeciesAndForm(other.dexNum, other.formNum)
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

      this.ivs = stats8ToWasm(
        other.ivs ?? (other.dvs !== undefined ? ivsFromDVs(other.dvs) : generateIVs(prng))
      )

      if (other.evs) {
        this.evs = stats8ToWasm(other.evs)
      }

      if (other.contest) {
        this.contest = contestStatsToWasm(other.contest)
      }

      this.ball = other.ball !== undefined ? other.ball : Ball.Poke
      this.markings = jsTypes.markingsSixShapesWithColorFromOther(other.markings)

      this.metLocationIndex = other.metLocationIndex ?? 0
      this.metLevel = other.metLevel ?? 0

      if (other.dvs && other.evsG12) {
        this.setGameboyData(
          statsPreSplitToWasm(other.dvs),
          other.metTimeOfDay ?? 0,
          statsPreSplitToWasm(other.evsG12)
        )
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
      this.homeTracker = other.homeTracker ?? new Uint8Array(8)

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
    if (this.openhomeId === '0004-d889ca57-401aab08-30') {
      this.extraFormIndex = ExtraFormIndex.CharizardClone
    }
  }

  // static constructors

  static fromBytes(buffer: ArrayBufferLike): OHPKM {
    return new OHPKM(new Uint8Array(buffer))
  }

  static fromMonInSave(mon: PKMInterface, save: SAV): OHPKM {
    const ohpkm = new OHPKM(mon)
    ohpkm.syncWithGameData(mon, save)

    return ohpkm
  }

  static defaultWithSpecies(nationalDex: number, formIndex: number) {
    const bytes = OhpkmV2Wasm.defaultWithSpecies(nationalDex, formIndex).toByteArray()
    return OHPKM.fromBytes(bytes.buffer)
  }

  // getters / setters

  get dexNum() {
    return this.SpeciesAndForm.nationalDex
  }

  get ability() {
    return this.abilityIndex
  }
  set ability(value: AbilityIndex) {
    this.abilityIndex = value
  }

  get formNum() {
    return this.SpeciesAndForm.formIndex
  }

  get evsG12() {
    return statsPreSplitFromWasmNullable(this.evsG12Wasm)
  }
  set evsG12(value: jsTypes.StatsPreSplit | undefined) {
    if (value) {
      this.evsG12Wasm = statsPreSplitToWasm(value)
    }
  }

  get ivs() {
    return statsFromWasm(this.ivsWasm)
  }
  set ivs(value: jsTypes.Stats) {
    this.ivsWasm = stats8ToWasm(value)
  }

  get evs() {
    return statsFromWasm(this.evsWasm)
  }

  set evs(value: Stats) {
    this.evsWasm = stats8ToWasm(value)
  }

  get dvs() {
    return statsPreSplitFromWasm(this.dvsWasm)
  }

  get avs() {
    return statsFromWasmNullable(this.avsWasm)
  }
  set avs(value: Stats | undefined) {
    this.avsWasm = stats16LeToWasmNullable(value)
  }

  get contest() {
    return contestStatsFromWasm(this.contestWasm)
  }

  set contest(value: jsTypes.ContestStats) {
    this.contestWasm = contestStatsToWasm(value)
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

  get trainerMemory() {
    return trainerMemoryToWasm(this.trainerMemoryWasm)
  }
  set trainerMemory(value: jsTypes.Memory) {
    this.trainerMemoryWasm = trainerMemoryToWasm(value)
  }

  get handlerMemory() {
    return trainerMemoryToWasm(this.handlerMemoryWasm)
  }
  set handlerMemory(value: jsTypes.Memory) {
    this.handlerMemoryWasm = trainerMemoryToWasm(value)
  }

  get geolocations() {
    return geolocationsFromWasm(this.geolocationsWasm)
  }
  set geolocations(value: jsTypes.Geolocation[] | undefined) {
    this.geolocationsWasm = geolocationsToWasm(value)
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

  get markings() {
    return markingsSixShapesColorsFromWasm(this.markingsWasm)
  }
  set markings(value: jsTypes.MarkingsSixShapesWithColor) {
    this.markingsWasm = markingsSixShapesColorsToWasm(value)
  }

  get hyperTraining() {
    return this.hyperTrainingWasm
  }
  set hyperTraining(value: jsTypes.HyperTrainStats) {
    this.hyperTrainingWasm = new HyperTraining(
      value.hp,
      value.atk,
      value.def,
      value.spa,
      value.spd,
      value.spe
    )
  }

  get gvs() {
    return statsFromWasmNullable(this.gvsWasm)
  }
  set gvs(value: Stats | undefined) {
    this.gvsWasm = stats8ToWasmNullable(value)
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

  public get languageString() {
    return Languages.stringFromByte(this.language)
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

  public updateTrainerData(
    save: SAV,
    friendship: number,
    affection: number,
    memory?: TrainerMemory
  ) {
    this.registerHandler(
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
    this.isCurrentHandler = !isOriginalSave
    if (isOriginalSave) {
      this.handlerName = ''
      this.handlerAffection = 0
      this.handlerFriendship = 0
      this.handlerMemoryWasm = new TrainerMemory(0, 0, 0, 0)
      this.handlerId = 0
      this.handlerLanguage = 0
      this.handlerGender = false
      return
    }

    this.handlerName = save.name

    const existingTrainerData = this.findKnownHandler(save.tid, save.sid ?? 0, save.origin)

    if (existingTrainerData) {
      this.handlerAffection = existingTrainerData.affection
      this.handlerFriendship = existingTrainerData.friendship
      this.handlerMemoryWasm = existingTrainerData.memory
      this.handlerId = existingTrainerData.id ?? 0
      this.handlerLanguage = existingTrainerData.language ?? 0
      this.handlerGender = existingTrainerData.gender === Gender.Female
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
    this.exp = other.exp

    this.moves = other.moves as FourMoves
    this.movePP = adjustMovePPBetweenFormats(this, other)
    this.movePPUps = other.movePPUps as FourMoves

    if (this.dexNum !== other.dexNum && isEvolution(this, other)) {
      this.SpeciesAndForm = new SpeciesAndForm(other.dexNum, other.formNum)
      this.extraFormIndex = other.extraFormIndex
    }

    if (this.dexNum === other.dexNum || isEvolution(this, other)) {
      this.SpeciesAndForm = new SpeciesAndForm(other.dexNum, other.formNum)
      this.extraFormIndex = other.extraFormIndex
    }

    // Don't update nickname if the only difference is that it's a truncated version of the original
    if (
      other.nickname !== this.nickname &&
      other.nickname !== this.nickname.slice(0, 10) &&
      !isPrevoSpeciesName(this.dexNum, this.formNum, other.nickname, this.language)
    ) {
      this.nickname = other.nickname
    }

    if (isPrevoSpeciesName(this.dexNum, this.formNum, this.nickname, this.language)) {
      this.nickname = Lookup.speciesName(this.dexNum, this.language)
    }

    this.heldItemIndex = other.heldItemIndex
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
        this.ability = other.ability
        if (other.abilityNum) {
          this.abilityNum = other.abilityNum
        }
      }
    }

    if (other.avs) {
      this.avs = other.avs
    }
    if (other.evs) {
      this.evs = other.evs
    }
    if (other.evsG12) {
      this.evsG12 = other.evsG12
    }
    if (other.hyperTraining) {
      this.hyperTraining = other.hyperTraining
    }

    this.ribbons = unique([...this.ribbons, ...(other.ribbons ?? [])])
    if (other.contest) {
      this.contest = other.contest
    }

    const otherMarkings = other.markings

    if (otherMarkings && markingsHaveColor(otherMarkings)) {
      this.markings = otherMarkings
    } else if (otherMarkings) {
      for (const [markingType, markingVal] of Object.entries(otherMarkings)) {
        if (markingVal && this.markings[markingType as MarkingShape] === null) {
          this.markings[markingType as MarkingShape] = 'blue'
        } else if (!markingVal && this.markings[markingType as MarkingShape]) {
          this.markings[markingType as MarkingShape] = null
        }
      }
    }

    // memory ribbons need to be updated if new ribbons were earned to add to the count
    const contestRibbons = intersection(this.ribbons, Gen34ContestRibbons)

    this.contestMemoryCount = Math.max(contestRibbons.length, this.contestMemoryCount)
    const battleRibbons = intersection(this.ribbons, Gen34TowerRibbons)

    this.battleMemoryCount = Math.max(battleRibbons.length, this.battleMemoryCount)

    if (other.pokerusByte) {
      this.pokerusByte = other.pokerusByte
    }

    if (save) {
      this.setRecentSave(save)
    }

    const shouldUpdateOriginalTrainer = save
      ? save.tid === this.trainerID && (!save.sid || save.sid === this.secretID)
      : true

    if (shouldUpdateOriginalTrainer) {
      // The updated data is from this mon's game/trainer, so the OT fields will be updated
      if (other.trainerFriendship) {
        this.trainerFriendship = other.trainerFriendship
      }
      if (other.trainerMemory) {
        this.trainerMemory = other.trainerMemory
      }
      if (other.trainerAffection) {
        this.trainerAffection = other.trainerAffection
      }
    } else if (save) {
      // The updated data is not the original game/trainer, so the appropriate data is stored in "handler" fields
      this.updateTrainerData(
        save,
        other.handlerFriendship ?? 70, // TODO: USE BASE FRIENDSHIP
        other.handlerAffection ?? 0,
        other.handlerMemory
          ? new TrainerMemory(
              other.handlerMemory.intensity,
              other.handlerMemory.memory,
              other.handlerMemory.feeling,
              other.handlerMemory.textVariables
            )
          : undefined
      )
    }

    if (other.shinyLeaves) {
      this.shinyLeaves = other.shinyLeaves.clone()
    }
    if (other.performance) {
      this.performance = other.performance
    }

    if (other.pokeStarFame) {
      this.pokeStarFame = other.pokeStarFame
    }

    if (other.superTrainingFlags) {
      this.superTrainingFlags = other.superTrainingFlags
    }
    if (other.superTrainingDistFlags) {
      this.superTrainingDistFlags = other.superTrainingDistFlags
    }
    if (other.secretSuperTrainingUnlocked) {
      this.secretSuperTrainingUnlocked = other.secretSuperTrainingUnlocked
    }
    if (other.secretSuperTrainingComplete) {
      this.secretSuperTrainingComplete = other.secretSuperTrainingComplete
    }
    if (other.trainingBagHits) {
      this.trainingBagHits = other.trainingBagHits
    }
    if (other.trainingBag) {
      this.trainingBag = other.trainingBag
    }

    if (other.country) {
      this.country = other.country
    }
    if (other.region) {
      this.region = other.region
    }
    if (other.consoleRegion) {
      this.consoleRegion = other.consoleRegion
    }
    if (other.formArgument) {
      this.formArgument = other.formArgument
    }
    if (other.geolocations) {
      this.geolocations = other.geolocations
    }

    if (other.statNature !== undefined) {
      this.statNature = other.statNature
    }
    if (other.gameOfOriginBattle !== undefined) {
      this.gameOfOriginBattle = other.gameOfOriginBattle
    }

    if (other.teraTypeOverride !== undefined) {
      this.teraTypeOverride = other.teraTypeOverride
    }
    if (other.trFlagsSwSh !== undefined) {
      this.trFlagsSwSh = other.trFlagsSwSh
    }
    if (other.tmFlagsBDSP !== undefined) {
      this.tmFlagsBDSP = other.tmFlagsBDSP
    }
    if (other.tmFlagsSV !== undefined) {
      this.tmFlagsSV = other.tmFlagsSV
    }
    if (other.tmFlagsSVDLC !== undefined) {
      this.tmFlagsSVDLC = other.tmFlagsSVDLC
    }
    if (other.obedienceLevel !== undefined) {
      this.obedienceLevel = other.obedienceLevel
    }
  }

  abilityNumFromPidGen34(): AbilityNumber {
    if (this.personalityValue % 2 === 1) {
      return AbilityNumber.Second
    } else {
      return AbilityNumber.First
    }
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

function isPrevoSpeciesName(
  dexNum: number,
  formNum: number,
  nickname: string,
  language: Language
): boolean {
  for (const prevo of getPrevos(dexNum, formNum)) {
    if (
      nickname.toUpperCase() === Lookup.speciesName(prevo.nationalDex.index, language).toUpperCase()
    ) {
      return true
    }
  }
  return false
}
