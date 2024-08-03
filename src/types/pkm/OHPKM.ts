import * as lodash from 'lodash'
import {
  MarkingsSixShapesWithColor,
  PKM,
  Stats,
  markingsHaveColor,
  markingsSixShapesWithColorFromBytes,
  markingsSixShapesWithColorFromOther,
  markingsSixShapesWithColorToBytes,
} from 'pokemon-files'
import {
  AbilityFromString,
  AbilityToString,
  Ball,
  GameOfOrigin,
  ItemFromString,
  ItemToString,
  Languages,
  NatureToString,
  getMetLocation,
} from 'pokemon-resources'
import { NationalDex } from 'pokemon-species-data'
import Prando from 'prando'
import { Gen34ContestRibbons, Gen34TowerRibbons, OpenHomeRibbons } from '../../consts'
import { ShadowIDsColosseum, ShadowIDsXD } from '../../consts/ShadowIDs'
import {
  bytesToUint16BigEndian,
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
  getFlag,
  setFlag,
  uint16ToBytesBigEndian,
  uint16ToBytesLittleEndian,
  uint32ToBytesLittleEndian,
} from '../../util/ByteLogic'
import { getHPGen3Onward, getLevelGen3Onward, getStatGen3Onward } from '../../util/StatCalc'
import { utf16BytesToString, utf16StringToBytes } from '../../util/Strings/StringConverter'
import { hasGen2OnData } from '../interfaces/gen2'
import { hasGen3OnData, hasOrreData } from '../interfaces/gen3'
import { hasGen4OnData } from '../interfaces/gen4'
import { hasGen5OnlyData } from '../interfaces/gen5'
import { hasGen6OnData, hasMemoryData, hasN3DSOnlyData } from '../interfaces/gen6'
import { hasGen7OnData } from '../interfaces/gen7'
import { hasGen8OnData, hasPLAData } from '../interfaces/gen8'
import { hasGen9OnlyData } from '../interfaces/gen9'
import { hasGameBoyData } from '../interfaces/stats'
import {
  contestStats,
  geolocation,
  hyperTrainStats,
  memory,
  pokedate,
  stats,
  statsPreSplit,
} from '../types'
import {
  adjustMovePPBetweenFormats,
  dvsFromIVs,
  generatePersonalityValuePreservingAttributes,
  generateTeraType,
  getAbilityFromNumber,
  gvsFromIVs,
  ivsFromDVs,
  writeIVsToBuffer,
} from './util'

export class OHPKM {
  static fromBytes(bytes: ArrayBuffer) {
    return new OHPKM(bytes)
  }

  public get fileSize() {
    return 433
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

  bytes = new Uint8Array(433)

  constructor(arg: PKM | OHPKM | ArrayBuffer) {
    if (arg instanceof ArrayBuffer) {
      this.bytes = new Uint8Array(arg)
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
      } else {
        prng = new Prando(
          other.trainerName.concat(JSON.stringify(other.dvs)).concat(other.trainerID.toString())
        )
      }

      this.dexNum = other.dexNum
      this.formeNum = other.formeNum ?? 0
      this.heldItemIndex = other.heldItemIndex
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

      if (hasGen2OnData(other)) {
        this.gender = other.gender
        if ('pokerusByte' in other) {
          this.pokerusByte = other.pokerusByte
          this.trainerFriendship = other.trainerFriendship
        }
        if ('isEgg' in other) {
          this.isEgg = other.isEgg
        }
      }

      if (hasGen3OnData(other)) {
        this.personalityValue = other.personalityValue
        this.isFatefulEncounter = other.isFatefulEncounter
        this.nature = other.nature ?? 0
        this.ivs = other.ivs
        this.evs = other.evs
        this.contest =
          'contest' in other
            ? other.contest
            : {
                beauty: 0,
                smart: 0,
                cool: 0,
                tough: 0,
                cute: 0,
                sheen: 0,
              }
        this.abilityNum = other.abilityNum ?? 0
        this.ball = other.ball
        this.markings = markingsSixShapesWithColorFromOther(other.markings)

        this.dvs = dvsFromIVs(other.ivs, other.isShiny())
        if (other.dexNum === NationalDex.Unown) {
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
      } else if (hasGameBoyData(other)) {
        this.personalityValue = generatePersonalityValuePreservingAttributes(other, prng)
        this.nature = this.personalityValue % 25
        this.ivs = ivsFromDVs(other.dvs)
        this.evsG12 = other.evsG12
        this.dvs = other.dvs
        this.abilityNum = 4
        this.ball = Ball.Poke

        if ('metTimeOfDay' in other) {
          this.metTimeOfDay = other.metTimeOfDay
          this.metLocationIndex = other.metLocationIndex
          this.metLevel = other.metLevel
        } else {
          this.metLevel = 0
        }

        if (other.dexNum === NationalDex.Mew || other.dexNum === NationalDex.Celebi) {
          this.isFatefulEncounter = true
        }
      }

      this.ability = getAbilityFromNumber(this.dexNum, this.formeNum, this.abilityNum)
      this.abilityIndex = AbilityFromString(this.ability)

      if (hasOrreData(other)) this.isShadow = other.isShadow

      if ('encryptionConstant' in other) {
        this.encryptionConstant = other.encryptionConstant
      } else if ('personalityValue' in other) {
        this.encryptionConstant = other.personalityValue
      } else {
        this.encryptionConstant = prng.nextInt(0, 0xffffffff)
      }

      if ('metDate' in other && other.metDate) {
        this.metDate = other.metDate
      } else {
        const now = new Date()
        this.metDate = {
          month: now.getMonth() + 1,
          day: now.getDate(),
          year: now.getFullYear(),
        }
      }

      if (hasGen4OnData(other)) {
        this.isNicknamed = other.isNicknamed
        this.eggDate = other.eggDate
        this.eggLocationIndex = other.eggLocationIndex
      }

      if ('encounterType' in other) {
        this.encounterType = other.encounterType
      }

      if ('shinyLeaves' in other) {
        this.shinyLeaves = other.shinyLeaves
        this.performance = other.performance
      }

      if (hasGen5OnlyData(other)) {
        this.pokeStarFame = other.pokeStarFame
        this.isNsPokemon = !!other.isNsPokemon
      }

      if (hasGen6OnData(other)) {
        this.contestMemoryCount = other.contestMemoryCount
        this.battleMemoryCount = other.battleMemoryCount
        this.relearnMoves = other.relearnMoves
        this.ribbons = other.ribbons
        this.handlerName = other.handlerName
        this.handlerGender = other.handlerGender
        this.isCurrentHandler = other.isCurrentHandler
        this.handlerFriendship = other.handlerFriendship
      } else if ('ribbons' in other) {
        const contestRibbons = lodash.intersection(other.ribbons, Gen34ContestRibbons)
        this.contestMemoryCount = Math.max(contestRibbons.length, this.contestMemoryCount)
        const battleRibbons = lodash.intersection(other.ribbons, Gen34TowerRibbons)
        this.battleMemoryCount = Math.max(battleRibbons.length, this.battleMemoryCount)
        this.ribbons = other.ribbons ?? []
      }

      if (hasMemoryData(other)) {
        this.handlerMemory = other.handlerMemory
        this.trainerMemory = other.trainerMemory
      }

      if (this.contestMemoryCount) {
        this.ribbons.push('Contest Memory')
      }
      if (this.battleMemoryCount) {
        this.ribbons.push('Battle Memory')
      }

      if (hasN3DSOnlyData(other)) {
        this.handlerAffection = other.handlerAffection
        this.superTrainingFlags = other.superTrainingFlags
        this.superTrainingDistFlags = other.superTrainingDistFlags
        this.secretSuperTrainingUnlocked = other.secretSuperTrainingUnlocked
        this.secretSuperTrainingComplete = other.secretSuperTrainingComplete

        this.country = other.country
        this.region = other.region
        this.consoleRegion = other.consoleRegion
        this.formArgument = other.formArgument
        this.geolocations = other.geolocations

        this.trainerAffection = other.trainerAffection
      }

      if ('trainingBagHits' in other) {
        this.trainingBagHits = other.trainingBagHits
        this.trainingBag = other.trainingBag
      }

      if ('fullness' in other) {
        this.fullness = other.fullness
        this.enjoyment = other.enjoyment
      }
      if (hasGen7OnData(other)) {
        this.hyperTraining = other.hyperTraining
      }

      if ('resortEventStatus' in other) {
        this.resortEventStatus = other.resortEventStatus
      }
      if ('avs' in other) {
        this.avs = other.avs
      }

      if (hasGen8OnData(other)) {
        this.handlerLanguage = other.handlerLanguage
        this.handlerID = other.handlerID
        this.statNature = other.statNature
        this.affixedRibbon = other.affixedRibbon
        this.homeTracker = other.homeTracker
      } else {
        this.statNature = this.nature
      }

      if ('dynamaxLevel' in other) {
        this.dynamaxLevel = other.dynamaxLevel
        this.sociability = other.sociability
      }
      if ('canGigantamax' in other) {
        this.canGigantamax = other.canGigantamax
      }
      if ('palma' in other) {
        this.palma = other.palma
      }

      if ('trFlagsSwSh' in other) {
        this.trFlagsSwSh = other.trFlagsSwSh
      }
      if ('tmFlagsBDSP' in other) {
        this.tmFlagsBDSP = other.tmFlagsBDSP
      }

      if (hasPLAData(other)) {
        this.isAlpha = other.isAlpha
        if (other.isAlpha && !this.ribbons.includes('Alpha Mark')) {
          this.ribbons = [...this.ribbons, 'Alpha Mark']
        }
        this.isNoble = other.isNoble
        this.alphaMove = other.alphaMove
        this.gvs = other.gvs
        this.moveFlagsLA = other.moveFlagsLA
        this.tutorFlagsLA = other.tutorFlagsLA
        this.masterFlagsLA = other.masterFlagsLA
        this.flag2LA = other.flag2LA
        this.unknownA0 = other.unknownA0
        this.unknownF3 = other.unknownF3
        this.heightAbsoluteBytes = other.heightAbsoluteBytes
        this.weightAbsoluteBytes = other.weightAbsoluteBytes
      } else {
        this.gvs = gvsFromIVs(this.ivs)
      }

      if ('weight' in other) {
        this.height = other.height
        this.weight = other.weight
      }

      if ('scale' in other) {
        this.scale = other.scale ?? 0
      }

      if (hasGen9OnlyData(other)) {
        this.teraTypeOriginal = other.teraTypeOriginal
        this.teraTypeOverride = other.teraTypeOverride
        this.tmFlagsSV = other.tmFlagsSV
        this.obedienceLevel = other.obedienceLevel
      } else {
        this.teraTypeOriginal = generateTeraType(prng, this.dexNum, this.formeNum)
        this.teraTypeOverride = this.teraTypeOriginal
      }
    }
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
    return getLevelGen3Onward(this.dexNum, this.exp)
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

  public set evs(value: stats) {
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

  public set contest(value: contestStats) {
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

  public get height() {
    return this.bytes[0x50]
  }

  public set height(value: number) {
    this.bytes[0x50] = value
  }

  public get weight() {
    return this.bytes[0x51]
  }

  public set weight(value: number) {
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

  public set relearnMoves(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
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

  public set ivs(value: stats) {
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

  public set gvs(value: stats) {
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

  public set dvs(value: statsPreSplit) {
    let dvBytes = value.atk & 0x0f
    dvBytes = (dvBytes << 4) | (value.def & 0x0f)
    dvBytes = (dvBytes << 4) | (value.spe & 0x0f)
    dvBytes = (dvBytes << 4) | (value.spc & 0x0f)
    // big endian to be the same as gameboy games (ugh)
    this.bytes.set(uint16ToBytesBigEndian(dvBytes), 0xaa)
  }

  public get heightAbsoluteBytes() {
    return this.bytes.slice(0xac, 0xb0)
  }

  public set heightAbsoluteBytes(value: Uint8Array) {
    this.bytes.set(value, 0xac)
  }

  public get heightAbsolute() {
    return Buffer.from(this.heightAbsoluteBytes).readFloatLE()
  }

  public get weightAbsoluteBytes() {
    return this.bytes.slice(0xb0, 0xb4)
  }

  public set weightAbsoluteBytes(value: Uint8Array) {
    this.bytes.set(value, 0xb0)
  }

  public get weightAbsolute() {
    return Buffer.from(this.weightAbsoluteBytes).readFloatLE()
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

  public set handlerMemory(value: memory) {
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
    return Languages[this.languageIndex]
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
    })) as [geolocation, geolocation, geolocation, geolocation, geolocation]
  }

  public set geolocations(
    value: [geolocation, geolocation, geolocation, geolocation, geolocation]
  ) {
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

  public set trainerMemory(value: memory) {
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

  public set eggDate(value: pokedate | undefined) {
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

  public set metDate(value: pokedate) {
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

  public set hyperTraining(value: hyperTrainStats) {
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
    return this.bytes.slice(0x13f, 0x14d + 8).buffer
  }

  public set homeTracker(value: ArrayBuffer) {
    this.bytes.set(new Uint8Array(value.slice(0, 8)), 0x13f)
  }

  public get trFlagsSwSh() {
    return this.bytes.slice(0x146, 0x146 + 8).buffer
  }

  public set trFlagsSwSh(value: ArrayBuffer) {
    this.bytes.set(new Uint8Array(value).slice(0, 14), 0x146)
  }

  public get tmFlagsBDSP() {
    return this.bytes.slice(0x154, 0x154 + 14).buffer
  }

  public set tmFlagsBDSP(value: ArrayBuffer) {
    this.bytes.set(new Uint8Array(value), 0x154)
  }

  public get moveFlagsLA() {
    return this.bytes.slice(0x162, 0x162 + 14).buffer
  }

  public set moveFlagsLA(value: ArrayBuffer) {
    this.bytes.set(new Uint8Array(value).slice(0, 14), 0x162)
  }

  public get tutorFlagsLA() {
    return this.bytes.slice(0x170, 0x170 + 8).buffer
  }

  public set tutorFlagsLA(value: ArrayBuffer) {
    this.bytes.set(new Uint8Array(value).slice(0, 8), 0x170)
  }

  public get masterFlagsLA() {
    return this.bytes.slice(0x178, 0x178 + 8).buffer
  }

  public set masterFlagsLA(value: ArrayBuffer) {
    this.bytes.set(new Uint8Array(value).slice(0, 8), 0x178)
  }

  public get tmFlagsSV() {
    return this.bytes.slice(0x180, 0x180 + 22).buffer
  }

  public set tmFlagsSV(value: ArrayBuffer) {
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

  public set evsG12(value: statsPreSplit) {
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
    this.bytes.set(value.slice(0, 13), 0x1a4)
  }

  public get stats(): stats {
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

  public toBytes() {
    return this.bytes.buffer
  }

  public updateData(other: PKM | OHPKM, isFromOT: boolean = false) {
    this.exp = other.exp

    this.moves = other.moves as [number, number, number, number]
    this.movePP = adjustMovePPBetweenFormats(this, other)
    this.movePPUps = other.movePPUps as [number, number, number, number]

    if ('avs' in other) {
      this.avs = other.avs
    } else if ('evs' in other) {
      this.evs = other.evs
      this.ribbons = lodash.uniq([...this.ribbons, ...(other.ribbons ?? [])])
      this.contest = other.contest
      const otherMarkings = other.markings
      if (markingsHaveColor(otherMarkings)) {
        this.markings = otherMarkings
      } else {
        for (const [markingType, markingVal] of Object.entries(otherMarkings)) {
          if (markingVal && this.markings[markingType] === null) {
            this.markings[markingType] = 'blue'
          } else if (!markingVal && this.markings[markingType]) {
            this.markings[markingType] = null
          }
        }
      }
    } else {
      this.evsG12 = other.evsG12
    }

    // memory ribbons need to be updated if new ribbons were earned to add to the count
    const contestRibbons = lodash.intersection(this.ribbons, Gen34ContestRibbons)
    this.contestMemoryCount = Math.max(contestRibbons.length, this.contestMemoryCount)
    const battleRibbons = lodash.intersection(this.ribbons, Gen34TowerRibbons)
    this.battleMemoryCount = Math.max(battleRibbons.length, this.battleMemoryCount)

    if (hasGen2OnData(other)) {
      if ('pokerusByte' in other) {
        this.pokerusByte = other.pokerusByte
      }
      if ('trainerFriendship' in other) {
        this.trainerFriendship = Math.max(other.trainerFriendship, this.trainerFriendship)
      }
    }

    if ('shinyLeaves' in other) {
      this.shinyLeaves = other.shinyLeaves
      this.performance = other.performance
    }

    if (hasGen5OnlyData(other)) {
      this.pokeStarFame = other.pokeStarFame
      this.isNsPokemon = !!other.isNsPokemon
    }

    if (hasGen6OnData(other)) {
      this.handlerName = other.handlerName
      this.handlerGender = other.handlerGender
      this.isCurrentHandler = other.isCurrentHandler
      this.handlerFriendship = other.handlerFriendship
    }

    if (hasMemoryData(other)) {
      this.handlerMemory = other.handlerMemory
      this.trainerMemory = other.trainerMemory
    }

    if (hasN3DSOnlyData(other)) {
      this.handlerAffection = other.handlerAffection
      this.superTrainingFlags = other.superTrainingFlags
      this.superTrainingDistFlags = other.superTrainingDistFlags
      this.secretSuperTrainingUnlocked = other.secretSuperTrainingUnlocked
      this.secretSuperTrainingComplete = other.secretSuperTrainingComplete

      this.country = other.country
      this.region = other.region
      this.consoleRegion = other.consoleRegion
      this.formArgument = other.formArgument
      this.geolocations = other.geolocations

      this.trainerAffection = other.trainerAffection
    }

    if ('trainingBagHits' in other) {
      this.trainingBagHits = other.trainingBagHits
      this.trainingBag = other.trainingBag
    }

    if ('statNature' in other) {
      this.statNature = other.statNature
      this.gameOfOriginBattle = other.gameOfOriginBattle
    }

    if (hasGen9OnlyData(other)) {
      this.teraTypeOverride = other.teraTypeOverride
      this.tmFlagsSV = other.tmFlagsSV
      this.obedienceLevel = other.obedienceLevel
    }

    if (isFromOT) {
      this.nickname = other.nickname
    }
    // other.moves.forEach((move, i) => {

    // })
  }
}
