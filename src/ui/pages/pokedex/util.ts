import { FormEntry } from '@openhome-core/tauri/spectaCommands'
import { Option } from '@openhome-core/util/functional'
import { Pokedex, PokedexLevel } from '@openhome-ui/util/pokedex'
import { ExtraFormMetadata, FormMetadata, Language, Lookup, SpeciesMetadata } from '@pkm-rs/pkg'

export function getHighestFormStatus(
  pokedex: Pokedex,
  species: SpeciesMetadata
): [number, PokedexLevel | undefined] {
  if (!(species.nationalDex in pokedex.byDexNumber)) return [0, undefined]

  let maxStatusForme = 0
  let maxStatus: PokedexLevel = 'Seen'

  for (const [formIndex, dexEntry] of Object.entries(
    pokedex.byDexNumber[species.nationalDex]?.forms ?? {}
  )) {
    if (dexEntry && StatusIndices[dexEntry.level] > StatusIndices[maxStatus]) {
      maxStatusForme = parseInt(formIndex)
      maxStatus = dexEntry.level
    }
  }

  return [maxStatusForme, maxStatus]
}

export function getFormPokedexData(
  pokedex: Pokedex,
  nationalDex: number,
  formIndex: number
): Option<FormEntry> {
  if (!(nationalDex in pokedex.byDexNumber)) return undefined
  return pokedex.byDexNumber[nationalDex]?.forms[formIndex]
}

export const StatusIndices: Record<PokedexLevel, number> = {
  Seen: 0,
  Caught: 1,
  ShinyCaught: 2,
}

export function getPokedexSummary(
  species: SpeciesMetadata,
  form: FormMetadata | ExtraFormMetadata
) {
  const isExtraForm = isExtraFormMetadata(form)
  const types = form.type2 ? `${form.type1}- and ${form.type2}-type` : `${form.type1}-type`

  const name =
    form.formIndex === 0 && !isExtraForm
      ? Lookup.speciesName(species.nationalDex, Language.English)
      : form.formeName
  const formeType =
    form.formIndex === 0 ? getBaseFormDescriptor(species) : form.isMega ? 'Mega Evolution' : 'form'
  let text = isExtraForm
    ? `${name} is a ${types} extra form.`
    : `${name} is a ${types} ${formeType} introduced in Generation ${form.introducedGen}.`

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

export function isExtraFormMetadata(
  metadata: FormMetadata | ExtraFormMetadata
): metadata is ExtraFormMetadata {
  return 'extraFormIndex' in metadata
}
