import { CSSProperties } from 'react'
import { ParsedPath } from './SAVTypes/path'

/* eslint-disable no-unused-vars */
export type StringToStringMap = { [key: string]: string }
export type KeyValuePairList = { key: string; value: string }[]
export type Stat = 'HP' | 'Atk' | 'Def' | 'SpA' | 'SpD' | 'Spe' | 'Sp'
export type Type =
  | 'Fire'
  | 'Grass'
  | 'Electric'
  | 'Ghost'
  | 'Fairy'
  | 'Water'
  | 'Ice'
  | 'Rock'
  | 'Ground'
  | 'Flying'
  | 'Fighting'
  | 'Psychic'
  | 'Dark'
  | 'Bug'
  | 'Steel'
  | 'Poison'
  | 'Dragon'
  | 'Normal'
export type levelUpType =
  | 'Slow'
  | 'Medium Slow'
  | 'Medium Fast'
  | 'Fast'
  | 'Erratic'
  | 'Fluctuating'

export enum SaveType {
  UNKNOWN,
  RGBY_J,
  RBY_I,
  GS_J,
  GS_I,
  C_J,
  C_I,
  RS,
  FRLG,
  E,
  DP,
  Pt,
  HGSS,
  G5,
  G6,
}

export interface pokedate {
  month: number
  day: number
  year: number
}

export interface memory {
  intensity: number
  memory: number
  feeling: number
  textVariables: number
}

export interface stats {
  hp: number
  atk: number
  def: number
  spa: number
  spd: number
  spe: number
}

export interface statsPreSplit {
  hp: number
  atk: number
  def: number
  spc: number
  spe: number
}

export interface hyperTrainStats {
  hp: boolean
  atk: boolean
  def: boolean
  spa: boolean
  spd: boolean
  spe: boolean
}

export interface contestStats {
  cool: number
  beauty: number
  cute: number
  smart: number
  tough: number
  sheen: number
}

export interface geolocation {
  region: number
  country: number
}

// 1 = blue/black, 2 = red
export type marking = 0 | 1 | 2

export const getSaveTypeString = (saveType: SaveType): string => {
  switch (saveType) {
    case SaveType.RGBY_J:
      return 'Pokémon Red/Blue/Green/Yellow (JP)'
    case SaveType.RBY_I:
      return 'Pokémon Red/Blue/Yellow (INT)'
    case SaveType.GS_J:
      return 'Pokémon Gold/Silver (JP)'
    case SaveType.GS_I:
      return 'Pokémon Gold/Silver (INT)'
    case SaveType.C_J:
      return 'Pokémon Crystal (JP)'
    case SaveType.C_I:
      return 'Pokémon Crystal'
    case SaveType.RS:
      return 'Pokémon Ruby/Sapphire'
    case SaveType.FRLG:
      return 'Pokémon FireRed/LeafGreen'
    case SaveType.E:
      return 'Pokémon Emerald'
    case SaveType.DP:
      return 'Pokémon Diamond/Pearl'
    case SaveType.Pt:
      return 'Pokémon Platinum'
    case SaveType.HGSS:
      return 'Pokémon HeartGold/SoulSilver'
    case SaveType.G5:
      return 'Pokémon Black/White/Black 2/White 2'
    case SaveType.G6:
      return 'Pokémon Omega Ruby/Alpha Sapphire'
    default:
      return 'Unknown Game'
  }
}

export interface SaveRef {
  filePath: ParsedPath
  saveType: SaveType
  game?: string
  trainerName?: string
  trainerID?: string
  lastOpened?: number
}
export type SaveRefMap = { [key: string]: SaveRef }

export type RegionalForme = 'Alola' | 'Galar' | 'Hisui' | 'Paldea'

export type MonReference = { dexNumber: number; formeNumber: number }

export type Forme = {
  name: string
  formeName: string
  formeNumber: number
  isBaseForme: boolean
  isMega: boolean
  isGMax: boolean
  isBattleOnly: boolean
  alias: string
  types: Type[]
  genderRatio: { M: number; F: number }
  baseStats: {
    hp: number
    atk: number
    def: number
    spa: number
    spd: number
    spe: number
  }
  ability1: string
  ability2?: string
  abilityH?: string
  height: number
  weight: number
  evos: MonReference[]
  prevo?: MonReference
  eggGroups: string[]
  gen: number
  regional?: RegionalForme
  subLegendary: boolean
  restrictedLegendary: boolean
  ultraBeast: boolean
  paradox: boolean
  mythical: boolean
  sprite: string
  spriteIndex: [number, number]
}

export type Pokemon = {
  name: string
  nationalDex: number
  formes: Forme[]
  levelUpType: levelUpType
}

export type Origin = {
  name: string
  mark?: string
  region?: string
  logo?: string
  gc?: number
}

export type Move = {
  name: string
  accuracy?: number
  class: 'physical' | 'status' | 'special'
  generation: string
  power?: number
  pp: number
  pastGenPP: {
    G1?: number
    G2?: number
    G3?: number
    G4?: number
    G5?: number
    G6?: number
    SMUSUM?: number
    LGPE?: number
    G8?: number
    LA?: number
  }
  type: string
  id: number
}

export type GameLocations = { [key: number]: string[] }

export interface SaveCoordinates {
  saveNumber: number // -1 means OpenHome
  box: number
  index: number
}

export type Styles = { [key: string]: CSSProperties }
