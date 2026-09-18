import { NationalDex } from '@pkm-rs/pkg'

export * from './interfaces'
export * from './pkmInterface'
export * from './ribbonLogic'

const GENDER_DIFFERENCE_NATIONAL_DEX = [
  3, 12, 19, 20, 25, 26, 41, 42, 44, 45, 64, 65, 84, 85, 97, 111, 112, 118, 119, 123, 129, 130, 133,
  154, 165, 166, 178, 185, 186, 190, 194, 195, 198, 202, 203, 207, 208, 212, 214, 215, 215, 217,
  221, 224, 229, 232, 255, 256, 257, 267, 269, 272, 274, 275, 307, 308, 315, 316, 317, 322, 323,
  332, 350, 369, 396, 397, 398, 399, 400, 401, 402, 403, 404, 405, 407, 415, 417, 418, 419, 424,
  443, 444, 445, 449, 450, 453, 454, 456, 457, 459, 460, 461, 464, 465, 473, 521, 592, 593, 668,
  902,
]

export function nationalDexHasGenderDifference(nationalDex: number): boolean {
  return GENDER_DIFFERENCE_NATIONAL_DEX.includes(nationalDex)
}

const GENDER_FORM_DIFFERENCE_NATIONAL_DEX = [
  NationalDex.Frillish,
  NationalDex.Jellicent,
  NationalDex.Pyroar,
  NationalDex.Meowstic,
  NationalDex.Indeedee,
  NationalDex.Basculegion,
  NationalDex.Oinkologne,
]

export function nationalDexHasGenderFormDifference(nationalDex: number): boolean {
  return GENDER_FORM_DIFFERENCE_NATIONAL_DEX.includes(nationalDex)
}
