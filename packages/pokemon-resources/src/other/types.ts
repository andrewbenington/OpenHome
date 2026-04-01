import { PkmType, PkmTypes } from '@pkm-rs/pkg'

export type TeraType = PkmType | 'Stellar'

export const Types: PkmType[] = [
  'Normal',
  'Fighting',
  'Flying',
  'Poison',
  'Ground',
  'Rock',
  'Bug',
  'Ghost',
  'Steel',
  'Fire',
  'Water',
  'Grass',
  'Electric',
  'Psychic',
  'Ice',
  'Dragon',
  'Dark',
  'Fairy',
]

export function teraTypeStringFromIndex(index: number) {
  return index === 99 ? 'Stellar' : PkmTypes.toString(index)
}
