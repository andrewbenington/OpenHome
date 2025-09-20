export type PokedexStatus = 'Seen' | 'ShinySeen' | 'Caught' | 'ShinyCaught'
export type PokedexEntry = { formes: Record<number, PokedexStatus> }
export type Pokedex = { byDexNumber: Record<number, PokedexEntry> }
export type PokedexUpdate = {
  dexNumber: number
  formeNumber: number
  status: PokedexStatus
}
