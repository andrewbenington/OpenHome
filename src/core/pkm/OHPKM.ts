import {
  AbilityIndex,
  Ball,
  Gender,
  GenderRatio,
  HyperTraining,
  Item,
  Languages,
  MetadataLookup,
  NatureIndex,
  OriginGame,
  PokeDate,
  ShinyLeaves,
  SpeciesAndForme,
  SpeciesLookup,
  TrainerData,
  TrainerMemory,
  updatePidIfWouldBecomeShinyGen345,
} from '@pkm-rs/pkg'
import {
  AllPKMFields,
  MarkingShape,
  Stats,
  generatePersonalityValuePreservingAttributes,
  getHeightCalculated,
  getStandardPKMStats,
  getWeightCalculated,
  markingsHaveColor,
} from '@pokemon-files/util'
import * as jsTypes from '@pokemon-files/util/types'
import { NationalDex } from '@pokemon-resources/consts/NationalDex'
import { Gen34ContestRibbons, Gen34TowerRibbons, ModernRibbons } from '@pokemon-resources/index'
import Prando from 'prando'
import { PKMInterface } from 'src/types/interfaces'
import { OhpkmV2 as OhpkmV2Wasm } from '../../../pkm_rs/pkg'
import { intersection, unique } from '../../util/Functional'
import { getHomeIdentifier, isEvolution } from '../../util/Lookup'
import { SAV } from '../save/SAV'
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
import { OhpkmV1 } from './OhpkmV1'
import { adjustMovePPBetweenFormats, generateIVs, getAbilityFromNumber, ivsFromDVs } from './util'

export class OHPKM extends OhpkmV2Wasm implements PKMInterface {
  static getName() {
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

      this.speciesAndForme = new SpeciesAndForme(other.dexNum, other.formeNum)

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

      this.moves = other.moves as [number, number, number, number]
      this.movePP = adjustMovePPBetweenFormats(this, other)
      this.movePPUps = other.movePPUps as [number, number, number, number]
      this.nickname = other.nickname
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
        getAbilityFromNumber(this.dexNum, this.formeNum, this.abilityNum) ??
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
    }
  }

  // static constructors

  static fromBytes(buffer: ArrayBuffer): OHPKM {
    return new OHPKM(new Uint8Array(buffer))
  }

  static fromV1Wasm(v1: OhpkmV1) {
    const v2 = OhpkmV2Wasm.fromV1Bytes(new Uint8Array(v1.toBytes()))
    return new OHPKM(v2.toByteArray())
  }

  // getters / setters

  get dexNum() {
    return this.speciesAndForme.nationalDex
  }

  get ability() {
    return this.abilityIndex
  }
  set ability(value: AbilityIndex) {
    this.abilityIndex = value
  }

  get formeNum() {
    return this.speciesAndForme.formeIndex
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
    return Array.from(this.move_indices)
  }
  set moves(value: number[]) {
    this.move_indices = new Uint16Array(value)
  }

  get movePP() {
    return Array.from(this.move_pp)
  }
  set movePP(value: number[]) {
    this.move_pp = new Uint8Array(value)
  }

  get movePPUps() {
    return Array.from(this.move_pp_ups)
  }
  set movePPUps(value: number[]) {
    this.move_pp_ups = new Uint8Array(value)
  }

  get relearnMoves() {
    return Array.from(this.relearn_move_indices)
  }
  set relearnMoves(value: number[]) {
    this.relearn_move_indices = new Uint16Array(value)
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
    this.tradeToGame(save.origin)

    this.isCurrentHandler = !this.isFrom(save)
    if (!this.isCurrentHandler) return

    this.handlerName = save.name

    const existingTrainerData = this.findKnownHandler(save.tid, save.sid ?? 0, save.origin)

    if (existingTrainerData) {
      this.handlerAffection = existingTrainerData.affection
      this.handlerFriendship = existingTrainerData.friendship
      this.handlerMemoryWasm = existingTrainerData.memory
    } else {
      this.handlerFriendship = 70 // TODO: PER-FORM BASE FRIENDSHIP
      this.updateTrainerData(save, 70, 0)
    }
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
    return MetadataLookup(this.dexNum, this.formeNum)
  }

  public get speciesMetadata() {
    return SpeciesLookup(this.dexNum)
  }

  public fixErrors(): boolean {
    let errorsFound = false
    const metadata = this.metadata

    // PLA mons cannot have been hatched
    if (this.gameOfOrigin === OriginGame.LegendsArceus && (this.eggDate || this.eggLocationIndex)) {
      this.eggDate = undefined
      this.eggLocationIndex = undefined
      errorsFound = true
    }

    // Affixed ribbon must be in the mon's possession
    if (
      this.affixedRibbon !== undefined &&
      this.ribbons.includes(ModernRibbons[this.affixedRibbon])
    ) {
      this.affixedRibbon = undefined
      errorsFound = true
    }

    // Fix ability bug from pre-1.5.0 (affected Mind's Eye and Dragon's Maw)
    // Fix ability bug from pre-1.7.1 (abilities not updated after evolution/capsule/patch)
    // Fix ability num bug from some point in the past (set to 0 instead of 1)
    if (!this.abilityNumMatchesIndex()) {
      const fixedAbilityNum = this.abilityNumByIndex()
      if (fixedAbilityNum) {
        // This ability is a valid one for the species! Set the appropriate ability number
        this.abilityNum = fixedAbilityNum
      } else {
        // Hm, this ability is invalid for the species. Let's reset it using the ability number
        this.ability =
          getAbilityFromNumber(this.dexNum, this.formeNum, this.abilityNum) ?? this.ability
      }
      errorsFound = true
    }

    const genderRatio = this.metadata?.genderRatio
    if (metadata && genderRatio !== undefined) {
      if (
        (this.gender === Gender.Genderless && genderRatio !== GenderRatio.Genderless) ||
        (this.gender !== Gender.Genderless && genderRatio === GenderRatio.Genderless) ||
        (this.gender === Gender.Male && genderRatio === GenderRatio.AllFemale) ||
        (this.gender === Gender.Female && genderRatio === GenderRatio.AllMale)
      ) {
        this.gender = metadata.genderFromPid(this.personalityValue)
        errorsFound = true
      }
    }

    errorsFound = false

    return errorsFound
  }

  public getHomeIdentifier() {
    return getHomeIdentifier(this)
  }

  public syncWithGameData(other: PKMInterface, save?: SAV) {
    this.exp = other.exp

    this.moves = other.moves as [number, number, number, number]
    this.movePP = adjustMovePPBetweenFormats(this, other)
    this.movePPUps = other.movePPUps as [number, number, number, number]

    if (this.dexNum !== other.dexNum && isEvolution(this, other)) {
      this.speciesAndForme = new SpeciesAndForme(other.dexNum, this.formeNum)
    }

    if (this.dexNum === other.dexNum || isEvolution(this, other)) {
      this.speciesAndForme = new SpeciesAndForme(this.dexNum, this.formeNum)
    }

    this.heldItemIndex = other.heldItemIndex
    if (other.ability && !FORMATS_WITHOUT_ABILITIES.includes(other.format)) {
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

    if (save && save.origin >= OriginGame.Sword) {
      this.nickname = other.nickname
    }
  }

  private abilityNumMatchesIndex(): boolean {
    if (this.abilityNum === FIRST_ABILITY) return this.abilityIsFirstSlot()
    if (this.abilityNum === SECOND_ABILITY) return this.abilityIsSecondSlot()
    if (this.abilityNum === HIDDEN_ABILITY) return this.abilityIsHiddenSlot()

    return false
  }

  private abilityNumByIndex(): AbilityNum | undefined {
    const metadata = this.metadata
    if (!metadata) return undefined

    const [ability1, ability2] = metadata.abilities

    if (this.ability?.index === ability1.index) return FIRST_ABILITY
    if (this.ability?.index === ability2.index) return SECOND_ABILITY
    if (metadata.hiddenAbility && this.ability?.index === metadata.hiddenAbility.index) {
      return HIDDEN_ABILITY
    }

    return undefined
  }

  private abilityIsFirstSlot(): boolean {
    const metadata = this.metadata
    return (
      metadata !== undefined &&
      this.ability !== undefined &&
      this.ability.index === metadata.abilities[0].index
    )
  }

  private abilityIsSecondSlot(): boolean {
    const metadata = this.metadata
    return (
      metadata !== undefined &&
      this.ability !== undefined &&
      this.ability.index === metadata.abilities[1].index
    )
  }

  private abilityIsHiddenSlot(): boolean {
    const metadata = this.metadata
    const hiddenOrFirst = metadata?.hiddenAbility ?? metadata?.abilities[0]
    return (
      hiddenOrFirst !== undefined &&
      this.ability !== undefined &&
      this.ability.index === hiddenOrFirst.index
    )
  }
}

type AbilityNum = 1 | 2 | 4
const FIRST_ABILITY: AbilityNum = 1
const SECOND_ABILITY: AbilityNum = 2
const HIDDEN_ABILITY: AbilityNum = 4

const FORMATS_WITHOUT_ABILITIES = ['PK1', 'PK2', 'PB7', 'PA8', 'PA9']

const FORMATS_WITHOUT_HIDDEN_ABILITIES = ['PK3', 'COLOPKM', 'XDPKM', 'PK4']
