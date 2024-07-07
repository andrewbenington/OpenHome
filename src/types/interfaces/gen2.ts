import { PKMFile } from '../pkm/util'

export interface Gen2OnData {
  gender: number
  pokerusByte: number
  isEgg: boolean

  metLocationIndex: number
  metLocation?: string
  metLevel: number

  trainerFriendship: number
}

export function hasGen2OnData<T extends PKMFile>(obj: T): obj is WithGender<T> {
  return obj && 'gender' in obj
}
export type WithGender<T> = T extends { gender: number } ? T : never

export interface Gen2OnlyData {
  metTimeOfDay: number
}
