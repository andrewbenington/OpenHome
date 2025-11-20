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

export function geolocationsFromWasm(
  value: PkmWasm.Geolocations | undefined
): Geolocation[] | undefined {
  if (!value) return undefined
  return [
    geolocationFromWasm(value[0]),
    geolocationFromWasm(value[1]),
    geolocationFromWasm(value[2]),
    geolocationFromWasm(value[3]),
    geolocationFromWasm(value[4]),
  ]
}

export function geolocationsToWasm(
  value: Geolocation[] | undefined
): PkmWasm.Geolocations | undefined {
  if (!value) return undefined
  return new PkmWasm.Geolocations(
    geolocationToWasm(value[0]),
    geolocationToWasm(value[1]),
    geolocationToWasm(value[2]),
    geolocationToWasm(value[3]),
    geolocationToWasm(value[4])
  )
}

export function contestStatsFromWasm(value: PkmWasm.ContestStats): ContestStats {
  return {
    cool: value.cool,
    beauty: value.beauty,
    cute: value.cute,
    smart: value.smart,
    tough: value.tough,
    sheen: value.sheen,
  }
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

export function stats8FromWasm(value: PkmWasm.Stats8): Stats {
  return {
    hp: value.hp,
    atk: value.atk,
    def: value.def,
    spa: value.spa,
    spd: value.spe,
    spe: value.spe,
  }
}

export function stats8ToWasm(value: Stats): PkmWasm.Stats8 {
  return new PkmWasm.Stats8(value.hp, value.atk, value.def, value.spa, value.spd, value.spe)
}

export function stats8ToWasmNullable(value: Stats | undefined): PkmWasm.Stats8 | undefined {
  if (!value) return undefined
  return new PkmWasm.Stats8(value.hp, value.atk, value.def, value.spa, value.spd, value.spe)
}

export function statsFromWasm(value: PkmWasm.Stats16Le | PkmWasm.Stats8): Stats {
  return {
    hp: value.hp,
    atk: value.atk,
    def: value.def,
    spa: value.spa,
    spd: value.spe,
    spe: value.spe,
  }
}

export function stats16LeToWasmNullable(value: Stats | undefined): PkmWasm.Stats16Le | undefined {
  if (!value) return undefined
  return new PkmWasm.Stats16Le(value.hp, value.atk, value.def, value.spa, value.spd, value.spe)
}

export function statsFromWasmNullable(
  value: PkmWasm.Stats8 | PkmWasm.Stats16Le | undefined
): Stats | undefined {
  if (!value) return undefined
  return {
    hp: value.hp,
    atk: value.atk,
    def: value.def,
    spa: value.spa,
    spd: value.spd,
    spe: value.spe,
  }
}

export function stats16LeToWasm(value: Stats): PkmWasm.Stats16Le {
  return new PkmWasm.Stats16Le(value.hp, value.atk, value.def, value.spa, value.spd, value.spe)
}

export function statsPreSplitFromWasm(
  value: PkmWasm.StatsPreSplit | undefined
): StatsPreSplit | undefined {
  if (!value) return undefined
  return {
    hp: value.hp,
    atk: value.atk,
    def: value.def,
    spc: value.spc,
    spe: value.spe,
  }
}

export function statsPreSplitToWasm(
  value: StatsPreSplit | undefined
): PkmWasm.StatsPreSplit | undefined {
  if (!value) return undefined
  return new PkmWasm.StatsPreSplit(value.hp, value.atk, value.def, value.spc, value.spe)
}

export function trainerMemoryFromWasm(value: PkmWasm.TrainerMemory): Memory {
  return {
    intensity: value.intensity,
    memory: value.memory,
    feeling: value.feeling,
    textVariables: value.textVariables,
  }
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

export function genderToWasm(value: number) {
  return value === 1 ? PkmWasm.Gender.Female : PkmWasm.Gender.Male
}

export function genderFromWasm(value: PkmWasm.Gender) {
  return value === PkmWasm.Gender.Female ? 1 : 0
}
