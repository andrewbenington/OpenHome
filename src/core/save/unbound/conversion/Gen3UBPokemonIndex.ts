import { ExtraFormIndex } from '@pkm-rs/pkg'
import {
  ExtraFormToUnboundMap,
  NationalDexToUnboundMap,
} from '../../unbound/conversion/UnboundSpeciesMap'

export function toGen3UBPokemonIndex(
  nationalDexNumber: number,
  formIndex: number,
  extraFormIndex?: ExtraFormIndex
): number {
  if (extraFormIndex !== undefined) {
    const unboundIndex = ExtraFormToUnboundMap.get(extraFormIndex)
    if (unboundIndex !== undefined) {
      return unboundIndex
    }
  }

  const key = `${nationalDexNumber}_${formIndex}`
  const unboundIndex = parseInt(NationalDexToUnboundMap[key])

  if (unboundIndex !== undefined) {
    return unboundIndex
  } else {
    throw new Error(
      `National Dex number ${nationalDexNumber} with form index ${formIndex} not found.`
    )
  }
}
