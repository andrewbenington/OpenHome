import { PKMFile } from '../pkm/util'
import { stats } from '../types'
import { MemoryData } from './gen6'
import { Gen7OnData } from './gen7'

export interface Gen8OnData extends Gen7OnData, MemoryData {
  handlerID: number
  handlerLanguage: number

  favorite: boolean

  statNature: number
  gameOfOriginBattle: number
  affixedRibbon?: number
  homeTracker: ArrayBuffer
}

export function hasGen8OnData<T extends PKMFile>(obj: T): obj is WithHomeTracker<T> {
  return obj && 'homeTracker' in obj
}
export type WithHomeTracker<T> = T extends { homeTracker: ArrayBuffer } ? T : never

export interface Gen8OnlyData extends Gen7OnData {
  canGigantamax: boolean
  isSquareShiny: boolean
  dynamaxLevel: number
  palma: number
  sociability: number
}

export function hasGen8OnlyData(obj: any): obj is Gen8OnlyData {
  return obj && 'sociability' in obj
}

export interface PK8OnlyData {
  fullness: number
  enjoyment: number
}

export interface PLAData {
  gvs: stats
  moveFlagsLA: Uint8Array
  tutorFlagsLA: Uint8Array
  masterFlagsLA: Uint8Array
  isAlpha: boolean
  alphaMove: number
  isNoble: boolean
  flag2LA: boolean
  unknownA0: number
  unknownF3: number

  heightAbsoluteBytes: Uint8Array
  weightAbsoluteBytes: Uint8Array
  heightAbsolute: number
  weightAbsolute: number
}

export function hasPLAData(obj: any): obj is PLAData {
  return obj && 'gvs' in obj
}
