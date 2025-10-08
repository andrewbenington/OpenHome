import {
  ContestStats,
  Geolocation,
  HyperTrainStats,
  MarkingsSixShapesWithColor,
  Memory,
  PKMDate,
  Stats,
  StatsPreSplit,
  generatePersonalityValuePreservingAttributes,
  markingsHaveColor,
  markingsSixShapesWithColorFromBytes,
  markingsSixShapesWithColorFromOther,
  markingsSixShapesWithColorToBytes,
} from '@pokemon-files/util'
import { Gender, GenderRatio, MetadataLookup, SpeciesLookup } from '@pokemon-resources/pkg'
import * as lodash from 'lodash'
import {
  AbilityFromString,
  AbilityToString,
  Ball,
  GameOfOrigin,
  Gen34ContestRibbons,
  Gen34TowerRibbons,
  ItemFromString,
  ItemToString,
  Languages,
  ModernRibbons,
  NatureToString,
  getMetLocation,
} from 'pokemon-resources'
import Prando from 'prando'
import { NationalDex } from 'src/consts/NationalDex'
import { OpenHomeRibbons } from 'src/consts/Ribbons'
import { ShadowIDsColosseum, ShadowIDsXD } from 'src/consts/ShadowIDs'
import {
  bytesToUint16BigEndian,
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
  getFlag,
  setFlag,
  uint16ToBytesBigEndian,
  uint16ToBytesLittleEndian,
  uint32ToBytesLittleEndian,
} from 'src/util/byteLogic'
import { getHPGen3Onward, getStatGen3Onward } from 'src/util/StatCalc'
import { utf16BytesToString, utf16StringToBytes } from 'src/util/Strings/StringConverter'
import { getHomeIdentifier, isEvolution } from '../../util/Lookup'
import { PKMInterface, PluginPKMInterface } from '../interfaces'
import schema from './OHPKM.json'
import {
  adjustMovePPBetweenFormats,
  dvsFromIVs,
  generateIVs,
  generateTeraType,
  getAbilityFromNumber,
  getHeightCalculated,
  getWeightCalculated,
  gvsFromIVs,
  ivsFromDVs,
  writeIVsToBuffer,
} from './util'

const FILE_SIZE = 497

export class OHPKM implements PKMInterface {
  static fromBytes(bytes: ArrayBuffer) {
    return new OHPKM(new Uint8Array(bytes))
  }

  static schema = schema

  public get fileSize() {
    return FILE_SIZE
  }

  get markingCount(): number {
    return 6
  }

  get markingColors(): number {
    return 2
  }

  static maxValidMove() {
    return 919
  }

  bytes: Uint8Array = new Uint8Array(FILE_SIZE)
  heightDeviation = 0.2
  weightDeviation = 0.2

  constructor(arg: PKMInterface | PluginPKMInterface | OHPKM | Uint8Array) {
    if (arg instanceof Uint8Array) {
      // If OHPKM format has expanded, we want to increase the size of older files to
      // make room for new fields
      this.bytes = extendUint8Array(arg, FILE_SIZE)
    } else {
      const other = arg
      let prng: Prando

      if ('personalityValue' in other) {
        prng = new Prando(
          other.trainerName
            .concat((other.personalityValue ?? 0).toString())
            .concat((other.secretID ?? 0).toString())
            .concat(other.trainerID.toString())
        )
      } else if (other.dvs) {
        const { hp, atk, def, spc, spe } = other.dvs

        prng = new Prando(
          other.trainerName
            .concat(`${hp}~${atk}~${def}~${spc}~${spe}`)
            .concat(other.trainerID.toString())
        )
      } else {
        prng = new Prando(other.trainerName.concat(other.trainerID.toString()))
      }

      this.dexNum = other.dexNum
      this.formeNum = other.formeNum ?? 0
      this.heldItemIndex = ItemFromString(other.heldItemName)
      this.trainerName = other.trainerName
      this.trainerGender = other.trainerGender
      this.trainerID = other.trainerID
      this.secretID = other.secretID ?? 0
      this.exp = other.exp

      this.moves = other.moves as [number, number, number, number]
      this.movePP = adjustMovePPBetweenFormats(this, other)
      this.movePPUps = other.movePPUps as [number, number, number, number]
      this.nickname = other.nickname
      this.language = other.language
      this.gameOfOrigin = other.gameOfOrigin
      this.pluginOrigin = other.pluginOrigin

      this.isEgg = other.isEgg ?? false
      this.pokerusByte = other.pokerusByte ?? 0
      this.trainerFriendship = other.trainerFriendship ?? 40

      this.personalityValue =
        other.personalityValue !== undefined
          ? other.personalityValue
          : generatePersonalityValuePreservingAttributes(other)
      this.isFatefulEncounter = other.isFatefulEncounter ?? false

      if (other.format === 'PK1' || other.format === 'PK2') {
        this.abilityNum = 4 // hidden ability for GB mons to mirror virtual console + pokemon bank
        if (other.dexNum === NationalDex.Mew || other.dexNum === NationalDex.Celebi) {
          this.isFatefulEncounter = true
        }
        this.gender =
          other.gender ??
          (other.dvs
            ? this.metadata?.genderFromAtkDv(this.dvs.atk)
            : this.metadata?.genderFromPid(this.personalityValue)) ??
          Gender.Genderless
      } else {
        this.abilityNum = other.abilityNum ?? 0
        this.gender =
          other.gender ?? this.metadata?.genderFromPid(this.personalityValue) ?? Gender.Genderless
      }

      this.nature = other.nature !== undefined ? other.nature : this.personalityValue % 25
      this.ivs = other.ivs ?? (other.dvs !== undefined ? ivsFromDVs(other.dvs) : generateIVs(prng))
      this.evs = other.evs ?? {
        hp: 0,
        atk: 0,
        def: 0,
        spe: 0,
        spa: 0,
        spd: 0,
      }
      this.evsG12 = other.evsG12 ?? {
        hp: 0,
        atk: 0,
        def: 0,
        spe: 0,
        spc: 0,
      }
      this.contest = other.contest ?? {
        beauty: 0,
        smart: 0,
        cool: 0,
        tough: 0,
        cute: 0,
        sheen: 0,
      }
      this.ball = other.ball !== undefined ? other.ball : Ball.Poke
      this.markings = markingsSixShapesWithColorFromOther(other.markings)
      this.dvs = other.dvs ?? dvsFromIVs(this.ivs, other.isShiny())
      if (other.format === 'PK2' && other.dexNum === NationalDex.Unown) {
        const letterBits = (other.formeNum ?? 0) * 10
        const newDvs = this.dvs

        newDvs.atk = (newDvs.atk & 0b1001) | (((letterBits >> 6) & 0b11) << 1)
        newDvs.def = (newDvs.def & 0b1001) | (((letterBits >> 4) & 0b11) << 1)
        newDvs.spe = (newDvs.spe & 0b1001) | (((letterBits >> 2) & 0b11) << 1)
        newDvs.spc = (newDvs.spc & 0b1001) | ((letterBits & 0b11) << 1)
        this.dvs = newDvs
      }

      this.metLocationIndex = other.metLocationIndex ?? 0
      this.metLevel = other.metLevel ?? 0

      this.metTimeOfDay = other.metTimeOfDay ?? 0
      this.metLocationIndex = other.metLocationIndex ?? 0
      this.ability = getAbilityFromNumber(this.dexNum, this.formeNum, this.abilityNum)
      this.abilityIndex = AbilityFromString(this.ability)

      this.isShadow = other.isShadow ?? false

      this.encryptionConstant =
        other.encryptionConstant ?? other.personalityValue ?? prng.nextInt(0, 0xffffffff)

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

      this.encounterType = other.encounterType ?? 0

      this.shinyLeaves = other.shinyLeaves ?? 0
      this.performance = other.performance ?? 0

      // Gen 5+
      this.pokeStarFame = other.pokeStarFame ?? 0
      this.isNsPokemon = !!other.isNsPokemon

      // Gen 6+
      this.contestMemoryCount = other.contestMemoryCount ?? 0
      this.battleMemoryCount = other.battleMemoryCount ?? 0
      this.relearnMoves = other.relearnMoves ?? [0, 0, 0, 0]
      this.handlerName = other.handlerName ?? ''
      this.handlerGender = other.handlerGender ?? false
      this.isCurrentHandler = other.isCurrentHandler ?? false
      this.handlerFriendship = other.handlerFriendship ?? 0

      if ('ribbons' in other) {
        const contestRibbons = lodash.intersection(other.ribbons, Gen34ContestRibbons)

        this.contestMemoryCount = Math.max(contestRibbons.length, this.contestMemoryCount)
        const battleRibbons = lodash.intersection(other.ribbons, Gen34TowerRibbons)

        this.battleMemoryCount = Math.max(battleRibbons.length, this.battleMemoryCount)
        this.ribbons = other.ribbons ?? []
      }

      if (other.handlerMemory) {
        this.handlerMemory = other.handlerMemory
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
      this.superTrainingFlags = other.superTrainingFlags ?? 0
      this.superTrainingDistFlags = other.superTrainingDistFlags ?? 0
      this.secretSuperTrainingUnlocked = other.secretSuperTrainingUnlocked ?? false
      this.secretSuperTrainingComplete = other.secretSuperTrainingComplete ?? false
      this.country = other.country ?? 0
      this.region = other.region ?? 0
      this.consoleRegion = other.consoleRegion ?? 0
      this.formArgument = other.formArgument ?? 0
      if (other.geolocations) {
        this.geolocations = other.geolocations
      }
      this.trainerAffection = other.trainerAffection ?? 0

      this.trainingBagHits = other.trainingBagHits ?? 0
      this.trainingBag = other.trainingBag

      this.fullness = other.fullness ?? 0
      this.enjoyment = other.enjoyment ?? 0

      this.hyperTraining = other.hyperTraining ?? {
        hp: false,
        atk: false,
        def: false,
        spe: false,
        spa: false,
        spd: false,
      }

      this.resortEventStatus = other.resortEventStatus ?? 0

      this.avs = other.avs ?? {
        hp: 0,
        atk: 0,
        def: 0,
        spe: 0,
        spa: 0,
        spd: 0,
      }

      this.handlerLanguage = other.handlerLanguage ?? 0
      this.handlerID = other.handlerID ?? 0
      this.statNature = other.statNature !== undefined ? other.statNature : this.nature
      this.affixedRibbon = other.affixedRibbon
      this.homeTracker = other.homeTracker ?? new Uint8Array(8)
      this.statNature = this.nature

      if (other.obedienceLevel !== undefined) {
        this.obedienceLevel = other.obedienceLevel
      }

      this.dynamaxLevel = other.dynamaxLevel ?? 0
      this.sociability = other.sociability ?? 0

      this.canGigantamax = other.canGigantamax ?? false

      this.palma = other.palma ?? 0

      if (other.trFlagsSwSh) {
        this.trFlagsSwSh = other.trFlagsSwSh
      }
      if (other.tmFlagsBDSP) {
        this.tmFlagsBDSP = other.tmFlagsBDSP
      }

      this.isAlpha = other.isAlpha || this.ribbons.includes('Alpha Mark')
      if (other.isAlpha && !this.ribbons.includes('Alpha Mark')) {
        this.ribbons = [...this.ribbons, 'Alpha Mark']
      }
      this.isNoble = other.isNoble ?? false
      this.alphaMove = other.alphaMove ?? 0
      this.gvs = other.gvs ?? gvsFromIVs(this.ivs)

      if (other.moveFlagsLA) {
        this.moveFlagsLA = other.moveFlagsLA
      }
      if (other.tutorFlagsLA) {
        this.tutorFlagsLA = other.tutorFlagsLA
      }
      if (other.masterFlagsLA) {
        this.masterFlagsLA = other.masterFlagsLA
      }
      if (other.flag2LA) {
        this.flag2LA = other.flag2LA
      }
      if (other.unknownA0) {
        this.unknownA0 = other.unknownA0
      }
      if (other.unknownF3) {
        this.unknownF3 = other.unknownF3
      }

      if (other.heightScalar !== undefined && other.weightScalar !== undefined) {
        this.heightScalar = other.heightScalar
        this.weightScalar = other.weightScalar
      }

      this.scale = other.scale ?? other.heightScalar ?? 0

      this.teraTypeOriginal =
        other.teraTypeOriginal ?? generateTeraType(prng, this.dexNum, this.formeNum)
      this.teraTypeOverride = other.teraTypeOverride ?? 19
      if (other.tmFlagsSV) {
        this.tmFlagsSV = other.tmFlagsSV
      }
    }
  }

  static getName() {
    return 'OHPKM'
  }

  public get format(): 'OHPKM' {
    return 'OHPKM'
  }

  public get encryptionConstant() {
    return bytesToUint32LittleEndian(this.bytes, 0x00)
  }

  public set encryptionConstant(value: number) {
    this.bytes.set(uint32ToBytesLittleEndian(value), 0x0)
  }

  public get sanity() {
    return bytesToUint16LittleEndian(this.bytes, 0x04)
  }

  public set sanity(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x4)
  }

  public get checksum() {
    return bytesToUint16LittleEndian(this.bytes, 0x06)
  }

  public set checksum(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x6)
  }

  public get dexNum() {
    return bytesToUint16LittleEndian(this.bytes, 0x08)
  }

  public set dexNum(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x8)
  }

  public get heldItemIndex() {
    return bytesToUint16LittleEndian(this.bytes, 0x0a)
  }

  public set heldItemIndex(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x0a)
  }

  public get heldItemName() {
    return ItemToString(this.heldItemIndex)
  }

  public set heldItemName(value: string) {
    const itemIndex = ItemFromString(value)

    if (itemIndex > -1) {
      this.heldItemIndex = itemIndex
    }
  }

  public get trainerID() {
    return bytesToUint16LittleEndian(this.bytes, 0x0c)
  }

  public set trainerID(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x0c)
  }

  public get secretID() {
    return bytesToUint16LittleEndian(this.bytes, 0x0e)
  }

  public set secretID(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x0e)
  }

  public get exp() {
    return bytesToUint32LittleEndian(this.bytes, 0x10)
  }

  public set exp(value: number) {
    this.bytes.set(uint32ToBytesLittleEndian(value), 0x10)
  }

  public get level() {
    return this.speciesMetadata?.calculateLevel(this.exp) ?? 1
  }

  public get abilityIndex() {
    return bytesToUint16LittleEndian(this.bytes, 0x14)
  }

  public set abilityIndex(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x14)
  }

  public get ability() {
    return AbilityToString(this.abilityIndex)
  }

  public set ability(value: string) {
    const abilityIndex = AbilityFromString(value)

    if (abilityIndex > -1) {
      this.abilityIndex = abilityIndex
    }
  }

  public get abilityNum() {
    return this.bytes[0x16] & 7
  }

  public set abilityNum(value: number) {
    this.bytes[0x16] = (this.bytes[0x16] & 0b11111000) | (value & 7)
  }

  public get favorite() {
    return getFlag(this.bytes, 0x16, 3)
  }

  public set favorite(value: boolean) {
    setFlag(this.bytes, 0x16, 3, value)
  }

  public get canGigantamax() {
    return getFlag(this.bytes, 0x16, 4)
  }

  public set canGigantamax(value: boolean) {
    setFlag(this.bytes, 0x16, 4, value)
  }

  public get isAlpha() {
    return getFlag(this.bytes, 0x16, 5)
  }

  public set isAlpha(value: boolean) {
    setFlag(this.bytes, 0x16, 5, value)
  }

  public get isNoble() {
    return getFlag(this.bytes, 0x16, 6)
  }

  public set isNoble(value: boolean) {
    setFlag(this.bytes, 0x16, 6, value)
  }

  public get isShadow() {
    return getFlag(this.bytes, 0x16, 7)
  }

  public set isShadow(value: boolean) {
    if (this.dexNum in ShadowIDsColosseum || this.dexNum in ShadowIDsXD) {
      setFlag(this.bytes, 0x16, 7, value)
      return
    }
    setFlag(this.bytes, 0x16, 7, false)
  }

  public get shadowID() {
    if (!this.isShadow) return 0
    if (this.dexNum in ShadowIDsColosseum) {
      return ShadowIDsColosseum[this.dexNum]
    }
    if (this.dexNum in ShadowIDsXD) {
      return ShadowIDsXD[this.dexNum]
    }
    return 0
  }

  public get markings() {
    return markingsSixShapesWithColorFromBytes(new DataView(this.bytes.buffer), 0x18)
  }

  public set markings(value: MarkingsSixShapesWithColor) {
    markingsSixShapesWithColorToBytes(new DataView(this.bytes.buffer), 0x18, value)
  }

  public get alphaMove() {
    return bytesToUint16LittleEndian(this.bytes, 0x1a)
  }

  public set alphaMove(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x1a)
  }

  public get personalityValue() {
    return bytesToUint32LittleEndian(this.bytes, 0x1c)
  }

  public set personalityValue(value: number) {
    this.bytes.set(uint32ToBytesLittleEndian(value), 0x1c)
  }

  public get nature() {
    return this.bytes[0x20]
  }

  public set nature(value: number) {
    this.bytes[0x20] = value
  }

  public get natureName() {
    return NatureToString(this.nature)
  }

  public get statNature() {
    return this.bytes[0x21]
  }

  public set statNature(value: number) {
    this.bytes[0x21] = value
  }

  public get isFatefulEncounter() {
    return !!(this.bytes[0x22] & 1)
  }

  public set isFatefulEncounter(value: boolean) {
    this.bytes[0x22] = (this.bytes[0x22] & 0xfe) | (value ? 1 : 0)
  }

  public get flag2LA() {
    return getFlag(this.bytes, 0x22, 1)
  }

  public set flag2LA(value: boolean) {
    setFlag(this.bytes, 0x22, 1, value)
  }

  public get gender() {
    return (this.bytes[0x22] >> 2) & 0x3
  }

  public set gender(value: number) {
    this.bytes[0x22] = (this.bytes[0x22] & 0xf3) | (value << 2)
  }

  public get formeNum() {
    return bytesToUint16LittleEndian(this.bytes, 0x24)
  }

  public set formeNum(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x24)
  }

  public get evs() {
    return {
      hp: this.bytes[0x26],
      atk: this.bytes[0x27],
      def: this.bytes[0x28],
      spa: this.bytes[0x29],
      spd: this.bytes[0x2a],
      spe: this.bytes[0x2b],
    }
  }

  public set evs(value: Stats) {
    this.bytes[0x26] = value.hp
    this.bytes[0x27] = value.atk
    this.bytes[0x28] = value.def
    this.bytes[0x29] = value.spa
    this.bytes[0x2a] = value.spd
    this.bytes[0x2b] = value.spe
  }

  public get contest() {
    return {
      cool: this.bytes[0x2c],
      beauty: this.bytes[0x2d],
      cute: this.bytes[0x2e],
      smart: this.bytes[0x2f],
      tough: this.bytes[0x30],
      sheen: this.bytes[0x31],
    }
  }

  public set contest(value: ContestStats) {
    this.bytes[0x2c] = value.cool
    this.bytes[0x2d] = value.beauty
    this.bytes[0x2e] = value.cute
    this.bytes[0x2f] = value.smart
    this.bytes[0x30] = value.tough
    this.bytes[0x31] = value.sheen
  }

  public get pokerusByte() {
    return this.bytes[0x32]
  }

  public set pokerusByte(value: number) {
    this.bytes[0x32] = value
  }

  public get contestMemoryCount() {
    return this.bytes[0x34]
  }

  public set contestMemoryCount(value: number) {
    this.bytes[0x34] = value
  }

  public get battleMemoryCount() {
    return this.bytes[0x35]
  }

  public set battleMemoryCount(value: number) {
    this.bytes[0x35] = value
  }

  public get ribbons() {
    const ribbons: string[] = []

    for (let i = 0; i < OpenHomeRibbons.length; i++) {
      if (getFlag(this.bytes, 0x36, i)) {
        ribbons.push(OpenHomeRibbons[i])
      }
    }
    return ribbons
  }

  public set ribbons(value: string[]) {
    this.bytes.set(new Uint8Array(16), 0x36)
    value.forEach((ribbon) => {
      const index = OpenHomeRibbons.indexOf(ribbon)

      if (index > -1) {
        setFlag(this.bytes, 0x36, index, true)
      }
    })
  }

  public get sociability() {
    return bytesToUint32LittleEndian(this.bytes, 0x4c)
  }

  public set sociability(value: number) {
    this.bytes.set(uint32ToBytesLittleEndian(value), 0x4c)
  }

  public get heightScalar() {
    return this.bytes[0x50]
  }

  public set heightScalar(value: number) {
    this.bytes[0x50] = value
  }

  public get weightScalar() {
    return this.bytes[0x51]
  }

  public set weightScalar(value: number) {
    this.bytes[0x51] = value
  }

  public get scale() {
    return this.bytes[0x52]
  }

  public set scale(value: number) {
    this.bytes[0x52] = value
  }

  public get moves() {
    return [
      bytesToUint16LittleEndian(this.bytes, 0x54),
      bytesToUint16LittleEndian(this.bytes, 0x56),
      bytesToUint16LittleEndian(this.bytes, 0x58),
      bytesToUint16LittleEndian(this.bytes, 0x5a),
    ]
  }

  public set moves(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes.set(uint16ToBytesLittleEndian(value[i]), 0x54 + 2 * i)
    }
  }

  public get movePP() {
    return [this.bytes[0x5c], this.bytes[0x5d], this.bytes[0x5e], this.bytes[0x5f]]
  }

  public set movePP(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes[0x5c + i] = value[i]
    }
  }

  public get nicknameBytes() {
    return this.bytes.slice(0x60, 26)
  }

  public get nickname() {
    return utf16BytesToString(this.bytes, 0x60, 12)
  }

  public set nickname(value: string) {
    const utfBytes = utf16StringToBytes(value, 12)

    this.bytes.set(utfBytes, 0x60)
  }

  public get avs() {
    return {
      hp: bytesToUint16LittleEndian(this.bytes, 0x7a),
      atk: bytesToUint16LittleEndian(this.bytes, 0x7c),
      def: bytesToUint16LittleEndian(this.bytes, 0x7e),
      spe: bytesToUint16LittleEndian(this.bytes, 0x80),
      spa: bytesToUint16LittleEndian(this.bytes, 0x82),
      spd: bytesToUint16LittleEndian(this.bytes, 0x84),
    }
  }

  public set avs(value: Stats) {
    this.bytes.set(uint16ToBytesLittleEndian(value.hp), 0x7a)
    this.bytes.set(uint16ToBytesLittleEndian(value.atk), 0x7c)
    this.bytes.set(uint16ToBytesLittleEndian(value.def), 0x7e)
    this.bytes.set(uint16ToBytesLittleEndian(value.spe), 0x80)
    this.bytes.set(uint16ToBytesLittleEndian(value.spa), 0x82)
    this.bytes.set(uint16ToBytesLittleEndian(value.spd), 0x84)
  }

  public get movePPUps() {
    return [this.bytes[0x86], this.bytes[0x87], this.bytes[0x88], this.bytes[0x89]]
  }

  public set movePPUps(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes[0x86 + i] = value[i]
    }
  }

  public get relearnMoves() {
    return [
      bytesToUint16LittleEndian(this.bytes, 0x8a),
      bytesToUint16LittleEndian(this.bytes, 0x8c),
      bytesToUint16LittleEndian(this.bytes, 0x8e),
      bytesToUint16LittleEndian(this.bytes, 0x90),
    ]
  }

  public set relearnMoves(value: number[]) {
    for (let i = 0; i < Math.min(value.length, 4); i++) {
      this.bytes.set(uint16ToBytesLittleEndian(value[i]), 0x8a + 2 * i)
    }
  }

  public get ivs() {
    const ivBytes = bytesToUint32LittleEndian(this.bytes, 0x94)

    return {
      hp: ivBytes & 0x1f,
      atk: (ivBytes >> 5) & 0x1f,
      def: (ivBytes >> 10) & 0x1f,
      spe: (ivBytes >> 15) & 0x1f,
      spa: (ivBytes >> 20) & 0x1f,
      spd: (ivBytes >> 25) & 0x1f,
    }
  }

  public set ivs(value: Stats) {
    writeIVsToBuffer(value, this.bytes, 0x94, this.isEgg, this.isNicknamed)
  }

  public get isEgg() {
    return getFlag(this.bytes, 0x94, 30)
  }

  public set isEgg(value: boolean) {
    setFlag(this.bytes, 0x94, 30, value)
  }

  public get isNicknamed() {
    return getFlag(this.bytes, 0x94, 31)
  }

  public set isNicknamed(value: boolean) {
    setFlag(this.bytes, 0x94, 31, value)
  }

  public get dynamaxLevel() {
    return this.bytes[0x98]
  }

  public set dynamaxLevel(value: number) {
    this.bytes[0x98] = value
  }

  public get teraTypeOriginal() {
    return this.bytes[0x99]
  }

  public set teraTypeOriginal(value: number) {
    this.bytes[0x99] = value
  }

  public get teraTypeOverride() {
    return this.bytes[0x9a]
  }

  public set teraTypeOverride(value: number) {
    this.bytes[0x9a] = value
  }

  public get statusCondition() {
    return 0
  }

  public get unknownA0() {
    return bytesToUint32LittleEndian(this.bytes, 0xa0)
  }

  public set unknownA0(value: number) {
    this.bytes.set(uint32ToBytesLittleEndian(value), 0xa0)
  }

  public get gvs() {
    return {
      hp: this.bytes[0xa4],
      atk: this.bytes[0xa5],
      def: this.bytes[0xa6],
      spe: this.bytes[0xa7],
      spa: this.bytes[0xa8],
      spd: this.bytes[0xa9],
    }
  }

  public set gvs(value: Stats) {
    this.bytes[0xa4] = value.hp
    this.bytes[0xa5] = value.atk
    this.bytes[0xa6] = value.def
    this.bytes[0xa7] = value.spa
    this.bytes[0xa8] = value.spd
    this.bytes[0xa9] = value.spe
  }

  public get dvs() {
    // big endian to be the same as gameboy games (ugh)
    const dvBytes = bytesToUint16BigEndian(this.bytes, 0xaa)

    return {
      spc: dvBytes & 0x0f,
      spe: (dvBytes >> 4) & 0x0f,
      def: (dvBytes >> 8) & 0x0f,
      atk: (dvBytes >> 12) & 0x0f,
      hp:
        (((dvBytes >> 12) & 1) << 3) |
        (((dvBytes >> 8) & 1) << 2) |
        (((dvBytes >> 4) & 1) << 1) |
        (dvBytes & 1),
    }
  }

  public set dvs(value: StatsPreSplit) {
    let dvBytes = value.atk & 0x0f

    dvBytes = (dvBytes << 4) | (value.def & 0x0f)
    dvBytes = (dvBytes << 4) | (value.spe & 0x0f)
    dvBytes = (dvBytes << 4) | (value.spc & 0x0f)
    // big endian to be the same as gameboy games (ugh)
    this.bytes.set(uint16ToBytesBigEndian(dvBytes), 0xaa)
  }

  public get heightAbsolute(): number {
    return getHeightCalculated(this)
  }

  public get weightAbsolute(): number {
    return getWeightCalculated(this)
  }

  public get handlerName() {
    return utf16BytesToString(this.bytes, 0xb8, 12)
  }

  public set handlerName(value: string) {
    const utfBytes = utf16StringToBytes(value, 12)

    this.bytes.set(utfBytes, 0xb8)
  }

  public get handlerLanguage() {
    return this.bytes[0xd3]
  }

  public set handlerLanguage(value: number) {
    this.bytes[0xd3] = value
  }

  public get isCurrentHandler() {
    return !!this.bytes[0xd4]
  }

  public set isCurrentHandler(value: boolean) {
    this.bytes[0xd4] = value ? 1 : 0
  }

  public get resortEventStatus() {
    return this.bytes[0xd5]
  }

  public set resortEventStatus(value: number) {
    this.bytes[0xd5] = value
  }

  public get handlerID() {
    return bytesToUint16LittleEndian(this.bytes, 0xd6)
  }

  public set handlerID(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0xd6)
  }

  public get handlerFriendship() {
    return this.bytes[0xd8]
  }

  public set handlerFriendship(value: number) {
    this.bytes[0xd8] = value
  }

  public get handlerMemory() {
    return {
      intensity: this.bytes[0xd9],
      memory: this.bytes[0xda],
      feeling: this.bytes[0xdb],
      textVariables: bytesToUint16LittleEndian(this.bytes, 0xdc),
    }
  }

  public set handlerMemory(value: Memory) {
    this.bytes[0xd9] = value.intensity
    this.bytes[0xda] = value.memory
    this.bytes[0xdb] = value.feeling
    this.bytes.set(uint16ToBytesLittleEndian(value.textVariables), 0xdc)
  }

  public get handlerAffection() {
    return this.bytes[0xde]
  }

  public set handlerAffection(value: number) {
    this.bytes[0xde] = value
  }

  public get superTrainingFlags() {
    return bytesToUint32LittleEndian(this.bytes, 0xdf)
  }

  public set superTrainingFlags(value: number) {
    this.bytes.set(uint32ToBytesLittleEndian(value), 0xdf)
  }

  public get superTrainingDistFlags() {
    return this.bytes[0xe3]
  }

  public set superTrainingDistFlags(value: number) {
    this.bytes[0xe3] = value
  }

  public get secretSuperTrainingUnlocked() {
    return getFlag(this.bytes, 0xe4, 0)
  }

  public set secretSuperTrainingUnlocked(value: boolean) {
    setFlag(this.bytes, 0xe4, 0, value)
  }

  public get secretSuperTrainingComplete() {
    return getFlag(this.bytes, 0xe4, 1)
  }

  public set secretSuperTrainingComplete(value: boolean) {
    setFlag(this.bytes, 0xe4, 1, value)
  }

  public get trainingBagHits() {
    return this.bytes[0xe5]
  }

  public set trainingBagHits(value: number) {
    this.bytes[0xe5] = value
  }

  public get trainingBag() {
    return this.bytes[0xe6] ?? undefined
  }

  public set trainingBag(value: number | undefined) {
    this.bytes[0xe6] = value ?? 0
  }

  public get palma() {
    return bytesToUint32LittleEndian(this.bytes, 0xe7)
  }

  public set palma(value: number) {
    this.bytes.set(uint32ToBytesLittleEndian(value), 0xe7)
  }

  public get pokeStarFame() {
    return this.bytes[0xe8]
  }

  public set pokeStarFame(value: number) {
    this.bytes[0xe8] = value
  }

  public get metTimeOfDay() {
    return this.bytes[0xe9]
  }

  public set metTimeOfDay(value: number) {
    this.bytes[0xe9] = (value ?? 0) & 0b11
  }

  public get handlerGender() {
    return getFlag(this.bytes, 0xea, 7)
  }

  public set handlerGender(value: boolean) {
    setFlag(this.bytes, 0xea, 7, value)
  }

  public get isNsPokemon() {
    return getFlag(this.bytes, 0xea, 6)
  }

  public set isNsPokemon(value: boolean) {
    setFlag(this.bytes, 0xea, 6, value)
  }

  public get shinyLeaves() {
    return this.bytes[0xea] & 0x3f
  }

  public set shinyLeaves(value: number) {
    this.bytes[0xea] = (this.bytes[0xea] & 0xc0) | (value & 0x3f)
  }

  public get fullness() {
    return this.bytes[0xeb]
  }

  public set fullness(value: number) {
    this.bytes[0xeb] = value
  }

  public get enjoyment() {
    return this.bytes[0xec]
  }

  public set enjoyment(value: number) {
    this.bytes[0xec] = value
  }

  public get gameOfOrigin() {
    return this.bytes[0xed]
  }

  public set gameOfOrigin(value: number) {
    this.bytes[0xed] = value
  }

  public get gameOfOriginBattle() {
    return this.bytes[0xee]
  }

  public set gameOfOriginBattle(value: number) {
    this.bytes[0xee] = value
  }

  // If met in a plugin save, this will be the save's plugin_identifier. otherwise this is empty
  public get pluginOrigin() {
    if (this.bytes[0x1b1] === 0) return undefined
    return utf16BytesToString(this.bytes, 0x1b1, 32)
  }

  public set pluginOrigin(value: string | undefined) {
    if (value === undefined) return
    const utfBytes = utf16StringToBytes(value, 32)

    this.bytes.set(utfBytes, 433)
  }

  public get country() {
    return this.bytes[0xef]
  }

  public set country(value: number) {
    this.bytes[0xef] = value
  }

  public get region() {
    return this.bytes[0xf0]
  }

  public set region(value: number) {
    this.bytes[0xf0] = value
  }

  public get consoleRegion() {
    return this.bytes[0xf0]
  }

  public set consoleRegion(value: number) {
    this.bytes[0xf0] = value
  }

  public get displayID() {
    return this.gameOfOrigin < GameOfOrigin.Sun
      ? this.trainerID
      : bytesToUint32LittleEndian(this.bytes, 0x0c) % 1000000
  }

  public get languageIndex() {
    return this.bytes[0xf2]
  }

  public get language() {
    return Languages.stringFromByte(this.languageIndex)
  }

  public set language(value: string) {
    const index = Languages.indexOf(value)

    if (index > -1) {
      this.bytes[0xf2] = index
    }
  }

  public get unknownF3() {
    return this.bytes[0xf3]
  }

  public set unknownF3(value: number) {
    this.bytes[0xf3] = value
  }

  public get formArgument() {
    return bytesToUint32LittleEndian(this.bytes, 0xf4)
  }

  public set formArgument(value: number) {
    this.bytes.set(uint32ToBytesLittleEndian(value), 0xf4)
  }

  public get affixedRibbon() {
    return this.bytes[0xf8] === 0xff ? undefined : this.bytes[0xf8]
  }

  public set affixedRibbon(value: number | undefined) {
    this.bytes[0xf8] = value ?? 0xff
  }

  public get geolocations() {
    return lodash.range(5).map((i) => ({
      region: this.bytes[0xf9 + 2 * i],
      country: this.bytes[0xfa + 2 * i],
    })) as [Geolocation, Geolocation, Geolocation, Geolocation, Geolocation]
  }

  public set geolocations(value: Geolocation[]) {
    value.forEach((geo, i) => {
      this.bytes[0xf9 + 2 * i] = geo.region
      this.bytes[0xfa + 2 * i] = geo.country
    })
  }

  public get encounterType() {
    return this.bytes[0x10e]
  }

  public set encounterType(value: number) {
    this.bytes[0x10e] = value
  }

  public set performance(value: number) {
    this.bytes[0x10f] = value
  }

  public get performance() {
    return this.bytes[0x10f]
  }

  public get trainerName() {
    return utf16BytesToString(this.bytes, 0x110, 12)
  }

  public set trainerName(value: string) {
    const utfBytes = utf16StringToBytes(value, 12)

    this.bytes.set(utfBytes, 0x110)
  }

  public get trainerFriendship() {
    return this.bytes[0x12a]
  }

  public set trainerFriendship(value: number) {
    this.bytes[0x12a] = value
  }

  public get trainerMemory() {
    return {
      intensity: this.bytes[0x12b],
      memory: this.bytes[0x12c],
      textVariables: bytesToUint16LittleEndian(this.bytes, 0x12d),
      feeling: this.bytes[0x12f],
    }
  }

  public set trainerMemory(value: Memory) {
    this.bytes[0x12b] = value.intensity
    this.bytes[0x12c] = value.memory
    this.bytes.set(uint16ToBytesLittleEndian(value.textVariables), 0x12d)
    this.bytes[0x12f] = value.feeling
  }

  public get trainerAffection() {
    return this.bytes[0x130]
  }

  public set trainerAffection(value: number) {
    this.bytes[0x130] = value
  }

  public get eggDate() {
    return this.bytes[0x131]
      ? {
          year: this.bytes[0x131] + 2000,
          month: this.bytes[0x132],
          day: this.bytes[0x133],
        }
      : undefined
  }

  public set eggDate(value: PKMDate | undefined) {
    if (value) {
      this.bytes[0x131] = value.year - 2000
      this.bytes[0x132] = value.month
      this.bytes[0x133] = value.day
    } else {
      this.bytes[0x131] = 0
      this.bytes[0x132] = 0
      this.bytes[0x133] = 0
    }
  }

  public get metDate() {
    return {
      year: this.bytes[0x134] + 2000,
      month: this.bytes[0x135],
      day: this.bytes[0x136],
    }
  }

  public set metDate(value: PKMDate) {
    this.bytes[0x134] = value.year - 2000
    this.bytes[0x135] = value.month
    this.bytes[0x136] = value.day
  }

  public get ball() {
    return this.bytes[0x137]
  }

  public set ball(value: number) {
    this.bytes[0x137] = value
  }

  public get eggLocationIndex() {
    return bytesToUint16LittleEndian(this.bytes, 0x138) ?? undefined
  }

  public set eggLocationIndex(value: number | undefined) {
    this.bytes.set(uint16ToBytesLittleEndian(value ?? 0), 0x138)
  }

  public get eggLocation() {
    if (!this.eggLocationIndex) return undefined
    return getMetLocation(this.metLocationIndex, { origin: this.gameOfOrigin })
  }

  public get metLocationIndex() {
    return bytesToUint16LittleEndian(this.bytes, 0x13a)
  }

  public set metLocationIndex(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x13a)
  }

  public get metLocation() {
    return getMetLocation(this.metLocationIndex, { origin: this.gameOfOrigin })
  }

  public get metLevel() {
    return this.bytes[0x13c] & ~0x80
  }

  public set metLevel(value: number) {
    this.bytes[0x13c] = (this.bytes[0x13c] & 0x80) | (value & ~0x80)
  }

  public get trainerGender() {
    return getFlag(this.bytes, 0x13c, 7)
  }

  public set trainerGender(value: boolean) {
    setFlag(this.bytes, 0x13c, 7, value)
  }

  public get hyperTraining() {
    return {
      hp: getFlag(this.bytes, 0x13d, 0),
      atk: getFlag(this.bytes, 0x13d, 1),
      def: getFlag(this.bytes, 0x13d, 2),
      spa: getFlag(this.bytes, 0x13d, 3),
      spd: getFlag(this.bytes, 0x13d, 4),
      spe: getFlag(this.bytes, 0x13d, 5),
    }
  }

  public set hyperTraining(value: HyperTrainStats) {
    setFlag(this.bytes, 0x13d, 0, value.hp)
    setFlag(this.bytes, 0x13d, 1, value.atk)
    setFlag(this.bytes, 0x13d, 2, value.def)
    setFlag(this.bytes, 0x13d, 3, value.spa)
    setFlag(this.bytes, 0x13d, 4, value.spd)
    setFlag(this.bytes, 0x13d, 5, value.spe)
  }

  public get obedienceLevel() {
    return this.bytes[0x13e]
  }

  public set obedienceLevel(value: number) {
    this.bytes[0x13e] = value
  }

  public get homeTracker() {
    return this.bytes.slice(0x13f, 0x14d + 8)
  }

  public set homeTracker(value: Uint8Array) {
    this.bytes.set(new Uint8Array(value.slice(0, 8)), 0x13f)
  }

  public get trFlagsSwSh() {
    return this.bytes.slice(0x146, 0x146 + 8)
  }

  public set trFlagsSwSh(value: Uint8Array) {
    this.bytes.set(new Uint8Array(value).slice(0, 14), 0x146)
  }

  public get tmFlagsBDSP() {
    return this.bytes.slice(0x154, 0x154 + 14)
  }

  public set tmFlagsBDSP(value: Uint8Array) {
    this.bytes.set(new Uint8Array(value), 0x154)
  }

  public get moveFlagsLA() {
    return this.bytes.slice(0x162, 0x162 + 14)
  }

  public set moveFlagsLA(value: Uint8Array) {
    this.bytes.set(new Uint8Array(value).slice(0, 14), 0x162)
  }

  public get tutorFlagsLA() {
    return this.bytes.slice(0x170, 0x170 + 8)
  }

  public set tutorFlagsLA(value: Uint8Array) {
    this.bytes.set(new Uint8Array(value).slice(0, 8), 0x170)
  }

  public get masterFlagsLA() {
    return this.bytes.slice(0x178, 0x178 + 8)
  }

  public set masterFlagsLA(value: Uint8Array) {
    this.bytes.set(new Uint8Array(value).slice(0, 8), 0x178)
  }

  public get tmFlagsSV() {
    return this.bytes.slice(0x180, 0x180 + 22)
  }

  public set tmFlagsSV(value: Uint8Array) {
    this.bytes.set(new Uint8Array(value).slice(0, 22), 0x180)
  }

  public get evsG12() {
    return {
      hp: bytesToUint16LittleEndian(this.bytes, 0x19a),
      atk: bytesToUint16LittleEndian(this.bytes, 0x19c),
      def: bytesToUint16LittleEndian(this.bytes, 0x19e),
      spe: bytesToUint16LittleEndian(this.bytes, 0x1a0),
      spc: bytesToUint16LittleEndian(this.bytes, 0x1a2),
    }
  }

  public set evsG12(value: StatsPreSplit) {
    this.bytes.set(uint16ToBytesLittleEndian(value.hp), 0x19a)
    this.bytes.set(uint16ToBytesLittleEndian(value.atk), 0x19c)
    this.bytes.set(uint16ToBytesLittleEndian(value.def), 0x19e)
    this.bytes.set(uint16ToBytesLittleEndian(value.spe), 0x1a0)
    this.bytes.set(uint16ToBytesLittleEndian(value.spc), 0x1a2)
  }

  public get tmFlagsSVDLC() {
    return this.bytes.slice(0x1a4, 0x1a4 + 13)
  }

  public set tmFlagsSVDLC(value: Uint8Array) {
    this.bytes.set(new Uint8Array(value).slice(0, 13), 0x1a4)
  }

  public get stats(): Stats {
    return {
      hp: getHPGen3Onward(this),
      atk: getStatGen3Onward('Atk', this),
      def: getStatGen3Onward('Def', this),
      spe: getStatGen3Onward('Spe', this),
      spa: getStatGen3Onward('SpA', this),
      spd: getStatGen3Onward('SpD', this),
    }
  }

  public get currentHP(): number {
    return this.stats.hp
  }

  public getLevel(): number {
    return this.level
  }

  public isShiny() {
    return (
      (this.trainerID ^
        this.secretID ^
        bytesToUint16LittleEndian(this.bytes, 0x1c) ^
        bytesToUint16LittleEndian(this.bytes, 0x1e)) <
      16
    )
  }

  public isSquareShiny() {
    return (
      (this.trainerID ^
        this.secretID ^
        bytesToUint16LittleEndian(this.bytes, 0x1c) ^
        bytesToUint16LittleEndian(this.bytes, 0x1e)) ===
      0
    )
  }

  public get metadata() {
    return MetadataLookup(this.dexNum, this.formeNum)
  }

  public get speciesMetadata() {
    return SpeciesLookup(this.dexNum)
  }

  public toBytes(): ArrayBuffer {
    return this.bytes.buffer as ArrayBuffer
  }

  public getStats(): Stats {
    return this.stats
  }

  public fixErrors(): boolean {
    let errorsFound = false

    // PLA mons cannot have been hatched
    if (
      this.gameOfOrigin === GameOfOrigin.LegendsArceus &&
      (this.eggDate || this.eggLocationIndex)
    ) {
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
    if (this.abilityIndex === 0) {
      this.ability = getAbilityFromNumber(this.dexNum, this.formeNum, this.abilityNum)
      this.abilityIndex = AbilityFromString(this.ability)
    }

    const metadata = this.metadata
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

    return errorsFound
  }

  public getHomeIdentifier() {
    return getHomeIdentifier(this)
  }

  public updateData(other: PKMInterface, isFromOT: boolean = false) {
    this.exp = other.exp

    this.moves = other.moves as [number, number, number, number]
    this.movePP = adjustMovePPBetweenFormats(this, other)
    this.movePPUps = other.movePPUps as [number, number, number, number]

    if (this.dexNum !== other.dexNum && isEvolution(this, other)) {
      this.dexNum = other.dexNum
    }

    if (this.dexNum === other.dexNum || isEvolution(this, other)) {
      this.formeNum = other.formeNum
    }

    if ('heldItemName' in other) {
      this.heldItemIndex = ItemFromString(other.heldItemName)
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

    if (isFromOT) {
      this.nickname = other.nickname
    }
  }
}

function extendUint8Array(array: Uint8Array, minLength: number) {
  if (array.length >= minLength) {
    return array
  }

  const extendedArray = new Uint8Array(minLength)

  extendedArray.set(array)

  return extendedArray
}

type MarkingShape = keyof MarkingsSixShapesWithColor
