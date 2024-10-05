import { PKMFile } from '../pkm/util'
import { contestStats, stats, statsPreSplit } from '../types'

export interface GameBoyStats {
  evsG12: statsPreSplit
  dvs: statsPreSplit
}

export function hasGameBoyData<T extends PKMFile>(obj: T): obj is WithG12EVs<T> {
  return obj && 'evsG12' in obj
}
export type WithG12EVs<T> = T extends { evsG12: statsPreSplit } ? T : never

export interface Gen1Stats extends GameBoyStats {
  stats: statsPreSplit
}

export interface Gen2Stats extends GameBoyStats {
  stats: stats
}

export interface ContestStats {
  contest: contestStats
}
