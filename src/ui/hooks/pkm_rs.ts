import { all_species_data } from '@pkm-rs/pkg/pkm_rs'
import { useMemo } from 'react'

export function useSpeciesData() {
  return useMemo(() => all_species_data(), [])
}
