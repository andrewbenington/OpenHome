export interface Gen5OnlyData {
  pokeStarFame: number
  isNsPokemon: boolean
}

export function hasGen5OnlyData(obj: any): obj is Gen5OnlyData {
  return obj && 'pokeStarFame' in obj
}
