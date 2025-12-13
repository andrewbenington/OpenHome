import { PathData } from '@openhome/core/save/util/path'
import { Gender, OriginGame } from '@pkm-rs/pkg'
import { Either, left, right } from 'fp-ts/Either'
import { CSSProperties } from 'react'

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
export type MarkingValue = boolean | 'blue' | 'red' | null

export interface SaveRef extends Partial<JSONObject> {
  filePath: PathData
  game: OriginGame | null
  trainerName: string | null
  trainerID: string | null
  lastOpened: number | null
  lastModified: number | null
  valid: boolean | null
  pluginIdentifier: string | null
}
export type SaveRefMap = { [key: string]: SaveRef }

export type RegionalForme = 'Alola' | 'Galar' | 'Hisui' | 'Paldea'

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
export function Err<T>(inner: T) {
  return left(inner)
}
export function Ok<T>(inner: T) {
  return right(inner)
}

export type LookupMap = Record<string, string>

export type LoadSaveResponse = {
  path: PathData
  fileBytes: Uint8Array
  createdDate?: Date
}

export interface PKMFormeRef {
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

export type JSONValue = string | number | boolean | null | undefined | JSONArray | JSONObject

export interface JSONObject extends Record<string, JSONValue> {}

export interface JSONArray extends Array<JSONValue> {}

type CSSVariable = `--${string}`
export type CSSWithVariables = CSSProperties & Record<CSSVariable, string | undefined>

export function displayGender(gender: Gender): string {
  switch (gender) {
    case Gender.Male:
      return 'Male'
    case Gender.Female:
      return 'Female'
    case Gender.Genderless:
      return 'Genderless'
    default:
      return '(Invalid)'
  }
}

export function genderSymbol(gender: Gender): string {
  switch (gender) {
    case Gender.Male:
      return '♂'
    case Gender.Female:
      return '♀'
    default:
      return ''
  }
}
