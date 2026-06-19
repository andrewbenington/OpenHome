import moves from './moves.json'

export type Move = {
  name: string
  accuracy?: number
  class: 'physical' | 'status' | 'special'
  generation: string
  power?: number
  pp: number
  pastGenPP: {
    G1?: number
    G2?: number
    G3?: number
    G4?: number
    G5?: number
    G6?: number
    SMUSUM?: number
    LGPE?: number
    G8?: number
    LA?: number
  }
  type: string
  id: number
}

export const Moves = moves as unknown as Move[]
