import { GEN3_ABILITY_MAX, GEN3_MOVE_MAX, OHPKM } from '.'
import { Ball, NDex } from '../../consts'
import { GameOfOrigin, GameOfOriginData, isKanto } from '../../consts/GameOfOrigin'
import { GCLanguages, Languages } from '../../consts/Languages'
import CXDLocation from '../../consts/MetLocation/CXD'
import RSEFRLGLocations from '../../consts/MetLocation/RSEFRLG'
import { POKEMON_DATA } from '../../consts/Mons'
import { Gen3ContestRibbons, Gen3StandardRibbons } from '../../consts/Ribbons'
import { ShadowGaugeMax, ShadowIDsColosseum } from '../../consts/ShadowIDs'
import { ItemGen3FromString, ItemGen3ToString } from '../../resources/gen/items/Gen3'
import { AbilityFromString } from '../../resources/gen/other/Abilities'
import { contestStats, marking, stats } from '../../types/types'
import {
  bytesToInt32BigEndian,
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
import { Gen3OnData, Gen3OrreData } from '../interfaces/gen3'
import { adjustMovePPBetweenFormats, generatePersonalityValuePreservingAttributes } from './util'

export class COLOPKM implements Gen3OnData, Gen3OrreData {
  public get fileSize() {
    return 312
  }

  get markingCount(): number {
    return 4
  }

  get markingColors(): number {
    return 1
  }

  bytes = new Uint8Array(312)
  constructor(bytes?: Uint8Array, encrypted?: boolean, other?: OHPKM) {
    if (bytes) {
      if (encrypted) {
        throw new Error('COLOPKM decryption not implemented')
      } else {
        this.bytes = bytes
      }
    } else if (other) {
      this.dexNum = other.dexNum
      this.personalityValue = generatePersonalityValuePreservingAttributes(other)
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
      this.trainerID = other.trainerID
      this.secretID = other.secretID
      this.trainerName = other.trainerName
      this.nickname = other.nickname
      this.exp = other.exp
      this.statLevel = this.level
      const validMoves = other.moves.filter((move) => move <= GEN3_MOVE_MAX)
      const validMovePP = adjustMovePPBetweenFormats(this, other).filter(
        (_, i) => other.moves[i] <= GEN3_MOVE_MAX
      )
      const validMovePPUps = other.movePPUps.filter((_, i) => other.moves[i] <= GEN3_MOVE_MAX)
      this.moves = [validMoves[0], validMoves[1], validMoves[2], validMoves[3]]
      this.movePP = [validMovePP[0], validMovePP[1], validMovePP[2], validMovePP[3]]
      this.movePPUps = [validMovePPUps[0], validMovePPUps[1], validMovePPUps[2], validMovePPUps[3]]
      this.movePPUps = other.movePPUps
      this.heldItem = other.heldItem
      this.evs = other.evs
      this.ivs = other.ivs
      this.trainerFriendship = other.trainerFriendship
      this.contest = other.contest
      this.ribbons = other.ribbons
      this.pokerusByte = other.pokerusByte
      this.isEgg = other.isEgg
      this.abilityNum = other.abilityNum
      if (other.markings) {
        const temp = [0, 0, 0, 0]
        for (let i = 0; i < 4; i++) {
          temp[i] = other.markings[i] > 0 ? 1 : 0
        }
        this.markings = temp as [marking, marking, marking, marking]
      }
      this.isShadow = other.isShadow
    }
  }

  public get format() {
    return 'COLOPKM'
  }

  public get dexNum() {
    return gen3ToNational(bytesToUint16BigEndian(this.bytes, 0x00))
  }

  public set dexNum(value: number) {
    this.bytes.set(uint16ToBytesBigEndian(nationalToGen3(value)), 0x00)
  }

  public get formNum() {
    if (this.dexNum === NDex.UNOWN) {
      let letterValue = (this.personalityValue >> 24) & 0x3
      letterValue = ((this.personalityValue >> 16) & 0x3) | (letterValue << 2)
      letterValue = ((this.personalityValue >> 8) & 0x3) | (letterValue << 2)
      letterValue = (this.personalityValue & 0x3) | (letterValue << 2)
      return letterValue % 28
    }
    return 0
  }

  public get personalityValue() {
    return bytesToUint32BigEndian(this.bytes, 0x04)
  }

  public set personalityValue(value: number) {
    this.bytes.set(uint32ToBytesBigEndian(value), 0x04)
  }

  public get gameOfOrigin() {
    const origin = GameOfOriginData.find((game) => game?.gc === this.bytes[0x08]) ?? null
    return GameOfOriginData.indexOf(origin)
  }

  public set gameOfOrigin(value: number) {
    this.bytes[0x08] = GameOfOriginData[value]?.gc ?? 0
  }

  public get languageIndex() {
    return Languages.indexOf(this.language)
  }

  public get language() {
    return GCLanguages[this.bytes[0x0b]]
  }

  public set language(value) {
    this.bytes[0x0b] = Math.max(GCLanguages.indexOf(value), 0)
  }

  public get metLocationIndex() {
    return bytesToUint16BigEndian(this.bytes, 0x0c)
  }

  public set metLocationIndex(value: number) {
    this.bytes.set(uint16ToBytesBigEndian(value), 0x0c)
  }

  public get metLocation() {
    if (this.gameOfOrigin === GameOfOrigin.ColosseumXD) {
      return `in ${CXDLocation[0][this.metLocationIndex]}`
    }
    return `in ${RSEFRLGLocations[0][this.metLocationIndex]}`
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

  public get trainerID() {
    return bytesToUint16BigEndian(this.bytes, 0x14)
  }

  public set trainerID(value: number) {
    this.bytes.set(uint16ToBytesBigEndian(value), 0x14)
  }

  public get secretID() {
    return bytesToUint16BigEndian(this.bytes, 0x16)
  }

  public set secretID(value: number) {
    this.bytes.set(uint16ToBytesBigEndian(value), 0x16)
  }

  public get displayID() {
    return this.trainerID
  }

  public get trainerName() {
    return utf16BytesToString(this.bytes, 0x18, 11, true)
  }

  public set trainerName(value: string) {
    const utfBytes = utf16StringToBytes(value, 11, true)
    this.bytes.set(utfBytes, 0x18)
  }

  public get nickname() {
    return utf16BytesToString(this.bytes, 0x2e, 11, true)
  }

  public set nickname(value: string) {
    const utfBytes = utf16StringToBytes(value, 11, true)
    this.bytes.set(utfBytes, 0x2e)
    this.bytes.set(utfBytes, 0x44)
  }

  public get exp() {
    return bytesToUint32BigEndian(this.bytes, 0x5c)
  }

  public set exp(value: number) {
    this.bytes.set(uint32ToBytesBigEndian(value), 0x5c)
  }

  public get level() {
    return this.dexNum > 0 ? getLevelGen3Onward(this.dexNum, this.exp) : 0
  }

  public get statLevel() {
    return this.bytes[0x60]
  }

  public set statLevel(value: number) {
    this.bytes[0x60] = value
  }

  public get moves() {
    return [
      bytesToUint16BigEndian(this.bytes, 0x78),
      bytesToUint16BigEndian(this.bytes, 0x7c),
      bytesToUint16BigEndian(this.bytes, 0x80),
      bytesToUint16BigEndian(this.bytes, 0x84),
    ]
  }

  public set moves(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes.set(uint16ToBytesBigEndian(value[i]), 0x78 + 4 * i)
    }
  }

  public get movePP() {
    return [this.bytes[0x7a], this.bytes[0x7e], this.bytes[0x82], this.bytes[0x86]]
  }

  public set movePP(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes[0x7a + 4 * i] = value[i]
    }
  }

  public get movePPUps() {
    return [this.bytes[0x7b], this.bytes[0x7f], this.bytes[0x83], this.bytes[0x87]]
  }

  public set movePPUps(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes[0x7b + 4 * i] = value[i]
    }
  }

  public get heldItemIndex() {
    return bytesToUint16BigEndian(this.bytes, 0x88)
  }

  public set heldItemIndex(value: number) {
    this.bytes.set(uint16ToBytesBigEndian(value), 0x88)
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
    return bytesToUint16BigEndian(this.bytes, 0x8a)
  }

  public set currentHP(value: number) {
    this.bytes.set(uint16ToBytesBigEndian(value), 0x8a)
  }

  public get statusCondition() {
    return 0
  }

  public get evs() {
    return {
      hp: this.bytes[0x99],
      atk: this.bytes[0x9b],
      def: this.bytes[0x9d],
      spe: this.bytes[0x9f],
      spa: this.bytes[0xa1],
      spd: this.bytes[0xa3],
    }
  }

  public set evs(value: stats) {
    this.bytes[0x99] = value.hp
    this.bytes[0x9b] = value.atk
    this.bytes[0x9d] = value.def
    this.bytes[0x9f] = value.spe
    this.bytes[0xa1] = value.spa
    this.bytes[0xa3] = value.spd
  }

  public get ivs() {
    return {
      hp: this.bytes[0xa5],
      atk: this.bytes[0xa7],
      def: this.bytes[0xa9],
      spe: this.bytes[0xab],
      spa: this.bytes[0xad],
      spd: this.bytes[0xaf],
    }
  }

  public set ivs(value: stats) {
    this.bytes[0xa5] = value.hp
    this.bytes[0xa7] = value.atk
    this.bytes[0xa9] = value.def
    this.bytes[0xab] = value.spe
    this.bytes[0xad] = value.spa
    this.bytes[0xaf] = value.spd
  }

  public get trainerFriendship() {
    return this.bytes[0xd0]
  }

  public set trainerFriendship(value: number) {
    this.bytes[0xd0] = value
  }

  public get contest() {
    return {
      cool: this.bytes[0xb2],
      beauty: this.bytes[0xb3],
      cute: this.bytes[0xb4],
      smart: this.bytes[0xb5],
      tough: this.bytes[0xb6],
      sheen: this.bytes[0xb7],
    }
  }

  public set contest(value: contestStats) {
    this.bytes[0xb2] = value.cool
    this.bytes[0xb3] = value.beauty
    this.bytes[0xb4] = value.cute
    this.bytes[0xb5] = value.smart
    this.bytes[0xb6] = value.tough
    this.bytes[0xb7] = value.sheen
  }

  public get ribbonBytes() {
    return this.bytes.slice(0x4c, 0x50)
  }

  public set ribbonBytes(value: Uint8Array) {
    this.bytes.set(value.slice(0, 4), 0x4c)
  }

  public get ribbons() {
    const ribbons: string[] = []
    const coolRibbonsNum = this.bytes[0xb7]
    for (let i = 0; i < coolRibbonsNum; i++) {
      ribbons.push(Gen3ContestRibbons[i])
    }
    const beautyRibbonsNum = this.bytes[0xb8]
    for (let i = 0; i < beautyRibbonsNum; i++) {
      ribbons.push(Gen3ContestRibbons[i + 4])
    }
    const cuteRibbonsNum = this.bytes[0xb9]
    for (let i = 0; i < cuteRibbonsNum; i++) {
      ribbons.push(Gen3ContestRibbons[i + 8])
    }
    const smartRibbonsNum = this.bytes[0xba]
    for (let i = 0; i < smartRibbonsNum; i++) {
      ribbons.push(Gen3ContestRibbons[i + 12])
    }
    const toughRibbonsNum = this.bytes[0xbb]
    for (let i = 0; i < toughRibbonsNum; i++) {
      ribbons.push(Gen3ContestRibbons[i + 16])
    }
    for (let i = 0xbd; i <= 0xc8; i++) {
      if (this.bytes[i]) {
        ribbons.push(Gen3StandardRibbons[i])
      }
    }
    return ribbons
  }

  public set ribbons(value: string[]) {
    this.bytes[0xbd] = 0
    this.bytes[0xbe] = 0
    let maxCoolRibbon = 0
    let maxBeautyRibbon = 0
    let maxCuteRibbon = 0
    let maxSmartRibbon = 0
    let maxToughRibbon = 0
    value.forEach((ribbon) => {
      const index = Gen3StandardRibbons.indexOf(ribbon)
      if (index > -1) {
        this.bytes[0xbd + index] = 1
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
    this.bytes[0xb7] = maxCoolRibbon
    this.bytes[0xb8] = maxBeautyRibbon
    this.bytes[0xb9] = maxCuteRibbon
    this.bytes[0xba] = maxSmartRibbon
    this.bytes[0xbb] = maxToughRibbon
  }

  public get isFatefulEncounter() {
    return getFlag(this.bytes, 0xc9, 4)
  }

  public set isFatefulEncounter(value: boolean) {
    setFlag(this.bytes, 0xc9, 4, value)
  }

  public get pokerusByte() {
    return (this.bytes[0xca] & 0x0f) | ((this.bytes[0xd0] << 4) & 0xf0)
  }

  public set pokerusByte(value: number) {
    this.bytes[0xca] = value & 0x0f
    this.bytes[0xd0] = (value & 0xf0) >> 4
  }

  public get isEgg() {
    return !!this.bytes[0xcb]
  }

  public set isEgg(value: boolean) {
    this.bytes[0xcb] = value ? 1 : 0
  }

  public get abilityIndex() {
    return AbilityFromString(this.ability)
  }

  public get ability() {
    const ability1 = POKEMON_DATA[this.dexNum]?.formes[0].ability1
    const ability2 = POKEMON_DATA[this.dexNum]?.formes[0].ability2
    if (this.abilityNum === 2 && ability2 && AbilityFromString(ability2) <= GEN3_ABILITY_MAX) {
      return ability2
    }
    return ability1
  }

  public get abilityNum() {
    return this.bytes[0xcc] + 1
  }

  public set abilityNum(value) {
    if (value > 2 || value < 1) {
      this.bytes[0xcc] = 0
    } else {
      this.bytes[0xcc] = value - 1
    }
  }

  public get nature() {
    return this.personalityValue % 25
  }

  public get gender() {
    return getGen3To5Gender(this.personalityValue, this.dexNum)
  }

  public get markings() {
    const markingsValue = this.bytes[0xcf]
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
    this.bytes[0xcf] = markingsValue
  }

  public get shadowID() {
    return bytesToUint16BigEndian(this.bytes, 0xd8)
  }

  public set shadowID(value: number) {
    this.bytes.set(uint16ToBytesBigEndian(value), 0xd8)
  }

  public get shadowGauge() {
    return bytesToInt32BigEndian(this.bytes, 0xdc)
  }

  public set shadowGauge(value: number) {
    this.bytes.set(uint32ToBytesBigEndian(value), 0xdc)
  }

  public get isShadow() {
    if (this.dexNum in ShadowIDsColosseum) {
      return this.shadowID > 0 && this.shadowGauge !== -100
    }
    return false
  }

  public set isShadow(value: boolean) {
    if (!value || !(this.dexNum in ShadowGaugeMax) || !(this.dexNum in ShadowIDsColosseum)) {
      this.shadowGauge = -100
      this.shadowID = 0
      return
    }
    this.shadowGauge = ShadowGaugeMax[this.dexNum]
    this.shadowID = ShadowIDsColosseum[this.dexNum]
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
