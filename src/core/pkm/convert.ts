import * as PkmWasm from '@pkm-rs/pkg'
import { ContestStats, MarkingsSixShapesWithColor, Memory, PKMDate } from '@pokemon-files/util'

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
