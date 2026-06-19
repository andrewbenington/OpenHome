import { PKMDate } from '@openhome-core/util/types'
import * as PkmWasm from '@pkm-rs/pkg'

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

export function genderToWasm(value: number) {
  return value === 1 ? PkmWasm.Gender.Female : PkmWasm.Gender.Male
}

export function genderFromWasm(value: PkmWasm.Gender) {
  return value === PkmWasm.Gender.Female ? 1 : 0
}
