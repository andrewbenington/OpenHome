import {
  AbilityFromString,
  Ball,
  GameOfOrigin,
  GameOfOriginData,
  Gen3GBALocations,
  Gen3GCNLocations,
  ItemGen3FromString,
  ItemGen3ToString,
  Languages,
  LanguagesGCN,
  isKanto,
} from 'pokemon-resources'
import { NationalDex, PokemonData } from 'pokemon-species-data'
import { Gen3ContestRibbons, Gen3StandardRibbons } from '../../consts/Ribbons'
import { ShadowIDsXD } from '../../consts/ShadowIDs'
import {
  bytesToUint16BigEndian,
  bytesToUint32BigEndian,
  getFlag,
  setFlag,
  uint16ToBytesBigEndian,
  uint32ToBytesBigEndian,
} from '../../util/ByteLogic'
import { gen3ToNational, nationalToGen3 } from '../../util/ConvertPokemonID'
import { getGen3To5Gender } from '../../util/GenderCalc'
import { getHPGen3Onward, getLevelGen3Onward, getStatGen3Onward } from '../../util/StatCalc'
import { utf16BytesToString, utf16StringToBytes } from '../../util/Strings/StringConverter'
import { BasePKMData } from '../interfaces/base'
import { Gen3OnData, Gen3OrreData } from '../interfaces/gen3'
import { OHPKM } from '../OHPKM'
import { contestStats, marking, stats } from '../types'
import { GEN3_ABILITY_MAX, GEN3_MOVE_MAX } from './PK3'
import { adjustMovePPBetweenFormats, generatePersonalityValuePreservingAttributes } from './util'

export class XDPKM implements BasePKMData, Gen3OnData, Gen3OrreData {
  public get fileSize() {
    return 196
  }

  get markingCount(): number {
    return 4
  }

  get markingColors(): number {
    return 1
  }

  bytes = new Uint8Array(196)
  constructor(bytes?: Uint8Array, encrypted?: boolean, other?: OHPKM) {
    if (bytes) {
      if (encrypted) {
        throw new Error('XDPKM decryption not implemented')
      } else {
        this.bytes = bytes
      }
    } else if (other) {
      this.dexNum = other.dexNum
      this.heldItem = other.heldItem
      this.trainerFriendship = other.trainerFriendship
      if (other.gameOfOrigin === GameOfOrigin.ColosseumXD) {
        this.metLocationIndex = other.metLocationIndex
      } else {
        this.metLocationIndex = 254
      }
      this.metLevel = other.metLevel
      if (other.ball <= Ball.Premier) {
        this.ball = other.ball
      } else {
        this.ball = Ball.Poke
      }
      this.trainerGender = other.trainerGender
      if (other.markings) {
        const temp = [0, 0, 0, 0]
        for (let i = 0; i < 4; i++) {
          temp[i] = other.markings[i] > 0 ? 1 : 0
        }
        this.markings = temp as [marking, marking, marking, marking]
      }
      this.pokerusByte = other.pokerusByte
      this.abilityNum = other.abilityNum
      this.isEgg = other.isEgg
      this.exp = other.exp
      this.secretID = other.secretID
      this.trainerID = other.trainerID
      this.personalityValue = generatePersonalityValuePreservingAttributes(other)
      this.isFatefulEncounter = other.isFatefulEncounter
      if (other.gameOfOrigin <= GameOfOrigin.ColosseumXD) {
        this.gameOfOrigin = other.gameOfOrigin
      } else if (isKanto(other.gameOfOrigin)) {
        this.gameOfOrigin = GameOfOrigin.FireRed
      } else if (other.gameOfOrigin === GameOfOrigin.OmegaRuby) {
        this.gameOfOrigin = GameOfOrigin.Ruby
      } else {
        this.gameOfOrigin = GameOfOrigin.Sapphire
      }
      this.language = other.language
      this.trainerName = other.trainerName
      this.nickname = other.nickname
      this.ribbons = other.ribbons
      const validMoves = other.moves.filter((move) => move <= GEN3_MOVE_MAX)
      const validMovePP = adjustMovePPBetweenFormats(this, other).filter(
        (_, i) => other.moves[i] <= GEN3_MOVE_MAX
      )
      const validMovePPUps = other.movePPUps.filter((_, i) => other.moves[i] <= GEN3_MOVE_MAX)
      this.moves = [validMoves[0], validMoves[1], validMoves[2], validMoves[3]]
      this.movePP = [validMovePP[0], validMovePP[1], validMovePP[2], validMovePP[3]]
      this.movePPUps = [validMovePPUps[0], validMovePPUps[1], validMovePPUps[2], validMovePPUps[3]]
      this.movePPUps = other.movePPUps
      this.evs = other.evs
      this.ivs = other.ivs
      this.contest = other.contest
      this.isShadow = other.isShadow

      this.currentHP = this.stats.hp
      this.statLevel = this.level
      this.partyStats = this.stats
    }
  }

  public get format() {
    return 'XDPKM'
  }

  public get dexNum() {
    return gen3ToNational(bytesToUint16BigEndian(this.bytes, 0x00))
  }

  public set dexNum(value: number) {
    this.bytes.set(uint16ToBytesBigEndian(nationalToGen3(value)), 0x00)
  }

  public get nature() {
    return this.personalityValue % 25
  }

  public get gender() {
    return getGen3To5Gender(this.personalityValue, this.dexNum)
  }

  public get formeNum() {
    if (this.dexNum === NationalDex.Unown) {
      let letterValue = (this.personalityValue >> 24) & 0x3
      letterValue = ((this.personalityValue >> 16) & 0x3) | (letterValue << 2)
      letterValue = ((this.personalityValue >> 8) & 0x3) | (letterValue << 2)
      letterValue = (this.personalityValue & 0x3) | (letterValue << 2)
      return letterValue % 28
    }
    return 0
  }

  public get heldItemIndex() {
    return bytesToUint16BigEndian(this.bytes, 0x02)
  }

  public set heldItemIndex(value: number) {
    this.bytes.set(uint16ToBytesBigEndian(value), 0x02)
  }

  public get heldItem() {
    return ItemGen3ToString(this.heldItemIndex)
  }

  public set heldItem(value: string) {
    const itemIndex = ItemGen3FromString(value)
    if (itemIndex > -1) {
      this.heldItemIndex = itemIndex
    }
  }

  public get currentHP() {
    return bytesToUint16BigEndian(this.bytes, 0x04)
  }

  public set currentHP(value: number) {
    this.bytes.set(uint16ToBytesBigEndian(value), 0x04)
  }

  public get statusCondition() {
    return 0
  }

  public get trainerFriendship() {
    return bytesToUint16BigEndian(this.bytes, 0x06)
  }

  public set trainerFriendship(value: number) {
    this.bytes.set(uint16ToBytesBigEndian(value), 0x06)
  }

  public get metLocationIndex() {
    return bytesToUint16BigEndian(this.bytes, 0x08)
  }

  public set metLocationIndex(value: number) {
    this.bytes.set(uint16ToBytesBigEndian(value), 0x08)
  }

  public get metLocation() {
    if (this.gameOfOrigin === GameOfOrigin.ColosseumXD) {
      return `in ${Gen3GCNLocations[0][this.metLocationIndex]}`
    }
    return `in ${Gen3GBALocations[0][this.metLocationIndex]}`
  }

  public get metLevel() {
    return this.bytes[0x0e]
  }

  public set metLevel(value: number) {
    this.bytes[0x0e] = value
  }

  public get ball() {
    return this.bytes[0x0f]
  }

  public set ball(value: number) {
    this.bytes[0x0f] = value
  }

  public get trainerGender() {
    return this.bytes[0x10]
  }

  public set trainerGender(value: number) {
    this.bytes[0x10] = value
  }

  public get statLevel() {
    return this.bytes[0x11]
  }

  public set statLevel(value: number) {
    this.bytes[0x11] = value
  }

  public get markings() {
    const markingsValue = this.bytes[0x14]
    return [
      markingsValue & 1,
      (markingsValue >> 1) & 1,
      (markingsValue >> 2) & 1,
      (markingsValue >> 3) & 1,
    ] as any as [marking, marking, marking, marking]
  }

  public set markings(value: [marking, marking, marking, marking]) {
    let markingsValue = 0
    for (let i = 0; i < 4; i++) {
      if (value[i]) {
        markingsValue |= 2 ** i
      }
    }
    this.bytes[0x14] = markingsValue
  }

  public get pokerusByte() {
    return (this.bytes[0x13] & 0x0f) | ((this.bytes[0x15] << 4) & 0xf0)
  }

  public set pokerusByte(value: number) {
    this.bytes[0x13] = value & 0x0f
    this.bytes[0x15] = (value & 0xf0) >> 4
  }

  public get abilityIndex() {
    return AbilityFromString(this.ability)
  }

  public get ability() {
    const ability1 = PokemonData[this.dexNum]?.formes[0].ability1
    const ability2 = PokemonData[this.dexNum]?.formes[0].ability2
    if (this.abilityNum === 2 && ability2 && AbilityFromString(ability2) <= GEN3_ABILITY_MAX) {
      return ability2
    }
    return ability1
  }

  public get abilityNum() {
    return getFlag(this.bytes, 0x1d, 6) ? 2 : 1
  }

  public set abilityNum(value: number) {
    if (value > 2 || value < 1) {
      setFlag(this.bytes, 0x1d, 6, false)
    } else {
      setFlag(this.bytes, 0x1d, 6, value === 2)
    }
  }

  public get isEgg() {
    return getFlag(this.bytes, 0x1d, 7)
  }

  public set isEgg(value: boolean) {
    setFlag(this.bytes, 0x1d, 7, value)
  }

  public get exp() {
    return bytesToUint32BigEndian(this.bytes, 0x20)
  }

  public set exp(value: number) {
    this.bytes.set(uint32ToBytesBigEndian(value), 0x20)
  }

  public get level() {
    return this.dexNum > 0 ? getLevelGen3Onward(this.dexNum, this.exp) : 0
  }

  public get secretID() {
    return bytesToUint16BigEndian(this.bytes, 0x24)
  }

  public set secretID(value: number) {
    this.bytes.set(uint16ToBytesBigEndian(value), 0x24)
  }

  public get trainerID() {
    return bytesToUint16BigEndian(this.bytes, 0x26)
  }

  public set trainerID(value: number) {
    this.bytes.set(uint16ToBytesBigEndian(value), 0x26)
  }

  public get displayID() {
    return this.trainerID
  }

  public get personalityValue() {
    return bytesToUint32BigEndian(this.bytes, 0x28)
  }

  public set personalityValue(value: number) {
    this.bytes.set(uint32ToBytesBigEndian(value), 0x28)
  }

  public get isFatefulEncounter() {
    return getFlag(this.bytes, 0x33, 0)
  }

  public set isFatefulEncounter(value: boolean) {
    setFlag(this.bytes, 0x33, 0, value)
  }

  public get gameOfOrigin() {
    const origin = GameOfOriginData.find((game) => game?.gameCubeIndex === this.bytes[0x34]) ?? null
    return GameOfOriginData.indexOf(origin)
  }

  public set gameOfOrigin(value: number) {
    this.bytes[0x34] = GameOfOriginData[value]?.gameCubeIndex ?? 0
  }

  public get languageIndex() {
    return Languages.indexOf(this.language)
  }

  public get language() {
    return LanguagesGCN[this.bytes[0x37]]
  }

  public set language(value) {
    this.bytes[0x37] = Math.max(LanguagesGCN.indexOf(value), 0)
  }

  public get trainerName() {
    return utf16BytesToString(this.bytes, 0x38, 11, true)
  }

  public set trainerName(value: string) {
    const utfBytes = utf16StringToBytes(value, 11, true)
    this.bytes.set(utfBytes, 0x38)
  }

  public get nickname() {
    return utf16BytesToString(this.bytes, 0x4e, 11, true)
  }

  public set nickname(value: string) {
    const utfBytes = utf16StringToBytes(value, 11, true)
    this.bytes.set(utfBytes, 0x4e)
    this.bytes.set(utfBytes, 0x64)
  }

  public get ribbons() {
    const ribbons: string[] = []
    const coolRibbonsNum = this.bytes[0xb3]
    for (let i = 0; i < coolRibbonsNum; i++) {
      ribbons.push(Gen3ContestRibbons[i])
    }
    const beautyRibbonsNum = this.bytes[0xb4]
    for (let i = 0; i < beautyRibbonsNum; i++) {
      ribbons.push(Gen3ContestRibbons[i + 4])
    }
    const cuteRibbonsNum = this.bytes[0xb5]
    for (let i = 0; i < cuteRibbonsNum; i++) {
      ribbons.push(Gen3ContestRibbons[i + 8])
    }
    const smartRibbonsNum = this.bytes[0xb6]
    for (let i = 0; i < smartRibbonsNum; i++) {
      ribbons.push(Gen3ContestRibbons[i + 12])
    }
    const toughRibbonsNum = this.bytes[0xb7]
    for (let i = 0; i < toughRibbonsNum; i++) {
      ribbons.push(Gen3ContestRibbons[i + 16])
    }
    for (let i = 15; i > 3; i--) {
      if (getFlag(this.bytes, 0x7c, i)) {
        ribbons.push(Gen3StandardRibbons[i])
      }
    }
    return ribbons
  }

  public set ribbons(value: string[]) {
    this.bytes[0x7c] = 0
    this.bytes[0x7d] = 0
    let maxCoolRibbon = 0
    let maxBeautyRibbon = 0
    let maxCuteRibbon = 0
    let maxSmartRibbon = 0
    let maxToughRibbon = 0
    value.forEach((ribbon) => {
      const index = Gen3StandardRibbons.indexOf(ribbon)
      if (index > -1) {
        setFlag(this.bytes, 0x7c, 15 - index, true)
      } else if (Gen3ContestRibbons.includes(ribbon)) {
        let ribbonVal = 0
        const [ribbonCategory, ribbonLevel] = ribbon.split(' ')
        switch (ribbonLevel) {
          case '(Hoenn)':
            ribbonVal = 1
            break
          case 'Super':
            ribbonVal = 2
            break
          case 'Hyper':
            ribbonVal = 3
            break
          case 'Master':
            ribbonVal = 4
        }
        switch (ribbonCategory) {
          case 'Cool':
            maxCoolRibbon = Math.max(maxCoolRibbon, ribbonVal)
            break
          case 'Beauty':
            maxBeautyRibbon = Math.max(maxBeautyRibbon, ribbonVal)
            break
          case 'Cute':
            maxCuteRibbon = Math.max(maxCuteRibbon, ribbonVal)
            break
          case 'Smart':
            maxSmartRibbon = Math.max(maxSmartRibbon, ribbonVal)
            break
          case 'Tough':
            maxToughRibbon = Math.max(maxToughRibbon, ribbonVal)
            break
        }
      }
    })
    this.bytes[0xb4] = maxCoolRibbon
    this.bytes[0xb5] = maxBeautyRibbon
    this.bytes[0xb6] = maxCuteRibbon
    this.bytes[0xb7] = maxSmartRibbon
    this.bytes[0xb8] = maxToughRibbon
  }

  public get moves() {
    return [
      bytesToUint16BigEndian(this.bytes, 0x80),
      bytesToUint16BigEndian(this.bytes, 0x84),
      bytesToUint16BigEndian(this.bytes, 0x88),
      bytesToUint16BigEndian(this.bytes, 0x8c),
    ]
  }

  public set moves(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes.set(uint16ToBytesBigEndian(value[i]), 0x80 + 4 * i)
    }
  }

  public get movePP() {
    return [this.bytes[0x82], this.bytes[0x86], this.bytes[0x8a], this.bytes[0x8e]]
  }

  public set movePP(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes[0x82 + 4 * i] = value[i]
    }
  }

  public get movePPUps() {
    return [this.bytes[0x83], this.bytes[0x87], this.bytes[0x8b], this.bytes[0x8f]]
  }

  public set movePPUps(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes[0x83 + 4 * i] = value[i]
    }
  }

  public set partyStats(value: stats) {
    this.bytes.set(uint16ToBytesBigEndian(value.hp), 0x90)
    this.bytes.set(uint16ToBytesBigEndian(value.atk), 0x92)
    this.bytes.set(uint16ToBytesBigEndian(value.def), 0x94)
    this.bytes.set(uint16ToBytesBigEndian(value.spa), 0x96)
    this.bytes.set(uint16ToBytesBigEndian(value.spd), 0x98)
    this.bytes.set(uint16ToBytesBigEndian(value.spe), 0x9a)
  }

  public get evs() {
    return {
      hp: this.bytes[0x9d],
      atk: this.bytes[0x9f],
      def: this.bytes[0xa1],
      spe: this.bytes[0xa3],
      spa: this.bytes[0xa5],
      spd: this.bytes[0xa7],
    }
  }

  public set evs(value: stats) {
    this.bytes[0x9d] = value.hp
    this.bytes[0x9f] = value.atk
    this.bytes[0xa1] = value.def
    this.bytes[0xa3] = value.spe
    this.bytes[0xa5] = value.spa
    this.bytes[0xa7] = value.spd
  }

  public get ivs() {
    return {
      hp: this.bytes[0xa9],
      atk: this.bytes[0xab],
      def: this.bytes[0xad],
      spe: this.bytes[0xaf],
      spa: this.bytes[0xb1],
      spd: this.bytes[0xb3],
    }
  }

  public set ivs(value: stats) {
    this.bytes[0xa9] = value.hp
    this.bytes[0xab] = value.atk
    this.bytes[0xad] = value.def
    this.bytes[0xaf] = value.spe
    this.bytes[0xb1] = value.spa
    this.bytes[0xb3] = value.spd
  }

  public get contest() {
    return {
      cool: this.bytes[0xae],
      beauty: this.bytes[0xaf],
      cute: this.bytes[0xb0],
      smart: this.bytes[0xb1],
      tough: this.bytes[0xb2],
      sheen: this.bytes[0x12],
    }
  }

  public set contest(value: contestStats) {
    this.bytes[0xae] = value.cool
    this.bytes[0xaf] = value.beauty
    this.bytes[0xb0] = value.cute
    this.bytes[0xb1] = value.smart
    this.bytes[0xb2] = value.tough
    this.bytes[0x12] = value.sheen
  }

  public get shadowID() {
    return bytesToUint16BigEndian(this.bytes, 0xba)
  }

  public set shadowID(value: number) {
    this.bytes.set(uint16ToBytesBigEndian(value), 0xba)
  }

  public get isShadow() {
    if (this.dexNum in ShadowIDsXD) {
      return this.shadowID > 0
    }
    return false
  }

  public set isShadow(value: boolean) {
    if (!value || !(this.dexNum in ShadowIDsXD)) {
      this.shadowID = 0
      return
    }
    this.shadowID = ShadowIDsXD[this.dexNum]
  }

  public get isShiny() {
    return (
      (this.trainerID ^
        this.secretID ^
        bytesToUint16BigEndian(this.bytes, 0x04) ^
        bytesToUint16BigEndian(this.bytes, 0x06)) <
      8
    )
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
}
