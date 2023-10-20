export interface Gen2OnData {
  gender: number
  pokerusByte: number
  isEgg: boolean

  metLocationIndex: number
  metLocation?: string
  metLevel: number

  trainerFriendship: number
}

export function hasGen2OnData(obj: any): obj is Gen2OnData {
  return obj && 'pokerusByte' in obj
}

export interface Gen2OnlyData {
  metTimeOfDay: number
}
