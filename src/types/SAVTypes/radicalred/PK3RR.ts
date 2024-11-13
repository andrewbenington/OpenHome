import {
  AbilityFromString,
  Ball,
  ItemFromString,
  Languages,
  NatureToString,
} from 'pokemon-resources'
import { PokemonData } from 'pokemon-species-data'

import {
  AllPKMFields,
  genderFromPID,
  generatePersonalityValuePreservingAttributes,
  getFlag,
  getLevelGen3Onward,
  getMoveMaxPP,
  getStats,
  MarkingsFourShapes,
  markingsFourShapesFromBytes,
  markingsFourShapesFromOther,
  markingsFourShapesToBytes,
  read30BitIVsFromBytes,
  readGen3StringFromBytes,
  readStatsFromBytes,
  setFlag,
  Stats,
  uIntFromBufferBits,
  uIntToBufferBits,
  write30BitIVsToBytes,
  writeGen3StringToBytes,
  writeStatsToBytes,
} from 'pokemon-files'
import { ItemGen3RRFromString, ItemGen3RRToString } from './conversion/Gen3RRItems'
import { fromGen3RRMoveIndex, toGen3RRMoveIndex } from './conversion/Gen3RRMovesIndex'
import {
  fromGen3RRPokemonIndex,
  Gen3RRSpecies,
  toGen3RRPokemonIndex,
} from './conversion/Gen3RRPokemonIndex'

export class PK3RR {
  format: 'PK3RR' = 'PK3RR'
  personalityValue: number
  trainerID: number
  secretID: number
  languageIndex: number
  markings: MarkingsFourShapes
  dexNum: number
  formeNum: number
  privateHeldItemIndex: number
  heldItemIndex: number
  exp: number
  movePPUps: number[]
  movePP: number[] = [0, 0, 0, 0]
  trainerFriendship: number
  moves: number[]
  evs: Stats
  pokerusByte: number
  metLocationIndex: number
  metLevel: number
  gameOfOrigin: number
  ball: number
  ivs: Stats
  isEgg: boolean
  isNicknamed: boolean
  currentHP: number = 0
  nickname: string
  trainerName: string
  trainerGender: boolean

  constructor(arg: ArrayBuffer | AllPKMFields) {
    if (arg instanceof ArrayBuffer) {
      let buffer = arg
      const dataView = new DataView(buffer)

      // https://github.com/Skeli789/Complete-Fire-Red-Upgrade/blob/master/include/new/pokemon_storage_system.h

      // Personality 0:4
      this.personalityValue = dataView.getUint32(0x0, true)

      // OTID 4:8
      this.trainerID = dataView.getUint16(0x4, true)
      this.secretID = dataView.getUint16(0x6, true)

      // Nickname 8:18
      this.nickname = readGen3StringFromBytes(dataView, 0x8, 10)

      // Language 18
      this.languageIndex = dataView.getUint8(0x12)

      // Sanity 19
      // this.sanity = dataView.getUint8(0x13)

      // OT Name 20:27
      this.trainerName = readGen3StringFromBytes(dataView, 0x14, 7)

      // Markings 27
      this.markings = markingsFourShapesFromBytes(dataView, 0x1b)

      // Species 28:30
      const speciesIndex: number = dataView.getUint16(0x1c, true)
      const ret = fromGen3RRPokemonIndex(speciesIndex)
      if (ret.NationalDexIndex < 0) {
        this.dexNum = 0
        this.formeNum = 0
        console.warn(
          'The species is invalid. Species: ',
          Gen3RRSpecies[speciesIndex],
          ', PokeDex Number: ',
          speciesIndex
        )
      } else {
        this.dexNum = ret.NationalDexIndex
        this.formeNum = ret.FormIndex
      }

      // Held Item 30:32
      this.privateHeldItemIndex = dataView.getUint16(0x1e, true)
      this.heldItemIndex = ItemFromString(this.heldItemName)

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
      this.ball = uIntFromBufferBits(dataView, 0x26, 11, 4, true)

      // Moves 38:43 (5 bytes total for 4 moves with 10 bits each)
      this.moves = [
        fromGen3RRMoveIndex(uIntFromBufferBits(dataView, 0x27, 0, 10, true)), // Move 1
        fromGen3RRMoveIndex(uIntFromBufferBits(dataView, 0x28, 2, 10, true)), // Move 2
        fromGen3RRMoveIndex(uIntFromBufferBits(dataView, 0x29, 4, 10, true)), // Move 3
        fromGen3RRMoveIndex(uIntFromBufferBits(dataView, 0x2a, 6, 10, true)), // Move 4
      ]

      for (let i = 0; i < 4; i++) {
        const pp = getMoveMaxPP(this.moves[i], this.format, this.movePPUps[i])
        if (pp) this.movePP[i] = pp
      }

      // EVs 43:49
      this.evs = readStatsFromBytes(dataView, 0x2b)

      // 49
      this.pokerusByte = dataView.getUint8(0x31)

      // 50
      this.metLocationIndex = dataView.getUint8(0x32)

      // 51:53
      this.metLevel = uIntFromBufferBits(dataView, 0x33, 0, 7, true)

      // More research must be done into how the Game of orgigin is stored
      const gor = uIntFromBufferBits(dataView, 0x33, 7, 4, true)
      this.gameOfOrigin = gor === 8 || gor === 0 ? 6 : gor // Radical Red uses the 8 to represent pokemon from Radical Red
      this.trainerGender = getFlag(dataView, 0x33, 15)

      // 53:57
      this.ivs = read30BitIVsFromBytes(dataView, 0x35)
      this.isEgg = getFlag(dataView, 0x35, 30)
      this.isNicknamed = getFlag(dataView, 0x35, 31)
    } else {
      const other = arg
      this.personalityValue = generatePersonalityValuePreservingAttributes(other) ?? 0
      this.trainerID = other.trainerID
      this.secretID = other.secretID
      this.languageIndex = other.languageIndex
      this.markings = markingsFourShapesFromOther(other.markings) ?? {
        circle: false,
        triangle: false,
        square: false,
        heart: false,
      }
      this.dexNum = other.dexNum
      this.formeNum = other.formeNum
      this.privateHeldItemIndex = ItemGen3RRFromString(other.heldItemName)
      this.heldItemIndex = ItemFromString(other.heldItemName)
      this.exp = other.exp
      this.movePPUps = other.movePPUps.filter((_, i) => other.moves[i] <= PK3RR.maxValidMove())
      this.trainerFriendship = other.trainerFriendship ?? 0
      this.moves = other.moves.filter((_, i) => other.moves[i] <= PK3RR.maxValidMove())

      for (let i = 0; i < 4; i++) {
        const pp = getMoveMaxPP(this.moves[i], this.format, this.movePPUps[i])
        if (pp) this.movePP[i] = pp
      }
      this.evs = other.evs ?? {
        hp: 0,
        atk: 0,
        def: 0,
        spe: 0,
        spa: 0,
        spd: 0,
      }
      this.pokerusByte = other.pokerusByte ?? 0
      this.metLocationIndex = other.metLocationIndex ?? 0
      this.metLevel = other.metLevel ?? 0
      this.gameOfOrigin = other.gameOfOrigin
      if (other.ball && PK3RR.maxValidBall() >= other.ball) {
        this.ball = other.ball
      } else {
        this.ball = Ball.Poke
      }
      this.ivs = other.ivs ?? {
        hp: 0,
        atk: 0,
        def: 0,
        spe: 0,
        spa: 0,
        spd: 0,
      }
      this.isEgg = other.isEgg ?? false
      this.isNicknamed = other.isNicknamed ?? false
      this.currentHP = other.currentHP
      this.nickname = other.nickname
      this.trainerName = other.trainerName
      this.trainerGender = other.trainerGender
    }
  }

  static fromBytes(buffer: ArrayBuffer): PK3RR {
    return new PK3RR(buffer)
  }

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
    dataView.setUint8(0x12, this.languageIndex)

    // 19 Sanity
    // dataView.setUint8(0x13, SANITY VALUE IDK);

    // 20:27 OT Name (7 bytes)
    writeGen3StringToBytes(dataView, this.trainerName, 0x14, 7, true)

    // 27 Markings
    markingsFourShapesToBytes(dataView, 0x1b, this.markings)

    // Growth Substructure (starts at 0x1C)
    // 28:30 Species (DexNum)
    dataView.setUint16(0x1c, toGen3RRPokemonIndex(this.dexNum, this.formeNum), true)

    // 30:32 Held Item
    dataView.setUint16(0x1e, this.privateHeldItemIndex, true)

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
    dataView.setUint8(0x26, this.ball)

    // Moves (5 bytes total for 10-bit moves)
    uIntToBufferBits(dataView, toGen3RRMoveIndex(this.moves[0]), 0x27, 0, 10, true)
    uIntToBufferBits(dataView, toGen3RRMoveIndex(this.moves[1]), 0x28, 2, 10, true)
    uIntToBufferBits(dataView, toGen3RRMoveIndex(this.moves[2]), 0x29, 4, 10, true)
    uIntToBufferBits(dataView, toGen3RRMoveIndex(this.moves[3]), 0x2a, 6, 10, true)

    // EVs
    writeStatsToBytes(dataView, 0x2b, this.evs)

    // 49 Pokerus
    dataView.setUint8(0x31, this.pokerusByte)

    // 50 Met Location
    dataView.setUint8(0x32, this.metLocationIndex)

    // 51:52 Met Info (packed: Met level, Game of Origin, Trainer Gender)
    uIntToBufferBits(dataView, this.metLevel, 0x33, 0, 7, true)
    uIntToBufferBits(dataView, this.gameOfOrigin == 6 ? 8 : this.gameOfOrigin, 0x33, 7, 4, true)
    setFlag(dataView, 0x33, 15, this.trainerGender)

    // 53:57 IVs and Flags (30-bit IVs + 2 bits for flags)
    write30BitIVsToBytes(dataView, 0x35, this.ivs)
    setFlag(dataView, 0x35, 30, this.isEgg)
    setFlag(dataView, 0x35, 31, this.isNicknamed)

    return buffer
  }

  public getStats() {
    return getStats(this)
  }

  public get gender() {
    return genderFromPID(this.personalityValue, this.dexNum)
  }

  public get language() {
    return Languages[this.languageIndex]
  }
  public get heldItemName() {
    return ItemGen3RRToString(this.privateHeldItemIndex)
  }

  public get nature() {
    return this.personalityValue % 25
  }

  public get abilityNum() {
    return ((this.personalityValue >> 0) & 1) + 1
  }

  public get abilityIndex() {
    return AbilityFromString(this.ability)
  }

  public get ability() {
    const ability1 = PokemonData[this.dexNum]?.formes[0].ability1
    const ability2 = PokemonData[this.dexNum]?.formes[0].ability2
    if (this.abilityNum === 2 && ability2 && AbilityFromString(ability2) <= 77) {
      return ability2
    }
    return ability1
  }

  public get natureName() {
    return NatureToString(this.nature)
  }

  toPCBytes() {
    return this.toBytes()
  }

  public getLevel() {
    return getLevelGen3Onward(this.dexNum, this.exp)
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

  static maxValidMove() {
    return 354
  }

  static maxValidBall() {
    return 12
  }

  static allowedBalls() {
    return []
  }
}

export default PK3RR
