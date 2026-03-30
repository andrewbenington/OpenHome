import { PkmType } from '@pkm-rs/pkg'

export type TeraType = PkmType | 'Stellar'

export const Types: PkmType[] = [
  PkmType.Normal,
  PkmType.Fighting,
  PkmType.Flying,
  PkmType.Poison,
  PkmType.Ground,
  PkmType.Rock,
  PkmType.Bug,
  PkmType.Ghost,
  PkmType.Steel,
  PkmType.Fire,
  PkmType.Water,
  PkmType.Grass,
  PkmType.Electric,
  PkmType.Psychic,
  PkmType.Ice,
  PkmType.Dragon,
  PkmType.Dark,
  PkmType.Fairy,
]

export function teraTypeFromIndex(index: number) {
  return index === 99 ? 'Stellar' : Types[index]
}
