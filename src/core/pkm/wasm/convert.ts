import { PKMDate } from '@openhome-core/util/types'
import { PokeDate } from '@pkm-rs/pkg/pkm_rs'

export function convertPokeDate(date: PokeDate): PKMDate {
  return {
    year: date.year(),
    month: date.month,
    day: date.day,
  }
}

export function convertPokeDateOptional(date?: PokeDate | null): PKMDate | undefined {
  if (!date) return undefined

  return {
    year: date.year(),
    month: date.month,
    day: date.day,
  }
}
