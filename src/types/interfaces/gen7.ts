import { hyperTrainStats, stats } from '../types'
import { Gen6OnData } from './gen6'

export interface Gen7OnData extends Gen6OnData {
  hyperTraining: hyperTrainStats
}

export function hasGen7OnData(obj: any): obj is Gen7OnData {
  return obj && 'hyperTraining' in obj
}

export interface Gen7OnlyData {
  resortEventStatus: number
}

export interface LetsGoData
  extends Gen7OnlyData,
    Omit<Gen7OnData, 'contestMemoryCount' | 'battleMemoryCount' | 'trainerMemory'> {
  avs: stats
  ivs: stats
  favorite: boolean
}

export function hasLetsGoData(obj: any): obj is LetsGoData {
  return obj && 'avs' in obj
}

export interface Size {
  height: number
  weight: number
}
