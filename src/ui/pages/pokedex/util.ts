import { FormeMetadata, SpeciesMetadata } from '@pkm-rs/pkg'
import { Pokedex, PokedexStatus } from 'src/ui/util/pokedex'

export function getHighestFormeStatus(
  pokedex: Pokedex,
  species: SpeciesMetadata
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
  Caught: 1,
  ShinyCaught: 2,
}

export function getPokedexSummary(species: SpeciesMetadata, forme: FormeMetadata) {
  const types = forme.type2 ? `${forme.type1}- and ${forme.type2}-type` : `${forme.type1}-type`
  const name = forme.formeIndex === 0 ? species.name : forme.formeName
  const formeType =
    forme.formeIndex === 0
      ? getBaseFormeDescriptor(species)
      : forme.isMega
        ? 'Mega Evolution'
        : 'forme'
  let text = `${name} is a ${types} ${formeType} introduced in Generation ${forme.introducedGen}.`

  if (forme.formeName === 'Basculin-White-Striped') {
    text += ` It is sometimes considered a regional forme from the ${forme.regional} region.`
  } else if (forme.regional) {
    text += ` It is a regional forme from the ${forme.regional} region.`
  }

  if (forme.isBattleOnly) {
    text += ` This forme can only be seen in battle.`
  }

  return text
}

function getBaseFormeDescriptor(species: SpeciesMetadata) {
  const baseForme = species.formes[0]

  if (baseForme.isMythical) {
    return 'Mythical Pokémon'
  }
  if (baseForme.isRestrictedLegend) {
    return 'restricted Legendary Pokémon'
  }
  if (baseForme.isUltraBeast) {
    return 'Ultra Beast'
  }
  if (baseForme.isSubLegend) {
    return 'Legendary Pokémon'
  }
  if (baseForme.isParadox) {
    return 'Paradox Pokémon'
  }

  return 'Pokémon'
}
