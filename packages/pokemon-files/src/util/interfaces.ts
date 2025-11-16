import { NatureIndex } from '@pkm-rs/pkg'
import { Stats, StatsPreSplit } from './types'

export interface AllPKMs extends SpeciesData {
  exp: number
  format: string
}

export interface SpeciesData {
  dexNum: number
  formeNum: number
}

export interface PKMWithModernIVs {
  ivs: Stats
}

export interface PKMWithDVs {
  dvs: StatsPreSplit
}

export interface PKMWithModernEVs {
  evs: Stats
}

export interface PKMWithGameBoyEVs {
  evsG12: StatsPreSplit
}

export interface PKMWithNature {
  nature: NatureIndex
}
