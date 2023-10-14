import { contestStats, marking, stats } from 'types/types'
import {
  Ball,
  GameOfOrigin,
  Gen3ContestRibbons,
  Gen3StandardRibbons,
  Languages,
  NDex,
  POKEMON_DATA,
  isGen3,
  isHoenn,
  isKanto,
} from '../../consts'
import CXDLocation from '../../consts/MetLocation/CXD'
import RSEFRLGLocations from '../../consts/MetLocation/RSEFRLG'
import {
  ItemGen3FromString,
  ItemGen3ToString,
} from '../../resources/gen/items/Gen3'
import { AbilityFromString } from '../../resources/gen/other/Abilities'
import {
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
  get16BitChecksumLittleEndian,
  getFlag,
  setFlag,
  uint16ToBytesLittleEndian,
  uint32ToBytesLittleEndian,
} from '../../util/ByteLogic'
import { gen3ToNational, nationalToGen3 } from '../../util/ConvertPokemonID'
import {
  decryptByteArrayGen3,
  shuffleBlocksGen3,
  unshuffleBlocksGen3,
} from '../../util/Encryption'
import { getGen3To5Gender } from '../../util/GenderCalc'
import {
  getHPGen3Onward,
  getLevelGen3Onward,
  getStatGen3Onward,
} from '../../util/StatCalc'
import {
  gen3StringToUTF,
  utf16StringToGen3,
} from '../../util/Strings/StringConverter'
import { OHPKM } from './OHPKM'
import { PKM } from './PKM'
import {
  adjustMovePPBetweenFormats,
  generatePersonalityValuePreservingAttributes,
  writeIVsToBuffer,
} from './util'

export const GEN3_MOVE_MAX = 354
export const GEN3_ABILITY_MAX = 77

export class PK3 extends PKM {
  constructor(...args: any[]) {
    if (args.length >= 1 && args[0] instanceof Uint8Array) {
      const bytes = args[0]
      const encrypted = args[1] ?? false
      if (encrypted) {
        const unencryptedBytes = decryptByteArrayGen3(bytes)
        const unshuffledBytes = unshuffleBlocksGen3(unencryptedBytes)
        super(unshuffledBytes)
      } else {
        super(bytes)
      }
    } else if (args.length === 1 && args[0] instanceof OHPKM) {
      const other = args[0]
      super(new Uint8Array(80))
      this.dexNum = other.dexNum
      this.heldItem = other.heldItem
      this.trainerID = other.trainerID
      this.secretID = other.secretID
      this.exp = other.exp
      if (other.markings) {
        const temp = [0, 0, 0, 0]
        for (let i = 0; i < 4; i++) {
          temp[i] = other.markings[i] > 0 ? 1 : 0
        }
        this.markings = temp as [marking, marking, marking, marking]
      }
      this.personalityValue =
        generatePersonalityValuePreservingAttributes(other)
      // this.nature = other.nature ?? this.personalityValue % 25;
      this.isFatefulEncounter = other.isFatefulEncounter
      // this.gender = other.gender;
      // this.formNum = other.formNum;
      this.evs = other.evs ?? { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }
      this.contest = other.contest
      this.pokerusByte = other.pokerusByte
      // handle ribbons
      this.ribbons = other.ribbons
      const validMoves = other.moves.filter((move) => move <= GEN3_MOVE_MAX)
      const validMovePP = adjustMovePPBetweenFormats(this, other).filter(
        (_, i) => other.moves[i] <= GEN3_MOVE_MAX
      )
      const validMovePPUps = other.movePPUps.filter(
        (_, i) => other.moves[i] <= GEN3_MOVE_MAX
      )
      this.moves = [validMoves[0], validMoves[1], validMoves[2], validMoves[3]]
      this.movePP = [
        validMovePP[0],
        validMovePP[1],
        validMovePP[2],
        validMovePP[3],
      ]
      this.movePPUps = [
        validMovePPUps[0],
        validMovePPUps[1],
        validMovePPUps[2],
        validMovePPUps[3],
      ]
      this.movePPUps = other.movePPUps
      this.ivs = other.ivs
      this.isEgg = other.isEgg
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
      this.nickname = other.nickname
      this.trainerName = other.trainerName
      this.trainerFriendship = other.trainerFriendship
      if (other.ball <= Ball.Premier) {
        this.ball = other.ball
      } else {
        this.ball = Ball.Poke
      }
      if (isGen3(other.gameOfOrigin)) {
        this.metLocationIndex = other.metLocationIndex
      } else if (isKanto(other.gameOfOrigin) || isHoenn(other.gameOfOrigin)) {
        let equivalentLocation = other.metLocation
          ? RSEFRLGLocations[0].indexOf(other.metLocation.slice(3))
          : -1
        if (other.gameOfOrigin === GameOfOrigin.ColosseumXD) {
          equivalentLocation = 254
        } else if (equivalentLocation < 0) {
          this.metLocationIndex = equivalentLocation
        }
      } else {
        this.metLocationIndex = 254
      }
      this.metLevel = other.metLevel ?? this.level
      this.trainerGender = other.trainerGender
      this.refreshChecksum()
    } else {
      super(new Uint8Array())
    }
  }

  public get format() {
    return 'PK3'
  }

  public get personalityValue() {
    return bytesToUint32LittleEndian(this.bytes, 0x00)
  }

  public set personalityValue(value: number) {
    this.bytes.set(uint32ToBytesLittleEndian(value), 0x00)
  }

  public get checksum() {
    return bytesToUint16LittleEndian(this.bytes, 0x1c)
  }

  public get trainerID() {
    return bytesToUint16LittleEndian(this.bytes, 0x04)
  }

  public set trainerID(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x04)
  }

  public get secretID() {
    return bytesToUint16LittleEndian(this.bytes, 0x06)
  }

  public set secretID(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x06)
  }

  public get displayID() {
    return this.trainerID
  }

  public get nickname() {
    return gen3StringToUTF(this.bytes, 0x08, 10)
  }

  public set nickname(value: string) {
    const utfBytes = utf16StringToGen3(value, 10, true, false)
    this.bytes.set(utfBytes, 0x08)
  }

  public get languageIndex() {
    return this.bytes[0x12]
  }

  public get language() {
    return Languages[this.languageIndex]
  }

  public set language(value: string) {
    const index = Languages.indexOf(value)
    if (index > -1) {
      this.bytes[0x12] = index
    }
  }

  public get trainerName() {
    return gen3StringToUTF(this.bytes, 0x14, 7)
  }

  public set trainerName(value: string) {
    const utfBytes = utf16StringToGen3(value, 7, true, true)
    this.bytes.set(utfBytes, 0x14)
  }

  public get markings() {
    const markingsValue = this.bytes[0x1b]
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
    this.bytes[0x1b] = markingsValue
  }

  public get gender() {
    return getGen3To5Gender(this.personalityValue, this.dexNum)
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

  public get dexNum() {
    return gen3ToNational(bytesToUint16LittleEndian(this.bytes, 0x20))
  }

  public set dexNum(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(nationalToGen3(value)), 0x20)
  }

  public get heldItemIndex() {
    return bytesToUint16LittleEndian(this.bytes, 0x22)
  }

  public set heldItemIndex(value: number) {
    this.bytes.set(uint16ToBytesLittleEndian(value), 0x22)
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

  public get exp() {
    return bytesToUint32LittleEndian(this.bytes, 0x24)
  }

  public set exp(value: number) {
    this.bytes.set(uint32ToBytesLittleEndian(value), 0x24)
  }

  public get level() {
    return this.dexNum > 0 ? getLevelGen3Onward(this.dexNum, this.exp) : 0
  }

  public get movePPUps() {
    const ppUpVal = this.bytes[0x28]
    return [
      (ppUpVal >> 0) & 3,
      (ppUpVal >> 2) & 3,
      (ppUpVal >> 4) & 3,
      (ppUpVal >> 6) & 3,
    ]
  }

  public set movePPUps(value: [number, number, number, number]) {
    let ppUpVal = 0
    for (let i = 0; i < 4; i++) {
      ppUpVal |= (value[i] & 3) << (2 * i)
    }
    this.bytes[0x28] = ppUpVal
  }

  public get trainerFriendship() {
    return this.bytes[0x29]
  }

  public set trainerFriendship(value: number) {
    this.bytes[0x29] = value
  }

  public get abilityIndex() {
    return AbilityFromString(this.ability)
  }

  public get ability() {
    const ability1 = POKEMON_DATA[this.dexNum]?.formes[0].ability1
    const ability2 = POKEMON_DATA[this.dexNum]?.formes[0].ability2
    if (
      this.abilityNum === 2 &&
      ability2 &&
      AbilityFromString(ability2) <= GEN3_ABILITY_MAX
    ) {
      return ability2
    }
    return ability1
  }

  public get moves() {
    return [
      bytesToUint16LittleEndian(this.bytes, 0x2c),
      bytesToUint16LittleEndian(this.bytes, 0x2e),
      bytesToUint16LittleEndian(this.bytes, 0x30),
      bytesToUint16LittleEndian(this.bytes, 0x32),
    ]
  }

  public set moves(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes.set(uint16ToBytesLittleEndian(value[i]), 0x2c + 2 * i)
    }
  }

  public get movePP() {
    return [
      this.bytes[0x34],
      this.bytes[0x35],
      this.bytes[0x36],
      this.bytes[0x37],
    ]
  }

  public set movePP(value: [number, number, number, number]) {
    for (let i = 0; i < 4; i++) {
      this.bytes[0x34 + i] = value[i]
    }
  }

  public get abilityNum() {
    return getFlag(this.bytes, 0x00, 0) ? 2 : 1
  }

  public get nature() {
    return this.personalityValue % 25
  }

  public get evs() {
    return {
      hp: this.bytes[0x38],
      atk: this.bytes[0x39],
      def: this.bytes[0x3a],
      spe: this.bytes[0x3b],
      spa: this.bytes[0x3c],
      spd: this.bytes[0x3d],
    }
  }

  public set evs(value: stats) {
    this.bytes[0x38] = value.hp
    this.bytes[0x39] = value.atk
    this.bytes[0x3a] = value.def
    this.bytes[0x3b] = value.spe
    this.bytes[0x3c] = value.spa
    this.bytes[0x3d] = value.spd
  }

  public get contest() {
    return {
      cool: this.bytes[0x3e],
      beauty: this.bytes[0x3f],
      cute: this.bytes[0x40],
      smart: this.bytes[0x41],
      tough: this.bytes[0x42],
      sheen: this.bytes[0x43],
    }
  }

  public set contest(value: contestStats) {
    this.bytes[0x3e] = value.cool
    this.bytes[0x3f] = value.beauty
    this.bytes[0x40] = value.cute
    this.bytes[0x41] = value.smart
    this.bytes[0x42] = value.tough
    this.bytes[0x43] = value.sheen
  }

  public get pokerusByte() {
    return this.bytes[0x44]
  }

  public set pokerusByte(value: number) {
    this.bytes[0x44] = value
  }

  public get metLocationIndex() {
    return this.bytes[0x45]
  }

  public set metLocationIndex(value: number) {
    this.bytes[0x45] = value
  }

  public get metLocation() {
    if (this.gameOfOrigin === GameOfOrigin.ColosseumXD) {
      return `in ${CXDLocation[0][this.metLocationIndex]}`
    }
    return `in ${RSEFRLGLocations[0][this.metLocationIndex]}`
  }

  public get metLevel() {
    return this.bytes[0x46] & 0x7f
  }

  public set metLevel(value: number) {
    this.bytes[0x46] = (this.bytes[0x46] & 0x80) | (value & 0x7f)
  }

  public get gameOfOrigin() {
    const metData = bytesToUint16LittleEndian(this.bytes, 0x46)
    return (metData >> 7) & 0xf
  }

  public set gameOfOrigin(value: number) {
    let metData = bytesToUint16LittleEndian(this.bytes, 0x46) & ~0x780
    metData |= (value & 0xf) << 7
    this.bytes.set(uint16ToBytesLittleEndian(metData), 0x46)
  }

  public get ball() {
    const metData = bytesToUint16LittleEndian(this.bytes, 0x46)
    return (metData >> 11) & 0xf
  }

  public set ball(value: number) {
    let metData = bytesToUint16LittleEndian(this.bytes, 0x46) & ~0x7800
    metData |= (value & 0xf) << 11
    this.bytes.set(uint16ToBytesLittleEndian(metData), 0x46)
  }

  public get trainerGender() {
    return getFlag(this.bytes, 0x46, 15) ? 1 : 0
  }

  public set trainerGender(value: number) {
    setFlag(this.bytes, 0x46, 15, !!value)
  }

  public get ivs() {
    const ivBytes = bytesToUint32LittleEndian(this.bytes, 0x48)
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
    writeIVsToBuffer(value, this.bytes, 0x48, this.isEgg, this.isNicknamed)
  }

  public get isEgg() {
    return getFlag(this.bytes, 0x48, 30)
  }

  public set isEgg(value: boolean) {
    setFlag(this.bytes, 0x48, 30, value)
    // handle egg name byte
    this.bytes[0x13] = 0x2 | (value ? 0x4 : 0)
  }

  public get isNicknamed() {
    return getFlag(this.bytes, 0x48, 31)
  }

  public set isNicknamed(value: boolean) {
    setFlag(this.bytes, 0x48, 31, value)
  }

  public get ribbonBytes() {
    return this.bytes.slice(0x4c, 0x50)
  }

  public set ribbonBytes(value: Uint8Array) {
    this.bytes.set(value.slice(0, 4), 0x4c)
  }

  public get ribbons() {
    const ribbons = []
    const ribbonsValue = bytesToUint32LittleEndian(this.ribbonBytes, 0)
    const coolRibbonsNum = Math.min((ribbonsValue >> 0) & 7, 4)
    for (let i = 0; i < coolRibbonsNum; i++) {
      ribbons.push(Gen3ContestRibbons[i])
    }
    const beautyRibbonsNum = Math.min((ribbonsValue >> 3) & 7, 4)
    for (let i = 0; i < beautyRibbonsNum; i++) {
      ribbons.push(Gen3ContestRibbons[i + 4])
    }
    const cuteRibbonsNum = Math.min((ribbonsValue >> 6) & 7, 4)
    for (let i = 0; i < cuteRibbonsNum; i++) {
      ribbons.push(Gen3ContestRibbons[i + 8])
    }
    const smartRibbonsNum = Math.min((ribbonsValue >> 9) & 7, 4)
    for (let i = 0; i < smartRibbonsNum; i++) {
      ribbons.push(Gen3ContestRibbons[i + 12])
    }
    const toughRibbonsNum = Math.min((ribbonsValue >> 12) & 7, 4)
    for (let i = 0; i < toughRibbonsNum; i++) {
      ribbons.push(Gen3ContestRibbons[i + 16])
    }
    for (let bit = 0; bit < Gen3StandardRibbons.length; bit++) {
      if (ribbonsValue & (2 ** (bit + 15))) {
        ribbons.push(Gen3StandardRibbons[bit])
      }
    }
    return ribbons
  }

  public set ribbons(value: string[]) {
    const newRibbonBytes = new Uint8Array(4)
    let maxCoolRibbon = 0
    let maxBeautyRibbon = 0
    let maxCuteRibbon = 0
    let maxSmartRibbon = 0
    let maxToughRibbon = 0
    value.forEach((ribbon) => {
      const index = Gen3StandardRibbons.indexOf(ribbon)
      if (index > -1) {
        setFlag(newRibbonBytes, 0, index + 15, true)
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
    let ribbonUInt32 = bytesToUint32LittleEndian(newRibbonBytes, 0)
    ribbonUInt32 = (ribbonUInt32 & ~7) | (maxCoolRibbon & 7)
    ribbonUInt32 = (ribbonUInt32 & ~(7 << 3)) | ((maxBeautyRibbon & 7) << 3)
    ribbonUInt32 = (ribbonUInt32 & ~(7 << 6)) | ((maxCuteRibbon & 7) << 6)
    ribbonUInt32 = (ribbonUInt32 & ~(7 << 9)) | ((maxSmartRibbon & 7) << 9)
    ribbonUInt32 = (ribbonUInt32 & ~(7 << 12)) | ((maxToughRibbon & 7) << 12)
    ribbonUInt32 =
      (ribbonUInt32 & ~(1 << 31)) | ((this.isFatefulEncounter ? 1 : 0) << 31)
    this.ribbonBytes = uint32ToBytesLittleEndian(ribbonUInt32)
  }

  public get isFatefulEncounter() {
    return getFlag(this.bytes, 0x4c, 31)
  }

  public set isFatefulEncounter(value: boolean) {
    setFlag(this.bytes, 0x4c, 31, value)
  }

  public get isShiny() {
    return (
      (this.trainerID ^
        this.secretID ^
        bytesToUint16LittleEndian(this.bytes, 0x00) ^
        bytesToUint16LittleEndian(this.bytes, 0x02)) <
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

  public refreshChecksum() {
    const newChecksum = get16BitChecksumLittleEndian(this.bytes, 0x20, 0x50)
    this.bytes.set(uint16ToBytesLittleEndian(newChecksum), 0x1c)
  }

  public toPCBytes() {
    const shuffledBytes = shuffleBlocksGen3(this.bytes)
    return decryptByteArrayGen3(shuffledBytes)
  }
}
