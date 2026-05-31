import * as PkmWasm from '../../../../../pkm_rs/pkg'
import { ContestStats, MarkingsFourShapes, MarkingsSixShapesWithColor, PKMDate } from '../../util'

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
  const { free, ...stats } = value
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

export function markingsFourShapesFromWasm(value: PkmWasm.MarkingsFourShapes): MarkingsFourShapes {
  const { circle, square, triangle, heart } = value
  return {
    circle,
    square,
    triangle,
    heart,
  }
}

export function markingsFourShapesToWasm(value: MarkingsFourShapes): PkmWasm.MarkingsFourShapes {
  return new PkmWasm.MarkingsFourShapes(value.circle, value.square, value.triangle, value.heart)
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

export function binaryGenderFromBool(value: boolean): PkmWasm.BinaryGender {
  return value ? PkmWasm.BinaryGender.Female : PkmWasm.BinaryGender.Male
}

export function binaryGenderToBool(value: PkmWasm.BinaryGender): boolean {
  return value === PkmWasm.BinaryGender.Female
}
