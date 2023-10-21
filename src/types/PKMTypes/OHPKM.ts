import _, { uniq } from 'lodash'
import Prando from 'prando'
import {
  Ball,
  GameOfOrigin,
  Gen34ContestRibbons,
  Gen34TowerRibbons,
  Languages,
  NDex,
  OpenHomeRibbons,
} from '../../consts'
import { getLocation } from '../../consts/MetLocation/MetLocation'
import { ShadowIDsColosseum, ShadowIDsXD } from '../../consts/ShadowIDs'
import { ItemFromString, ItemToString } from '../../resources/gen/items/Items'
import { AbilityFromString, AbilityToString } from '../../resources/gen/other/Abilities'
import {
  contestStats,
  geolocation,
  hyperTrainStats,
  marking,
  memory,
  pokedate,
  stats,
  statsPreSplit,
} from '../../types/types'
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
import { BasePKMData } from '../interfaces/base'
import { Gen2OnlyData, hasGen2OnData } from '../interfaces/gen2'
import { Gen3OrreData, hasGen3OnData, hasOrreData } from '../interfaces/gen3'
import { Gen4EncounterType, Gen4OnlyData, hasGen4OnData, hasGen4OnlyData } from '../interfaces/gen4'
import { Gen5OnlyData, hasGen5OnlyData } from '../interfaces/gen5'
import { hasGen6OnData, hasN3DSOnlyData } from '../interfaces/gen6'
import { hasGen7OnData } from '../interfaces/gen7'
import { Gen8OnData, Gen8OnlyData, PLAData, hasGen8OnData, hasPLAData } from '../interfaces/gen8'
import { Gen9OnlyData, hasGen9OnlyData } from '../interfaces/gen9'
import { GameBoyStats } from '../interfaces/stats'
import { GamePKM } from './GamePKM'
import {
  adjustMovePPBetweenFormats,
  dvsFromIVs,
  formatHasColorMarkings,
  generatePersonalityValuePreservingAttributes,
  generateTeraType,
  getAbilityFromNumber,
  gvsFromIVs,
  ivsFromDVs,
  writeIVsToBuffer,
} from './util'

export class OHPKM
  implements
    BasePKMData,
    Gen2OnlyData,
    Gen3OrreData,
    GameBoyStats,
    Gen4OnlyData,
    Gen4EncounterType,
    Gen5OnlyData,
    Gen8OnData,
    Gen8OnlyData,
    Gen9OnlyData,
    PLAData
{
  public get fileSize() {
    return 433
  }

  get markingCount(): number {
    return 6
  }

  get markingColors(): number {
    return 2
  }

  bytes = new Uint8Array(433)

  constructor(bytes?: Uint8Array, other?: GamePKM) {
    if (bytes) {
      this.bytes = bytes
    } else if (other) {
      let prng: Prando
      if ('personalityValue' in other) {
        prng = new Prando(
          other.trainerName
            .concat(other.personalityValue.toString())
            .concat(other.secretID.toString())
            .concat(other.trainerID.toString())
        )
      } else {
        prng = new Prando(
          other.trainerName.concat(JSON.stringify(other.dvs)).concat(other.trainerID.toString())
        )
      }

      this.dexNum = other.dexNum
      this.formNum = other.formNum
      this.heldItem = other.heldItem
      this.trainerName = other.trainerName
      this.trainerGender = other.trainerGender
      this.trainerID = other.trainerID
      this.secretID = other.secretID
      this.exp = other.exp

      this.moves = other.moves
      this.movePP = adjustMovePPBetweenFormats(this, other)
      this.movePPUps = other.movePPUps
      this.nickname = other.nickname
      this.language = other.language
      this.gameOfOrigin = other.gameOfOrigin

      if (hasGen2OnData(other)) {
        this.gender = other.gender
        this.pokerusByte = other.pokerusByte
        this.isEgg = other.isEgg
        this.trainerFriendship = other.trainerFriendship
      }

      if (hasGen3OnData(other)) {
        this.personalityValue = other.personalityValue
        this.isFatefulEncounter = other.isFatefulEncounter
        this.nature = other.nature
        this.ivs = other.ivs
        this.evs = other.evs
        this.contest = other.contest
        this.abilityNum = other.abilityNum
        this.ball = other.ball

        other.markings.forEach((value, index) => {
          const temp = this.markings
          temp[index] = value
          this.markings = temp
        })

        this.dvs = dvsFromIVs(other.ivs, other.isShiny)
        if (other.dexNum === NDex.UNOWN) {
          const letterBits = other.formNum * 10
          const newDvs = this.dvs
          newDvs.atk = (newDvs.atk & 0b1001) | (((letterBits >> 6) & 0b11) << 1)
          newDvs.def = (newDvs.def & 0b1001) | (((letterBits >> 4) & 0b11) << 1)
          newDvs.spe = (newDvs.spe & 0b1001) | (((letterBits >> 2) & 0b11) << 1)
          newDvs.spc = (newDvs.spc & 0b1001) | ((letterBits & 0b11) << 1)
          this.dvs = newDvs
        }
        this.metLocationIndex = other.metLocationIndex
        this.metLevel = other.metLevel
      } else {
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

        if (other.dexNum === NDex.MEW || other.dexNum === NDex.CELEBI) {
          this.isFatefulEncounter = true
        }
      }

      this.ability = getAbilityFromNumber(this.dexNum, this.formNum, this.abilityNum)
      this.abilityIndex = AbilityFromString(this.ability)

      if (hasOrreData(other)) this.isShadow = other.isShadow

      if ('encryptionConstant' in other) {
        this.encryptionConstant = other.encryptionConstant
      } else if ('personalityValue' in other) {
        this.encryptionConstant = other.personalityValue
      } else {
        this.encryptionConstant = prng.nextInt(0, 0xffffffff)
      }

      if (hasGen4OnData(other)) {
        this.isNicknamed = other.isNicknamed
        this.metDate = other.metDate
        this.eggDate = other.eggDate
        this.eggLocationIndex = other.eggLocationIndex
      } else {
        const now = new Date()
        this.metDate = {
          month: now.getMonth(),
          day: now.getDate(),
          year: now.getFullYear(),
        }
      }

      if ('encounterType' in other) {
        this.encounterType = other.encounterType
      }

      if (hasGen4OnlyData(other)) {
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
        this.handlerMemory = other.handlerMemory
        this.trainerMemory = other.trainerMemory
      } else if ('ribbons' in other) {
        const contestRibbons = _.intersection(other.ribbons, Gen34ContestRibbons)
        this.contestMemoryCount = Math.max(contestRibbons.length, this.contestMemoryCount)
        const battleRibbons = _.intersection(other.ribbons, Gen34TowerRibbons)
        this.battleMemoryCount = Math.max(battleRibbons.length, this.battleMemoryCount)
        this.ribbons = other.ribbons
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

      if ('height' in other) {
        this.height = other.height
        this.weight = other.weight
      }

      if ('scale' in other) {
        this.scale = other.scale
      }

      if (hasGen9OnlyData(other)) {
        this.teraTypeOriginal = other.teraTypeOriginal
        this.teraTypeOverride = other.teraTypeOverride
        this.tmFlagsSV = other.tmFlagsSV
        this.obedienceLevel = other.obedienceLevel
      } else {
        this.teraTypeOriginal = generateTeraType(prng, this.dexNum, this.formNum)
        this.teraTypeOverride = 0x13
      }
    }
  }

  public get format() {
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

  public get heldItem() {
    return ItemToString(this.heldItemIndex)
  }

  public set heldItem(value: string) {
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
    const markingsValue = bytesToUint16LittleEndian(this.bytes, 0x18)
    return [
      markingsValue & 3,
      (markingsValue >> 2) & 3,
      (markingsValue >> 4) & 3,
      (markingsValue >> 6) & 3,
      (markingsValue >> 8) & 3,
      (markingsValue >> 10) & 3,
    ] as any as [marking, marking, marking, marking, marking, marking]
  }

  public set markings(value: [marking, marking, marking, marking, marking, marking]) {
    let markingsValue = 0
    for (let i = 0; i < 6; i++) {
      const shift = i * 2
      markingsValue = (markingsValue & (0xffff ^ (3 << shift))) | (value[i] << shift)
    }
    this.bytes.set(uint16ToBytesLittleEndian(markingsValue), 0x18)
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

  public get formNum() {
    return bytesToUint16LittleEndian(this.bytes, 0x24)
  }

  public set formNum(value: number) {
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

  public set avs(value: stats) {
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

  public get handlerLanguageIndex() {
    return this.bytes[0xd3]
  }

  public get handlerLanguage() {
    return Languages[this.languageIndex]
  }

  public set handlerLanguage(value: string) {
    const index = Languages.indexOf(value)
    if (index > -1) {
      this.bytes[0xd3] = index
    }
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
    return this.bytes[0xe6]
  }

  public set trainingBag(value: number) {
    this.bytes[0xe6] = value
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
    return _.range(5).map((i) => ({
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
    return bytesToUint16LittleEndian(this.bytes, 0x138)
  }

  public set eggLocationIndex(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x138)
  }

  public get eggLocation() {
    if (!this.eggLocationIndex) return undefined
    return getLocation(this.gameOfOrigin, this.eggLocationIndex, this.format, true)
  }

  public get metLocationIndex() {
    return bytesToUint16LittleEndian(this.bytes, 0x13a)
  }

  public set metLocationIndex(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x13a)
  }

  public get metLocation() {
    return getLocation(this.gameOfOrigin, this.metLocationIndex, this.format, false)
  }

  public get metLevel() {
    return this.bytes[0x13c] & ~0x80
  }

  public set metLevel(value: number) {
    this.bytes[0x13c] = (this.bytes[0x13c] & 0x80) | (value & ~0x80)
  }

  public get trainerGender() {
    return getFlag(this.bytes, 0x13c, 7) ? 1 : 0
  }

  public set trainerGender(value: number) {
    setFlag(this.bytes, 0x13c, 7, !!value)
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
    return this.bytes.slice(0x13f, 0x14d + 8)
  }

  public set homeTracker(value: Uint8Array) {
    this.bytes.set(value.slice(0, 8), 0x13f)
  }

  public get trFlagsSwSh() {
    return this.bytes.slice(0x146, 0x146 + 8)
  }

  public set trFlagsSwSh(value: Uint8Array) {
    this.bytes.set(value.slice(0, 14), 0x146)
  }

  public get tmFlagsBDSP() {
    return this.bytes.slice(0x154, 0x154 + 14)
  }

  public set tmFlagsBDSP(value: Uint8Array) {
    this.bytes.set(value.slice(0, 14), 0x154)
  }

  public get moveFlagsLA() {
    return this.bytes.slice(0x162, 0x162 + 14)
  }

  public set moveFlagsLA(value: Uint8Array) {
    this.bytes.set(value.slice(0, 14), 0x162)
  }

  public get tutorFlagsLA() {
    return this.bytes.slice(0x170, 0x170 + 8)
  }

  public set tutorFlagsLA(value: Uint8Array) {
    this.bytes.set(value.slice(0, 8), 0x170)
  }

  public get masterFlagsLA() {
    return this.bytes.slice(0x178, 0x178 + 8)
  }

  public set masterFlagsLA(value: Uint8Array) {
    this.bytes.set(value.slice(0, 8), 0x178)
  }

  public get tmFlagsSV() {
    return this.bytes.slice(0x180, 0x180 + 22)
  }

  public set tmFlagsSV(value: Uint8Array) {
    this.bytes.set(value.slice(0, 22), 0x180)
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

  public get isShiny() {
    return (
      (this.trainerID ^
        this.secretID ^
        bytesToUint16LittleEndian(this.bytes, 0x1c) ^
        bytesToUint16LittleEndian(this.bytes, 0x1e)) <
      16
    )
  }

  public get isSquareShiny() {
    return (
      (this.trainerID ^
        this.secretID ^
        bytesToUint16LittleEndian(this.bytes, 0x1c) ^
        bytesToUint16LittleEndian(this.bytes, 0x1e)) ===
      0
    )
  }

  public updateData(other: GamePKM, isFromOT: boolean = false) {
    this.exp = other.exp

    this.moves = other.moves
    this.movePP = adjustMovePPBetweenFormats(this, other)
    this.movePPUps = other.movePPUps

    if ('avs' in other) {
      this.avs = other.avs
    } else if (hasGen3OnData(other)) {
      this.evs = other.evs
      this.ribbons = uniq([...this.ribbons, ...(other.ribbons ?? [])])
      this.contest = other.contest
      if (!formatHasColorMarkings(other.format)) {
        for (let i = 0; i < other.markings.length; i++) {
          this.markings[i] = (
            other.markings[i] > 0 ? Math.max(this.markings[i], other.markings[i]) : 0
          ) as marking
        }
      } else {
        other.markings.forEach((value, index) => {
          this.markings[index] = value
        })
      }
    } else {
      this.evsG12 = other.evsG12
    }

    // memory ribbons need to be updated if new ribbons were earned to add to the count
    const contestRibbons = _.intersection(this.ribbons, Gen34ContestRibbons)
    this.contestMemoryCount = Math.max(contestRibbons.length, this.contestMemoryCount)
    const battleRibbons = _.intersection(this.ribbons, Gen34TowerRibbons)
    this.battleMemoryCount = Math.max(battleRibbons.length, this.battleMemoryCount)

    if (hasGen2OnData(other)) {
      this.pokerusByte = other.pokerusByte
      this.trainerFriendship = Math.max(other.trainerFriendship, this.trainerFriendship)
    }

    if (hasGen4OnlyData(other)) {
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
