import { pokedate } from '../types'
import { Gen3OnData } from './gen3'

export interface Gen4OnData extends Gen3OnData {
  metDate: pokedate
  eggDate?: pokedate
  eggLocationIndex?: number
  eggLocation?: string

  isNicknamed: boolean
}

export function hasGen4OnData(obj: any): obj is Gen4OnData {
  return obj && 'metDate' in obj
}

export interface Gen4OnlyData extends Gen3OnData {
  shinyLeaves: number
  performance: number
}

export function shinyLeafValues(mon: Gen4OnlyData) {
  return {
    first: !!(mon.shinyLeaves & 1),
    second: !!(mon.shinyLeaves & 2),
    third: !!(mon.shinyLeaves & 4),
    fourth: !!(mon.shinyLeaves & 8),
    fifth: !!(mon.shinyLeaves & 16),
    crown: !!(mon.shinyLeaves & 32),
  }
}

export function hasGen4OnlyData(obj: any): obj is Gen4OnlyData {
  return obj && 'shinyLeaves' in obj
}

export interface Gen4EncounterType {
  encounterType: number
}
