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
    pokedex.byDexNumber[species.nationalDex].forms
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
  return pokedex.byDexNumber[nationalDex].forms[formIndex]
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
    form.formIndex === 0 ? getBaseFormDescriptor(species) : form.isMega ? 'Mega Evolution' : 'form'
  let text = `${name} is a ${types} ${formeType} introduced in Generation ${form.introducedGen}.`

  if (form.formeName === 'Basculin-White-Striped') {
    text += ` It is sometimes considered a regional form from the ${form.regional} region.`
  } else if (form.regional) {
    text += ` It is a regional form from the ${form.regional} region.`
  }

  if (form.isBattleOnly) {
    text += ` This form can only be seen in battle.`
  }

  return text
}

function getBaseFormDescriptor(species: SpeciesMetadata) {
  const baseForm = species.forms[0]

  if (baseForm.isMythical) {
    return 'Mythical Pokémon'
  }
  if (baseForm.isRestrictedLegend) {
    return 'restricted Legendary Pokémon'
  }
  if (baseForm.isUltraBeast) {
    return 'Ultra Beast'
  }
  if (baseForm.isSubLegend) {
    return 'Legendary Pokémon'
  }
  if (baseForm.isParadox) {
    return 'Paradox Pokémon'
  }

  return 'Pokémon'
}
