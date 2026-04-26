import { NationalDex } from '@pokemon-resources/consts/NationalDex'

import {
  ConvertStrategies,
  ConvertStrategy,
  MetadataSummaryLookup,
  OriginGame,
  Pk3 as Pk3Wasm,
  SpeciesLookup,
} from '@pkm-rs/pkg'
import { FourMoves } from '@pokemon-files/util'
import { PKMInterface } from 'src/core/pkm/interfaces'
import { OHPKM } from '../../../../src/core/pkm/OHPKM'
import * as encryption from '../util/encryption'
import * as jsTypes from '../util/types'
import * as types from '../util/types'
import { PkmConstructorOptions } from './PKM'
import {
  binaryGenderFromBool,
  binaryGenderToBool,
  contestStatsToWasm,
  markingsFourShapesFromWasm,
  markingsFourShapesToWasm,
  statsToWasmStats8,
} from './wasm/convert'

export default class PK3 implements PKMInterface {
  static getFormat() {
    return 'PK3' as const
  }
  format: 'PK3' = 'PK3'
  inner: Pk3Wasm

  constructor(arg: Pk3Wasm | OHPKM, options: PkmConstructorOptions) {
    if (arg instanceof Pk3Wasm) {
      this.inner = arg
    } else {
      const ohpkmBytes = new Uint8Array(arg.toBytes())

      this.inner = Pk3Wasm.fromOhpkmBytes(
        ohpkmBytes,
        options.strategy || ConvertStrategies.getDefault()
      )
    }
  }

  static fromBytes(buffer: ArrayBuffer): PK3 {
    return PK3.fromWasm(Pk3Wasm.fromBytes(new Uint8Array(buffer)))
  }

  static fromOhpkm(ohpkm: OHPKM, strategy: ConvertStrategy): PK3 {
    return new PK3(ohpkm, { strategy })
  }

  static fromWasm(pk3: Pk3Wasm): PK3 {
    return new PK3(pk3, {})
  }

  toBytes(options?: types.ToBytesOptions): ArrayBuffer {
    return options?.includeExtraFields
      ? (this.inner.toPartyBytes().buffer as ArrayBuffer)
      : (this.inner.toBoxBytes().buffer as ArrayBuffer)
  }

  get sanity() {
    return this.inner.sanity
  }
  set sanity(value: number) {
    this.inner.sanity = value
  }

  get checksum() {
    return this.inner.checksum
  }
  set checksum(value: number) {
    this.inner.checksum = value
  }

  get dexNum() {
    return this.inner.nationalDex
  }
  set dexNum(value: number) {
    try {
      this.inner.nationalDex = value
    } catch (e) {
      console.error(`invalid dex number ${value} for PK3: ${e}`)
    }
  }

  get heldItemIndex() {
    return this.inner.held_item_index
  }
  set heldItemIndex(value: number) {
    this.inner.held_item_index = value
  }

  get trainerID() {
    return this.inner.trainer_id
  }
  set trainerID(value: number) {
    this.inner.trainer_id = value
  }

  get secretID() {
    return this.inner.secret_id
  }
  set secretID(value: number) {
    this.inner.secret_id = value
  }

  get exp() {
    return this.inner.exp
  }
  set exp(value: number) {
    this.inner.exp = value
  }

  get ability() {
    return this.metadata?.abilityByNumGen3(this.abilityNum)
  }

  get abilityNum() {
    return this.inner.ability_num
  }
  set abilityNum(value: number) {
    this.inner.ability_num = value
  }

  get markings() {
    return markingsFourShapesFromWasm(this.inner.markings)
  }
  set markings(value: jsTypes.MarkingsFourShapes) {
    this.inner.markings = markingsFourShapesToWasm(value)
  }

  get personalityValue() {
    return this.inner.personality_value
  }
  set personalityValue(value: number) {
    this.inner.personality_value = value
  }

  get nature() {
    return this.inner.nature.copy()
  }

  get isFatefulEncounter() {
    return this.inner.is_fateful_encounter
  }
  set isFatefulEncounter(value: boolean) {
    this.inner.is_fateful_encounter = value
  }

  get gender() {
    return this.inner.gender
  }
  set gender(value: number) {
    this.inner.gender = value
  }

  get formNum() {
    return this.inner.formIndex
  }

  get evs() {
    return this.inner.evs
  }
  set evs(value: jsTypes.Stats) {
    this.inner.evs = statsToWasmStats8(value)
  }

  get contest() {
    return this.inner.contest
  }
  set contest(value: jsTypes.ContestStats) {
    this.inner.contest = contestStatsToWasm(value)
  }

  get pokerusByte() {
    return this.inner.pokerus_byte
  }
  set pokerusByte(value: number) {
    this.inner.pokerus_byte = value
  }

  get nickname() {
    return this.inner.nickname
  }
  set nickname(value: string) {
    this.inner.nickname = value
  }

  get moves() {
    const moves = Array.from(this.inner.move_indices)
    if (moves.length !== 4) {
      throw new Error(`PK3 WASM struct has move array length of ${moves.length} (expected 4)`)
    }

    return moves as FourMoves
  }
  set moves(value: FourMoves) {
    this.inner.move_indices = new Uint16Array(value)
  }

  get movePP() {
    const movePP = Array.from(this.inner.move_pp)
    if (movePP.length !== 4) {
      throw new Error(`PK3 WASM struct has move PP array length of ${movePP.length} (expected 4)`)
    }

    return movePP as FourMoves
  }
  set movePP(value: FourMoves) {
    this.inner.move_pp = new Uint8Array(value)
  }

  get movePPUps() {
    const movePPUps = Array.from(this.inner.move_pp_ups)
    if (movePPUps.length !== 4) {
      throw new Error(
        `PK7 WASM struct has move PP up array length of ${movePPUps.length} (expected 4)`
      )
    }

    return movePPUps as FourMoves
  }
  set movePPUps(value: FourMoves) {
    this.inner.move_pp_ups = new Uint8Array(value)
  }

  get ivs() {
    return this.inner.ivs
  }
  set ivs(value: jsTypes.Stats) {
    this.inner.ivs = statsToWasmStats8(value)
  }

  get isEgg() {
    return this.inner.is_egg
  }
  set isEgg(value: boolean) {
    this.inner.is_egg = value
  }

  get isNicknamed() {
    return this.inner.isNicknamed
  }

  get trainerName() {
    return this.inner.trainer_name
  }
  set trainerName(value: string) {
    this.inner.trainer_name = value
  }

  get trainerFriendship() {
    return this.inner.trainer_friendship
  }
  set trainerFriendship(value: number) {
    this.inner.trainer_friendship = value
  }

  get metLocationIndex() {
    return this.inner.met_location_index
  }
  set metLocationIndex(value: number) {
    this.inner.met_location_index = value
  }

  get ball() {
    return this.inner.ball
  }
  set ball(value: number) {
    this.inner.ball = value
  }

  get metLevel() {
    return this.inner.met_level
  }
  set metLevel(value: number) {
    this.inner.met_level = value
  }

  get gameOfOrigin() {
    return this.inner.game_of_origin
  }
  set gameOfOrigin(value: OriginGame) {
    this.inner.game_of_origin = value
  }

  get language() {
    return this.inner.language
  }
  set language(value: number) {
    this.inner.language = value
  }

  get statusCondition() {
    return this.inner.status_condition
  }
  set statusCondition(value: number) {
    this.inner.status_condition = value
  }

  get currentHP() {
    return this.inner.current_hp
  }
  set currentHP(value: number) {
    this.inner.current_hp = value
  }

  get ribbons() {
    return this.inner.ribbons.map((ribbonName) =>
      ribbonName.endsWith('Ribbon') ? ribbonName.substring(0, ribbonName.length - 7) : ribbonName
    )
  }
  set ribbons(ribbonNames: string[]) {
    this.inner.ribbons = ribbonNames
  }

  get trainerGender() {
    return binaryGenderToBool(this.inner.trainer_gender)
  }
  set trainerGender(value: boolean) {
    this.inner.trainer_gender = binaryGenderFromBool(value)
  }

  get heldItemName() {
    return this.inner.held_item_index?.name ?? 'None'
  }

  public refreshChecksum() {
    this.inner.refreshChecksum()
  }

  public toPCBytes() {
    const shuffledBytes = encryption.shuffleBlocksGen3(this.toBytes())

    return encryption.decryptByteArrayGen3(shuffledBytes)
  }

  public getLevel() {
    return this.speciesMetadata?.calculateLevel(this.exp) ?? 1
  }

  public isValid(): boolean {
    return this.dexNum > 0 && this.dexNum <= NationalDex.Deoxys
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
    return MetadataSummaryLookup(this.dexNum, this.formNum)
  }

  public get speciesMetadata() {
    return SpeciesLookup(this.dexNum)
  }

  static maxValidMove() {
    return 354
  }

  static maxValidBall() {
    return 12
  }
}
