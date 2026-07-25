import { RadicalRedToNationalDexMap } from '@openhome-core/SAVTypes/radicalred/conversion/RadicalRedSpeciesMap'
import { PokemonData } from 'pokemon-species-data'
import { TransferRestrictions } from '../../src/types/TransferRestrictions'

const RR_TRANSFER_RESTRICTIONS: TransferRestrictions = {
  excludedForms: {},
}

const supportedFormsMap: Record<number, Set<number>> = {}

for (const [key, mapEntry] of Object.entries(RadicalRedToNationalDexMap)) {
  if (!mapEntry || !mapEntry.NationalDexIndex) continue

  const nationalDex = mapEntry.NationalDexIndex
  const formIndex = mapEntry.FormIndex

  if (!supportedFormsMap[nationalDex]) {
    supportedFormsMap[nationalDex] = new Set()
  }
  supportedFormsMap[nationalDex].add(formIndex)
}

for (const [key, mapEntry] of Object.entries(RadicalRedToNationalDexMap)) {
  if (!mapEntry || !mapEntry.NationalDexIndex) continue

  const nationalDex = mapEntry.NationalDexIndex

  const dbEntry = PokemonData[nationalDex]

  if (dbEntry) {
    const allForms = dbEntry.forms.map((forme) => forme.formeNumber)

    const supportedForms = supportedFormsMap[nationalDex] || new Set()
    const unsupportedForms = allForms.filter((formeNumber) => !supportedForms.has(formeNumber))

    if (unsupportedForms.length > 0) {
      // Not necessary but TS was giving me a warning.
      if (!RR_TRANSFER_RESTRICTIONS.excludedForms) {
        RR_TRANSFER_RESTRICTIONS.excludedForms = {}
      }
      RR_TRANSFER_RESTRICTIONS.excludedForms[nationalDex] = unsupportedForms
    }
  }
}
