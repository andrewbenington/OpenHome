import * as PkmWasm from '../../../../../pkm_rs/pkg'
import { PKMDate } from '../../util'

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

export function binaryGenderFromBool(value: boolean): PkmWasm.BinaryGender {
  return value ? PkmWasm.BinaryGender.Female : PkmWasm.BinaryGender.Male
}

export function binaryGenderToBool(value: PkmWasm.BinaryGender): boolean {
  return value === PkmWasm.BinaryGender.Female
}
