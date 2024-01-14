import { Type } from 'pokemon-resources'
import { POKEMON_DATA } from '../consts'
import { OHPKM } from './PKMTypes'
import { GamePKM } from './PKMTypes/GamePKM'

export interface Filter {
  dexNumber?: number
  formeNumber?: number
  heldItemIndex?: number
  abilityIndex?: number
  type1?: Type
  type2?: Type
  gameOfOrigin?: number
  ribbon?: string
  shiny?: string
  ball?: number
}

export function filterApplies(filter: Filter, mon: GamePKM | OHPKM) {
  if (filter.dexNumber && mon.dexNum !== filter.dexNumber) {
    return false
  }
  if (filter.formeNumber !== undefined && mon.formNum !== filter.formeNumber) {
    return false
  }
  if (filter.heldItemIndex !== undefined && mon.heldItemIndex !== filter.heldItemIndex) {
    return false
  }
  if (filter.ball !== undefined && 'ball' in mon && mon.ball !== filter.ball) {
    return false
  }
  if (
    filter.abilityIndex !== undefined &&
    (!('abilityIndex' in mon) || mon.abilityIndex !== filter.abilityIndex)
  ) {
    return false
  }
  if (filter.gameOfOrigin !== undefined && mon.gameOfOrigin !== filter.gameOfOrigin) {
    return false
  }
  if (filter.ribbon !== undefined) {
    if (!('ribbons' in mon)) return false
    if (filter.ribbon === 'Any') {
      if (mon.ribbons.length === 0) return false
    } else if (filter.ribbon === 'None') {
      if (mon.ribbons.length !== 0) return false
    } else if (!mon.ribbons.includes(filter.ribbon)) return false
  }
  if (filter.shiny) {
    switch (filter.shiny) {
      case 'Shiny':
        return mon.isShiny
      case 'Not Shiny':
        return !mon.isShiny
      case 'Square Shiny':
        return 'isSquareShiny' in mon && mon.isSquareShiny
      case 'Star Shiny':
        return 'isSquareShiny' in mon && mon.isShiny && !mon.isSquareShiny
    }
  }

  if (
    !(`${mon.dexNum}` in POKEMON_DATA) ||
    POKEMON_DATA[`${mon.dexNum}`].formes.length < mon.formNum
  ) {
    return false
  }

  const forme = POKEMON_DATA[`${mon.dexNum}`].formes[mon.formNum]
  if (filter.type1 !== undefined && !forme.types.includes(filter.type1)) {
    return false
  }
  if (filter.type2 !== undefined && !forme.types.includes(filter.type2)) {
    return false
  }
  return true
}
