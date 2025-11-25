import {
  Gender,
  GenderRatio,
  MetadataLookup,
  OriginGame,
  SpeciesAndForme,
  SpeciesLookup,
} from '@pkm-rs/pkg'
import {
  MarkingsSixShapesWithColor,
  Stats,
  getStandardPKMStats,
  markingsHaveColor,
} from '@pokemon-files/util'
import { Gen34ContestRibbons, Gen34TowerRibbons, ModernRibbons } from '@pokemon-resources/index'
import * as lodash from 'lodash'
import { getHomeIdentifier, isEvolution } from '../../util/Lookup'
import { PKMInterface } from '../interfaces'
import OhpkmV2 from './OhpkmV2'
import { adjustMovePPBetweenFormats, getAbilityFromNumber } from './util'

export class OHPKM extends OhpkmV2 {
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

  public getStats(): Stats {
    return this.stats
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

  public updateData(other: PKMInterface) {
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

    this.ribbons = lodash.uniq([...this.ribbons, ...(other.ribbons ?? [])])
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
    const contestRibbons = lodash.intersection(this.ribbons, Gen34ContestRibbons)

    this.contestMemoryCount = Math.max(contestRibbons.length, this.contestMemoryCount)
    const battleRibbons = lodash.intersection(this.ribbons, Gen34TowerRibbons)

    this.battleMemoryCount = Math.max(battleRibbons.length, this.battleMemoryCount)

    if (other.pokerusByte) {
      this.pokerusByte = other.pokerusByte
    }
    if (other.trainerFriendship) {
      this.trainerFriendship = Math.max(other.trainerFriendship, this.trainerFriendship)
    }

    if (other.shinyLeaves) {
      this.shinyLeaves = other.shinyLeaves
    }
    if (other.performance) {
      this.performance = other.performance
    }

    if (other.pokeStarFame) {
      this.pokeStarFame = other.pokeStarFame
    }

    if (other.handlerName) {
      this.handlerName = other.handlerName
    }
    if (other.handlerGender !== undefined) {
      this.handlerGender = other.handlerGender
    }
    if (other.isCurrentHandler !== undefined) {
      this.isCurrentHandler = other.isCurrentHandler
    }
    if (other.handlerFriendship !== undefined) {
      this.handlerFriendship = other.handlerFriendship
    }

    if (other.handlerMemory) {
      this.handlerMemory = other.handlerMemory
    }
    if (other.trainerMemory) {
      this.trainerMemory = other.trainerMemory
    }

    if (other.handlerAffection) {
      this.handlerAffection = other.handlerAffection
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
    if (other.trainerAffection) {
      this.trainerAffection = other.trainerAffection
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

    this.nickname = other.nickname
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

type MarkingShape = keyof MarkingsSixShapesWithColor

const FORMATS_WITHOUT_ABILITIES = ['PK1', 'PK2', 'PB7', 'PA8', 'PA9']

const FORMATS_WITHOUT_HIDDEN_ABILITIES = ['PK3', 'COLOPKM', 'XDPKM', 'PK4']
