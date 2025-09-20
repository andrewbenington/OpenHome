import { Pokemon } from 'pokemon-species-data'
import { Pokedex, PokedexStatus } from '../../types/pokedex'
import { Forme } from '../../types/types'

export function getHighestFormeStatus(
  pokedex: Pokedex,
  species: Pokemon
): [number, PokedexStatus | undefined] {
  if (!(species.nationalDex in pokedex.byDexNumber)) return [0, undefined]

  let maxStatusForme = 0
  let maxStatus: PokedexStatus = 'Seen'

  for (const [formeIndex, status] of Object.entries(
    pokedex.byDexNumber[species.nationalDex].formes
  )) {
    if (StatusIndices[status] > StatusIndices[maxStatus]) {
      maxStatusForme = parseInt(formeIndex)
      maxStatus = status
    }
  }

  return [maxStatusForme, maxStatus]
}

export function getFormeStatus(
  pokedex: Pokedex,
  nationalDex: number,
  formeIndex: number
): PokedexStatus | undefined {
  if (!(nationalDex in pokedex.byDexNumber)) return undefined
  return pokedex.byDexNumber[nationalDex].formes[formeIndex]
}

export const StatusIndices: Record<PokedexStatus, number> = {
  Seen: 0,
  ShinySeen: 1,
  Caught: 2,
  ShinyCaught: 3,
}

export function getPokedexSummary(species: Pokemon, forme: Forme) {
  const types =
    forme.types.length === 1
      ? `${forme.types[0]}-type`
      : `${forme.types[0]}- and ${forme.types[1]}-type`
  const name = forme.formeNumber === 0 ? species.name : forme.formeName
  const formeType =
    forme.formeNumber === 0 ? getBaseFormeType(species) : forme.isMega ? 'mega-evolution' : 'forme'
  let text = `${name} is a ${types} ${formeType} introduced in Generation ${forme.gen}.`

  if (forme.regional) {
    text += ` It is a regional forme from the ${forme.regional} region.`
  }

  if (forme.isBattleOnly) {
    text += ` This forme can only be seen in battle.`
  }

  return text
}

function getBaseFormeType(species: Pokemon) {
  const baseForme = species.formes[0]

  if (baseForme.mythical) {
    return 'Mythical Pokémon'
  }
  if (baseForme.restrictedLegendary) {
    return 'restricted Legendary Pokémon'
  }
  if (baseForme.ultraBeast) {
    return 'Ultra Beast'
  }
  if (baseForme.subLegendary) {
    return 'Legendary Pokémon'
  }
  if (baseForme.paradox) {
    return 'Paradox Pokémon'
  }

  return 'Pokémon'
}
