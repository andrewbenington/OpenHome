export type PokedexStatus = 'Seen' | 'Caught' | 'ShinyCaught'
export type PokedexEntry = { forms: Record<number, PokedexStatus> }
export type Pokedex = { byDexNumber: Record<number, PokedexEntry> }
export type PokedexUpdate = {
  dexNumber: number
  formIndex: number
  status: PokedexStatus
}
