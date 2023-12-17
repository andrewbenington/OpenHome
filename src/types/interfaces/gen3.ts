import { contestStats, marking, stats } from '../types'
import { Gen2OnData } from './gen2'

export interface Gen3OnData extends Gen2OnData {
  personalityValue: number

  ability: string
  abilityNum: number
  abilityIndex: number

  markings:
    | [marking, marking, marking, marking, marking, marking]
    | [marking, marking, marking, marking]

  nature: number
  isFatefulEncounter: boolean

  evs: stats
  ribbons: string[]

  ivs: stats

  gameOfOrigin: number

  metLocation: string

  ball: number
  stats: stats
}

export interface SanityChecksum {
  sanity: number
  checksum: number
}

export function hasGen3OnData(obj: any): obj is Gen3OnData {
  return obj && 'nature' in obj
}

export interface ContestData {
  contest: contestStats
}

export interface Gen3OrreData {
  isShadow: boolean
  shadowID: number
}

export function hasOrreData(obj: any): obj is Gen3OrreData {
  return obj && 'shadowID' in obj
}
