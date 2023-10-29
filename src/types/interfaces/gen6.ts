import { geolocation, memory } from '../types'
import { Gen4OnData } from './gen4'

export interface Gen6OnData extends Gen4OnData {
  encryptionConstant: number

  contestMemoryCount: number
  battleMemoryCount: number

  relearnMoves: [number, number, number, number]

  handlerName: string

  isCurrentHandler: boolean
  handlerFriendship: number

  handlerGender: boolean

  formArgument: number
}

export function hasGen6OnData(obj: any): obj is Gen6OnData {
  return obj && 'encryptionConstant' in obj
}

export interface MemoryData {
  trainerMemory: memory
  handlerMemory: memory
}

export function hasMemoryData(obj: any): obj is MemoryData {
  return obj && 'trainerMemory' in obj
}

export interface N3DSOnlyData extends MemoryData {
  handlerAffection: number

  superTrainingFlags: number
  superTrainingDistFlags: number
  secretSuperTrainingUnlocked: boolean
  secretSuperTrainingComplete: boolean

  country: number
  region: number
  consoleRegion: number

  geolocations: [geolocation, geolocation, geolocation, geolocation, geolocation] | undefined

  trainerAffection: number

  fullness: number
  enjoyment: number
}

export function hasN3DSOnlyData(obj: any): obj is N3DSOnlyData {
  return obj && 'geolocations' in obj
}
