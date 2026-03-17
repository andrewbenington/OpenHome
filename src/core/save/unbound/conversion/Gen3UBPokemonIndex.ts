import { ExtraFormIndex } from '@pkm-rs/pkg'
import { CfruSpeciesAndForm } from '../../cfru/conversion/util'
import {
  ExtraFormToUnboundMap,
  NationalDexToUnboundMap,
  UnboundToNationalDexMap,
} from '../../unbound/conversion/UnboundSpeciesMap'

export function fromGen3UBPokemonIndex(unboundIndex: number): CfruSpeciesAndForm | null {
  const entry = UnboundToNationalDexMap[String(unboundIndex)]

  if (entry) {
    return {
      nationalDex: entry.nationalDex,
      formIndex: entry.formIndex,
    }
  } else {
    console.warn(`Unbound index ${unboundIndex} not found.`)
    return {
      nationalDex: 0,
      formIndex: 0,
    }
    // throw new Error(`Unbound index ${unboundIndex} not found.`)
  }
}

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
