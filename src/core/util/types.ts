import { PathData } from '@openhome-core/save/util/path'
import { Gender, OriginGame } from '@pkm-rs/pkg'
import { CSSProperties } from 'react'
import { PluginIdentifier } from '../save/interfaces'

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
  pluginIdentifier: PluginIdentifier | null
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
