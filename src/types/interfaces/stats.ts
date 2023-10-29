import { contestStats, stats, statsPreSplit } from '../types'

export interface GameBoyStats {
  evsG12: statsPreSplit
  dvs: statsPreSplit
}

export function hasGameBoyData(obj: any): obj is GameBoyStats {
  return obj && 'evsG12' in obj
}

export interface Gen1Stats extends GameBoyStats {
  stats: statsPreSplit
}

export interface Gen2Stats extends GameBoyStats {
  stats: stats
}

export interface ContestStats {
  contest: contestStats
}
