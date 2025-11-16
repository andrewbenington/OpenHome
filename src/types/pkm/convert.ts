import {
  ContestStats,
  Geolocation,
  MarkingsSixShapesWithColor,
  Memory,
  PKMDate,
  Stats,
  StatsPreSplit,
} from '../../../packages/pokemon-files/src'
import * as PkmWasm from '../../../pkm_rs/pkg'

export function convertPokeDate(date: PkmWasm.PokeDate): PKMDate {
  return {
    year: date.year(),
    month: date.month,
    day: date.day,
  }
}

export function convertPokeDateOptional(date?: PkmWasm.PokeDate | null): PKMDate | undefined {
  if (!date) return undefined

  return {
    year: date.year(),
    month: date.month,
    day: date.day,
  }
}

export function geolocationFromWasm(value: PkmWasm.Geolocation): Geolocation {
  return {
    region: value.region,
    country: value.country,
  }
}

export function geolocationToWasm(value: Geolocation): PkmWasm.Geolocation {
  return new PkmWasm.Geolocation(value.region, value.country)
}

export function geolocationsFromWasm(value: PkmWasm.Geolocations): Geolocation[] {
  return [
    geolocationFromWasm(value[0]),
    geolocationFromWasm(value[1]),
    geolocationFromWasm(value[2]),
    geolocationFromWasm(value[3]),
    geolocationFromWasm(value[4]),
  ]
}

export function geolocationsToWasm(value: Geolocation[]): PkmWasm.Geolocations {
  return new PkmWasm.Geolocations(
    geolocationToWasm(value[0]),
    geolocationToWasm(value[1]),
    geolocationToWasm(value[2]),
    geolocationToWasm(value[3]),
    geolocationToWasm(value[4])
  )
}

export function contestStatsFromWasm(value: PkmWasm.ContestStats): ContestStats {
  const { free: _, ...stats } = value
  return stats
}

export function contestStatsToWasm(value: ContestStats): PkmWasm.ContestStats {
  return new PkmWasm.ContestStats(
    value.cool,
    value.beauty,
    value.cute,
    value.smart,
    value.tough,
    value.sheen
  )
}

export function statsFromWasmStats8(value: PkmWasm.Stats8): Stats {
  const { free: _, ...stats } = value
  return stats
}

export function statsToWasmStats8(value: Stats): PkmWasm.Stats8 {
  return new PkmWasm.Stats8(value.hp, value.atk, value.def, value.spa, value.spd, value.spe)
}

export function statsFromWasmStats16Le(value: PkmWasm.Stats16Le): Stats {
  const { free: _, ...stats } = value
  return stats
}

export function statsToWasmStats16Le(value: Stats): PkmWasm.Stats16Le {
  return new PkmWasm.Stats16Le(value.hp, value.atk, value.def, value.spa, value.spd, value.spe)
}

export function statsPreSplitFromWasm(value: PkmWasm.StatsPreSplit): StatsPreSplit {
  const { free: _, ...stats } = value
  return stats
}

export function statsPreSplitToWasm(value: StatsPreSplit): PkmWasm.StatsPreSplit {
  return new PkmWasm.StatsPreSplit(value.hp, value.atk, value.def, value.spc, value.spe)
}

export function trainerMemoryToWasm(value: Memory): PkmWasm.TrainerMemory {
  return new PkmWasm.TrainerMemory(
    value.intensity,
    value.memory,
    value.feeling,
    value.textVariables
  )
}

export function markingsColorValueFromWasm(value: PkmWasm.MarkingValue): 'blue' | 'red' | null {
  switch (value) {
    case PkmWasm.MarkingValue.Blue:
      return 'blue'
    case PkmWasm.MarkingValue.Red:
      return 'red'
    case PkmWasm.MarkingValue.Unset:
      return null
  }
}

export function markingsSixShapesColorsFromWasm(
  value: PkmWasm.MarkingsSixShapesColors
): MarkingsSixShapesWithColor {
  return {
    circle: markingsColorValueFromWasm(value.circle),
    square: markingsColorValueFromWasm(value.square),
    triangle: markingsColorValueFromWasm(value.triangle),
    heart: markingsColorValueFromWasm(value.heart),
    star: markingsColorValueFromWasm(value.star),
    diamond: markingsColorValueFromWasm(value.diamond),
  }
}

export function markingsSixShapesColorsToWasm(
  value: MarkingsSixShapesWithColor
): PkmWasm.MarkingsSixShapesColors {
  return new PkmWasm.MarkingsSixShapesColors(
    value.circle,
    value.square,
    value.triangle,
    value.heart,
    value.star,
    value.diamond
  )
}
