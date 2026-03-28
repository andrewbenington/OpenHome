import { PluginPKMInterface, RomHackFormat } from '@openhome-core/pkm/interfaces'
import {
  Ball,
  ConvertStrategy,
  ExtraFormIndex,
  Language,
  Languages,
  MetadataLookup,
  NatureIndex,
  OriginGame,
  SpeciesLookup,
} from '@pkm-rs/pkg'
import { PkmConstructorOptions } from '@pokemon-files/pkm/PKM'
import {
  FourMoves,
  generatePersonalityValuePreservingAttributes,
  getFlag,
  getMoveMaxPP,
  getStandardPKMStats,
  MarkingsFourShapes,
  markingsFourShapesFromBytes,
  markingsFourShapesFromOther,
  markingsFourShapesToBytes,
  MoveFilter,
  read30BitIVsFromBytes,
  readGen3StringFromBytes,
  readStatsFromBytesU8,
  setFlag,
  Stats,
  uIntFromBufferBits,
  uIntToBufferBits,
  write30BitIVsToBytes,
  writeGen3StringToBytes,
  writeStatsToBytesU8,
} from '@pokemon-files/util'
import { PkmConverter } from '../../../../packages/pokemon-files/src/conversion/converter'
import { OHPKM } from '../../pkm/OHPKM'
import { Option } from '../../util/functional'
import { PluginIdentifier } from '../interfaces'
import { CfruSpeciesAndForm } from './conversion/util'

const INTERNAL_ORIGIN_NON_RR = OriginGame.Invalid6
const INTERNAL_ORIGIN_FROM_CFRU = OriginGame.FireRed
const FIRERED_IN_GAME_TRADE = 255

const CFRU_BALLS: Ball[] = [
  Ball.Master,
  Ball.Ultra,
  Ball.Great,
  Ball.Poke,
  Ball.Safari,
  Ball.Net,
  Ball.Dive,
  Ball.Nest,
  Ball.Repeat,
  Ball.Timer,
  Ball.Luxury,
  Ball.Premier,
  Ball.Dusk,
  Ball.Heal,
  Ball.Quick,
  Ball.Cherish,
  Ball.None,
  Ball.Fast,
  Ball.Level,
  Ball.Lure,
  Ball.Heavy,
  Ball.Love,
  Ball.Friend,
  Ball.Moon,
  Ball.PokeLegendsArceus,
  Ball.Beast,
  Ball.Dream,
]

export abstract class PK3CFRU implements PluginPKMInterface {
  // static getName() {
  //   return 'PK3RR'
  // }
  abstract format: RomHackFormat

  abstract pluginIdentifier: PluginIdentifier
  pluginOrigin?: PluginIdentifier
  personalityValue: number
  trainerID: number
  secretID: number
  language: Language
  markings: MarkingsFourShapes
  internalSpeciesIndex: number
  dexNum: number
  formeNum: number
  extraFormIndex: Option<ExtraFormIndex>
  internalHeldItemIndex: number
  abstract heldItemIndex: number
  exp: number
  movePPUps: FourMoves
  movePP: FourMoves = [0, 0, 0, 0]
  trainerFriendship: number
  moves: FourMoves
  evs: Stats
  pokerusByte: number
  internalMetLocationIndex: number
  metLocationIndex: number
  metLevel: number
  internalGameOfOrigin: number
  gameOfOrigin: number
  ball: number
  canGigantamax: boolean
  ivs: Stats
  isEgg: boolean
  hasHiddenAbility: boolean
  isNicknamed: boolean = true
  currentHP: number = 0
  nickname: string
  trainerName: string
  trainerGender: boolean
  isFakemon: boolean = false
  originalBytes?: Uint8Array

  pluginForm?: number

  abstract selectColor: string

  constructor(arg: ArrayBuffer | OHPKM, options: PkmConstructorOptions) {
    if (arg instanceof ArrayBuffer) {
      let buffer = arg
      const dataView = new DataView(buffer)

      this.originalBytes = new Uint8Array(arg)

      // https://github.com/Skeli789/Complete-Fire-Red-Upgrade/blob/master/include/new/pokemon_storage_system.h
      // https://github.com/Skeli789/Complete-Fire-Red-Upgrade/blob/master/include/pokemon.h

      // Personality 0:4
      this.personalityValue = dataView.getUint32(0x0, true)

      // OTID 4:8
      this.trainerID = dataView.getUint16(0x4, true)
      this.secretID = dataView.getUint16(0x6, true)

      // Nickname 8:18
      this.nickname = readGen3StringFromBytes(dataView, 0x8, 10)

      // Language 18
      this.language = Languages.fromByteOrNone(dataView.getUint8(0x12))

      // Sanity 19
      // this.sanity = dataView.getUint8(0x13)

      // OT Name 20:27
      this.trainerName = readGen3StringFromBytes(dataView, 0x14, 7)

      // Markings 27
      this.markings = markingsFourShapesFromBytes(dataView, 0x1b)

      // Species 28:30
      this.internalSpeciesIndex = dataView.getUint16(0x1c, true)
      const speciesData = this.monFromGameIndex(this.internalSpeciesIndex)
      this.extraFormIndex = speciesData.extraFormIndex

      if (speciesData.nationalDex < 0) {
        this.dexNum = 0
        this.formeNum = 0
      } else {
        this.dexNum = speciesData.nationalDex
        this.formeNum = speciesData.formIndex
      }

      this.isFakemon = this.indexIsFakemon(this.internalSpeciesIndex)

      // Held Item 30:32
      this.internalHeldItemIndex = dataView.getUint16(0x1e, true)

      // Exp 32:36
      this.exp = dataView.getUint32(0x20, true)

      // Move PP Up 36
      this.movePPUps = [
        uIntFromBufferBits(dataView, 0x24, 0, 2, true),
        uIntFromBufferBits(dataView, 0x24, 2, 2, true),
        uIntFromBufferBits(dataView, 0x24, 4, 2, true),
        uIntFromBufferBits(dataView, 0x24, 6, 2, true),
      ]

      // Friendship 37
      this.trainerFriendship = dataView.getUint8(0x25)

      // Pokeball 38
      const ballIndex = dataView.getUint8(0x26)

      this.ball = ballIndex < CFRU_BALLS.length ? CFRU_BALLS[ballIndex] : Ball.Poke

      // Moves 38:43 (5 bytes total for 4 moves with 10 bits each)
      this.moves = [
        this.moveFromGameIndex(uIntFromBufferBits(dataView, 0x27, 0, 10, true)), // Move 1
        this.moveFromGameIndex(uIntFromBufferBits(dataView, 0x28, 2, 10, true)), // Move 2
        this.moveFromGameIndex(uIntFromBufferBits(dataView, 0x29, 4, 10, true)), // Move 3
        this.moveFromGameIndex(uIntFromBufferBits(dataView, 0x2a, 6, 10, true)), // Move 4
      ]

      for (let i = 0; i < 4; i++) {
        const pp = getMoveMaxPP(this.moves[i], this.getFormat(), this.movePPUps[i])

        if (pp) this.movePP[i] = pp
      }

      // EVs 43:49
      this.evs = readStatsFromBytesU8(dataView, 0x2c)

      // 49
      this.pokerusByte = dataView.getUint8(0x32)

      // 50
      this.metLocationIndex = dataView.getUint8(0x33)
      this.internalMetLocationIndex = this.metLocationIndex

      // 51:53
      this.metLevel = uIntFromBufferBits(dataView, 0x34, 0, 7, true)

      this.gameOfOrigin = uIntFromBufferBits(dataView, 0x34, 7, 4, true)
      this.internalGameOfOrigin = this.gameOfOrigin

      // OHPKM will not copy this field if the mon was already being tracked before being
      // transferred to Radical Red
      this.pluginOrigin =
        this.gameOfOrigin === INTERNAL_ORIGIN_FROM_CFRU ? this.getPluginIdentifier() : undefined

      this.canGigantamax = getFlag(dataView, 0x34, 11)
      this.trainerGender = getFlag(dataView, 0x34, 15)

      // 53:57
      this.ivs = read30BitIVsFromBytes(dataView, 0x36)
      this.isEgg = getFlag(dataView, 0x36, 30)
      this.hasHiddenAbility = getFlag(dataView, 0x36, 31)
    } else {
      const other = arg
      const converter = new PkmConverter(this.getFormat(), options.strategy)
      const metData = converter.metData(other)

      this.personalityValue = generatePersonalityValuePreservingAttributes(other) ?? 0
      this.trainerID = other.trainerID
      this.secretID = other.secretID
      this.language = other.language
      this.markings = markingsFourShapesFromOther(other.markings)
      this.dexNum = other.dexNum
      this.formeNum = other.formeNum
      this.extraFormIndex = other.extraFormIndex
      this.internalHeldItemIndex = this.internalItemIndexFromModern(other.heldItemIndex)
      this.exp = other.exp
      this.trainerFriendship = other.trainerFriendship ?? 0

      const moveFilter = MoveFilter.fromMoveIndices(this.getValidMoveIndices())
      this.moves = moveFilter.moves(other)
      this.movePP = moveFilter.movePp(other, this.getFormat())
      this.movePPUps = moveFilter.movePpUps(other)

      this.evs = other.evs
      this.pokerusByte = other.pokerusByte
      this.metLocationIndex = metData.locationIndex
      this.metLevel = other.metLevel

      const fromRadicalRed = other.pluginOrigin === 'radical_red'

      if (fromRadicalRed) {
        this.gameOfOrigin = INTERNAL_ORIGIN_FROM_CFRU
        this.internalGameOfOrigin = this.gameOfOrigin

        this.metLocationIndex = other.metLocationIndex ?? FIRERED_IN_GAME_TRADE
        this.internalMetLocationIndex = this.metLocationIndex
      } else {
        this.gameOfOrigin = other.gameOfOrigin ?? INTERNAL_ORIGIN_NON_RR
        this.internalGameOfOrigin = INTERNAL_ORIGIN_NON_RR

        this.metLocationIndex = other.metLocationIndex ?? FIRERED_IN_GAME_TRADE
        this.internalMetLocationIndex = FIRERED_IN_GAME_TRADE
      }

      this.internalSpeciesIndex = this.monToGameIndex(other.dexNum, other.formeNum)

      if (other.pluginOrigin === this.getPluginIdentifier()) {
        this.pluginOrigin = other.pluginOrigin
      }

      if (other.ball) {
        this.ball =
          other.ball >= Ball.PokeLegendsArceus && other.ball <= Ball.Origin
            ? Ball.PokeLegendsArceus
            : other.ball === Ball.Sport
              ? Ball.Poke
              : other.ball
      } else {
        this.ball = Ball.Poke
      }

      this.canGigantamax = !!other.canGigantamax
      this.ivs = converter.ivs(other)
      this.isEgg = other.isEgg ?? false
      this.hasHiddenAbility = other.abilityNum === 4
      this.isNicknamed = other.isNicknamed ?? false
      this.currentHP = other.currentHP ?? 0
      this.nickname = other.nickname
      this.trainerName = other.trainerName
      this.trainerGender = other.trainerGender
    }
  }

  static fromBytes<T extends PK3CFRU>(
    this: new (buffer: ArrayBuffer, options: PkmConstructorOptions) => T,
    buffer: ArrayBuffer,
    encrypted?: boolean
  ): T {
    return new this(buffer, { encrypted })
  }

  static fromOhpkm<T extends PK3CFRU>(
    this: new (ohpkm: OHPKM, options: PkmConstructorOptions) => T,
    ohpkm: OHPKM,
    strategy: ConvertStrategy
  ): T {
    return new this(ohpkm, { strategy })
  }

  abstract internalItemIndexFromModern(modernIndex: number): number
  abstract itemToString(index: number): string

  abstract moveFromGameIndex(gameIndex: number): number
  abstract moveToGameIndex(nationalMoveId: number): number
  abstract getValidMoveIndices(): number[]

  abstract monFromGameIndex(gameIndex: number): CfruSpeciesAndForm
  abstract monToGameIndex(nationalDexNumber: number, formIndex: number): number

  abstract indexIsFakemon(speciesIndex: number): boolean

  toBytes(): ArrayBuffer {
    const buffer = new ArrayBuffer(58) // 58 bytes as specified
    const dataView = new DataView(buffer)

    // 0:4 Personality
    dataView.setUint32(0x0, this.personalityValue, true)

    // 4:8 OT ID (Trainer ID and Secret ID)
    dataView.setUint16(0x4, this.trainerID, true)
    dataView.setUint16(0x6, this.secretID, true)

    // 8:18 Nickname (10 bytes)
    writeGen3StringToBytes(dataView, this.nickname, 0x8, 10, false)

    // 18 Language
    dataView.setUint8(0x12, this.language)

    // 19 Sanity
    // dataView.setUint8(0x13, SANITY VALUE IDK);

    // 20:27 OT Name (7 bytes)
    writeGen3StringToBytes(dataView, this.trainerName, 0x14, 7, false)

    // 27 Markings
    markingsFourShapesToBytes(dataView, 0x1b, this.markings)

    // Growth Substructure (starts at 0x1C)
    // 28:30 Species (DexNum)
    if (this.pluginForm) {
      dataView.setUint16(0x1c, this.pluginForm, true)
    } else {
      dataView.setUint16(0x1c, this.monToGameIndex(this.dexNum, this.formeNum), true)
    }

    // 30:32 Held Item
    dataView.setUint16(0x1e, this.internalHeldItemIndex, true)

    // 32:36 Experience
    dataView.setUint32(0x20, this.exp, true)

    // 36 PP Bonuses (PP Ups)
    dataView.setUint8(
      0x24,
      this.movePPUps.reduce((acc, ppUp, i) => acc | (ppUp << (i * 2)), 0)
    )

    // 37 Friendship
    dataView.setUint8(0x25, this.trainerFriendship)

    // 38 Ball (Pokeball)
    const ballIndex =
      this.ball in CFRU_BALLS
        ? CFRU_BALLS.indexOf(this.ball)
        : this.ball >= Ball.PokeLegendsArceus && this.ball <= Ball.Origin
          ? Ball.PokeLegendsArceus
          : Ball.Poke

    dataView.setUint8(0x26, ballIndex)

    // Moves (5 bytes total for 10-bit moves)
    uIntToBufferBits(dataView, this.moveToGameIndex(this.moves[0]), 0x27, 0, 10, true)
    uIntToBufferBits(dataView, this.moveToGameIndex(this.moves[1]), 0x28, 2, 10, true)
    uIntToBufferBits(dataView, this.moveToGameIndex(this.moves[2]), 0x29, 4, 10, true)
    uIntToBufferBits(dataView, this.moveToGameIndex(this.moves[3]), 0x2a, 6, 10, true)

    // EVs
    writeStatsToBytesU8(dataView, 0x2c, this.evs)

    // 49 Pokerus
    dataView.setUint8(0x32, this.pokerusByte)

    // 50 Met Location
    dataView.setUint8(0x33, this.metLocationIndex)

    // 51:52 Met Info (packed: Met level, Game of Origin, Trainer Gender)
    uIntToBufferBits(dataView, this.metLevel, 0x34, 0, 7, true)
    uIntToBufferBits(dataView, this.internalGameOfOrigin, 0x34, 7, 4, true)
    setFlag(dataView, 0x34, 11, this.canGigantamax)
    setFlag(dataView, 0x34, 15, this.trainerGender)

    // 53:57 IVs and Flags (30-bit IVs + 2 bits for flags)
    write30BitIVsToBytes(dataView, 0x36, this.ivs)
    setFlag(dataView, 0x36, 30, this.isEgg)
    setFlag(dataView, 0x36, 31, this.hasHiddenAbility)

    return buffer
  }

  public getStats() {
    return getStandardPKMStats(this)
  }

  public get gender() {
    return this.metadata?.genderFromPid(this.personalityValue)
  }

  public get languageString() {
    return Languages.stringFromByte(this.language)
  }

  public get heldItemName() {
    return this.itemToString(this.internalHeldItemIndex)
  }

  public get nature() {
    return NatureIndex.newFromPid(this.personalityValue)
  }

  public get abilityNum() {
    return this.hasHiddenAbility ? 4 : ((this.personalityValue >> 0) & 1) + 1
  }

  public get ability() {
    return this.metadata?.abilityByNum(this.abilityNum)
  }

  toPCBytes() {
    return this.toBytes()
  }

  public getLevel() {
    return this.speciesMetadata?.calculateLevel(this.exp) ?? 1
  }

  isShiny() {
    return (
      (this.trainerID ^
        this.secretID ^
        (this.personalityValue & 0xffff) ^
        ((this.personalityValue >> 16) & 0xffff)) <
      8
    )
  }

  isSquareShiny() {
    return !(
      this.trainerID ^
      this.secretID ^
      (this.personalityValue & 0xffff) ^
      ((this.personalityValue >> 16) & 0xffff)
    )
  }

  public get metadata() {
    return MetadataLookup(this.dexNum, this.formeNum)
  }

  public get speciesMetadata() {
    return SpeciesLookup(this.dexNum)
  }

  static maxValidMove() {
    return 354
  }

  static maxValidBall() {
    return Ball.Beast
  }

  static allowedBalls() {
    return []
  }

  getPluginIdentifier(): PluginIdentifier {
    return this.pluginIdentifier
  }

  extraDisplayFields() {
    return {
      'Internal Species Index': this.internalSpeciesIndex,
    }
  }

  abstract getFormat(): RomHackFormat
}

export default PK3CFRU
