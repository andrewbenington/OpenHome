import { MetadataLookup, OriginGame } from '@pkm-rs/pkg'
import { Type } from '@pokemon-resources/index'
import { PKMInterface } from './interfaces'
import { isMegaStone, isZCrystal } from './pkm/util'

export interface Filter {
  dexNumber?: number
  formeNumber?: number
  heldItem?: number | HeldItemCategory
  ability?: number
  type1?: Type
  type2?: Type
  gameOfOrigin?: OriginGame
  ribbon?: string
  shiny?: string
  ball?: number
  isEgg?: boolean
}

export type HeldItemFilter = number | HeldItemCategory

export function filterApplies(filter: Filter, mon: PKMInterface) {
  if (filter.dexNumber && mon.dexNum !== filter.dexNumber) {
    return false
  }
  if (filter.formeNumber !== undefined && mon.formeNum !== filter.formeNumber) {
    return false
  }
  if (filter.heldItem !== undefined && !heldItemPassesFilter(mon.heldItemIndex, filter.heldItem)) {
    return false
  }
  if (filter.ball !== undefined && 'ball' in mon && mon.ball !== filter.ball) {
    return false
  }
  if (filter.isEgg !== undefined && mon.isEgg !== filter.isEgg) {
    return false
  }
  if (
    filter.ability !== undefined &&
    (!('ability' in mon) || mon.ability?.index !== filter.ability)
  ) {
    return false
  }
  if (filter.gameOfOrigin !== undefined && mon.gameOfOrigin !== filter.gameOfOrigin) {
    return false
  }
  if (filter.ribbon !== undefined) {
    if (!mon.ribbons) return false
    if (filter.ribbon === 'Any Ribbon') {
      if (mon.ribbons.length === 0) return false
    } else if (filter.ribbon === 'No Ribbon') {
      if (mon.ribbons.length !== 0) return false
    } else if (!mon.ribbons.includes(filter.ribbon)) return false
  }
  if (filter.shiny) {
    switch (filter.shiny) {
      case 'Shiny':
        return mon.isShiny()
      case 'Not Shiny':
        return !mon.isShiny()
      case 'Square Shiny':
        return 'isSquareShiny' in mon && mon.isSquareShiny()
      case 'Star Shiny':
        return 'isSquareShiny' in mon && mon.isShiny() && !mon.isSquareShiny()
    }
  }

  const formeMetadata = MetadataLookup(mon.dexNum, mon.formeNum)
  if (!formeMetadata) {
    return false
  }

  if (
    filter.type1 !== undefined &&
    formeMetadata.type1 !== filter.type1 &&
    formeMetadata.type2 !== filter.type1
  ) {
    return false
  }

  if (
    filter.type2 !== undefined &&
    formeMetadata.type1 !== filter.type2 &&
    formeMetadata.type2 !== filter.type2
  ) {
    return false
  }
  return true
}

export type HeldItemCategory = 'any' | 'mega_stone' | 'z_crystal'

function heldItemPassesFilter(heldItemIndex: number, filter: HeldItemFilter): boolean {
  if (typeof filter === 'number') {
    return heldItemIndex === filter
  }

  switch (filter) {
    case 'any':
      return heldItemIndex > 0
    case 'mega_stone':
      return isMegaStone(heldItemIndex)
    case 'z_crystal':
      return isZCrystal(heldItemIndex)
  }
}
