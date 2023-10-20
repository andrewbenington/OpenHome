import { stats } from '../types'
import { Gen7OnData } from './gen7'

export interface Gen8OnData extends Gen7OnData {
  handlerID: number
  handlerLanguageIndex: number
  handlerLanguage: string

  favorite: boolean

  statNature: number
  gameOfOriginBattle: number
  affixedRibbon?: number
  homeTracker: Uint8Array
}

export function hasGen8OnData(obj: any): obj is Gen8OnData {
  return obj && 'homeTracker' in obj
}

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
