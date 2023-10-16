import { contestStats, stats, statsPreSplit } from '../types'

export interface ModernEVsIVs {
  evs: stats
  ivs: stats
}

export interface ModernStats {
  stats: stats
}

export interface GameBoyEVs {
  evsG12: statsPreSplit
}

export interface DVs {
  dvs: statsPreSplit
}

export interface Gen1Stats {
  stats: statsPreSplit
}

export interface LetsGoStats {
  avs: stats
  ivs: stats
}

export interface ContestStats {
  contest: contestStats
}

export interface GVs {
  gvs: stats
}

export interface SpecialSplitStats extends ModernEVsIVs, ModernStats {}
