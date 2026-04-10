import { Pokedex, PokedexStatus } from '@openhome-ui/util/pokedex'
import { FormeMetadata, SpeciesMetadata } from '@pkm-rs/pkg'

export function getHighestFormeStatus(
  pokedex: Pokedex,
  species: SpeciesMetadata
): [number, PokedexStatus | undefined] {
  if (!(species.nationalDex in pokedex.byDexNumber)) return [0, undefined]

  let maxStatusForme = 0
  let maxStatus: PokedexStatus = 'Seen'

  for (const [formIndex, status] of Object.entries(
    pokedex.byDexNumber[species.nationalDex].formes
  )) {
    if (StatusIndices[status] > StatusIndices[maxStatus]) {
      maxStatusForme = parseInt(formIndex)
      maxStatus = status
    }
  }

  return [maxStatusForme, maxStatus]
}

export function getFormeStatus(
  pokedex: Pokedex,
  nationalDex: number,
  formIndex: number
): PokedexStatus | undefined {
  if (!(nationalDex in pokedex.byDexNumber)) return undefined
  return pokedex.byDexNumber[nationalDex].formes[formIndex]
}

export const StatusIndices: Record<PokedexStatus, number> = {
  Seen: 0,
  Caught: 1,
  ShinyCaught: 2,
}

export function getPokedexSummary(species: SpeciesMetadata, form: FormeMetadata) {
  const types = form.type2 ? `${form.type1}- and ${form.type2}-type` : `${form.type1}-type`
  const name = form.formIndex === 0 ? species.name : form.formeName
  const formeType =
    form.formIndex === 0 ? getBaseFormeDescriptor(species) : form.isMega ? 'Mega Evolution' : 'form'
  let text = `${name} is a ${types} ${formeType} introduced in Generation ${form.introducedGen}.`

  if (form.formeName === 'Basculin-White-Striped') {
    text += ` It is sometimes considered a regional forme from the ${form.regional} region.`
  } else if (form.regional) {
    text += ` It is a regional forme from the ${form.regional} region.`
  }

  if (form.isBattleOnly) {
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
