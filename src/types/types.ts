import { Either } from 'fp-ts/Either'
import { CSSProperties } from 'react'
import { PathData } from './SAVTypes/path'

/* eslint-disable no-unused-vars */
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

export interface pokedate {
  month: number
  day: number
  year: number
}

// 1 = blue/black, 2 = red
export type marking = boolean | 'blue' | 'red' | null

export interface SaveRef extends Partial<JSONObject> {
  filePath: PathData
  game?: number
  trainerName?: string
  trainerID?: string
  lastOpened?: number
  lastModified?: number
  valid?: boolean
  pluginIdentifier?: string
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
  accuracy?: number | null
  class: 'physical' | 'status' | 'special'
  generation: string
  power?: number | null
  pp: number
  pastGenPP?: {
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

export type Errorable<T> = Either<string, T>

export type LookupMap = Record<string, string>

export type LoadSaveResponse = {
  path: PathData
  fileBytes: Uint8Array
  createdDate: Date
}

export interface PKMFormData {
  dexNum: number
  formeNum: number
}

export type ImageSource =
  | {
      publicDirPath: string
    }
  | {
      rawImageBase64: string
    }
  | undefined

export type JSONValue = string | number | boolean | null | JSONArray | JSONObject

export interface JSONObject extends Record<string, JSONValue> {}

export interface JSONArray extends Array<JSONValue> {}
