import { PokemonData } from 'pokemon-species-data'
import { RadicalRedToNationalDexMap } from '../src/types/SAVTypes/radicalred/conversion/RadicalRedSpeciesMap'
import { TransferRestrictions } from '../src/types/TransferRestrictions'

const RR_TRANSFER_RESTRICTIONS: TransferRestrictions = {
  excludedForms: {},
}

const supportedFormsMap: Record<number, Set<number>> = {}

for (const [key, mapEntry] of Object.entries(RadicalRedToNationalDexMap)) {
  if (!mapEntry || !mapEntry.NationalDexIndex) continue

  const dexNum = mapEntry.NationalDexIndex
  const formIndex = mapEntry.FormIndex

  if (!supportedFormsMap[dexNum]) {
    supportedFormsMap[dexNum] = new Set()
  }
  supportedFormsMap[dexNum].add(formIndex)
}

for (const [key, mapEntry] of Object.entries(RadicalRedToNationalDexMap)) {
  if (!mapEntry || !mapEntry.NationalDexIndex) continue

  const dexNum = mapEntry.NationalDexIndex

  const dbEntry = PokemonData[dexNum]

  if (dbEntry) {
    const allForms = dbEntry.formes.map((forme) => forme.formeNumber)

    const supportedForms = supportedFormsMap[dexNum] || new Set()
    const unsupportedForms = allForms.filter((formeNumber) => !supportedForms.has(formeNumber))

    if (unsupportedForms.length > 0) {
      // Not necessary but TS was giving me a warning.
      if (!RR_TRANSFER_RESTRICTIONS.excludedForms) {
        RR_TRANSFER_RESTRICTIONS.excludedForms = {}
      }
      RR_TRANSFER_RESTRICTIONS.excludedForms[dexNum] = unsupportedForms
    }
  }
}

console.log(RR_TRANSFER_RESTRICTIONS)
