import { PKMFile } from '../pkm/util'
import { pokedate } from '../types'
import { Gen3OnData } from './gen3'

export interface Gen4OnData extends Gen3OnData {
  metDate: pokedate
  eggDate?: pokedate
  eggLocationIndex?: number
  eggLocation?: string

  isNicknamed: boolean
}

export function hasGen4OnData<T extends PKMFile>(obj: T): obj is WithMetDate<T> {
  return obj && 'metDate' in obj
}
export type WithMetDate<T> = T extends { metDate: pokedate } ? T : never

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
