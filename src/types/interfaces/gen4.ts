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

export function shinyLeafValues(shinyLeafNumber: number) {
  return {
    first: !!(shinyLeafNumber & 1),
    second: !!(shinyLeafNumber & 2),
    third: !!(shinyLeafNumber & 4),
    fourth: !!(shinyLeafNumber & 8),
    fifth: !!(shinyLeafNumber & 16),
    crown: !!(shinyLeafNumber & 32),
  }
}

export interface Gen4EncounterType {
  encounterType: number
}
