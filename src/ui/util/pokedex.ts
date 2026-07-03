export type PokedexEntry = { formes: Record<number, PokedexStatus> }
export type PokedexStatus = 'Seen' | 'Caught' | 'ShinyCaught'
export type Pokedex = { byDexNumber: Record<number, PokedexEntry> }
export type PokedexUpdate = {
  dexNumber: number
  formIndex: number
  status: PokedexStatus
}
