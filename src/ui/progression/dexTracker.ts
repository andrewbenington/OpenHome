/**
 * Regional Dex Definitions and Utilities
 * Defines which species belong to each region's pokedex
 */

import { rangeInclusive } from '@openhome-core/util/functional'

export type RegionId =
  | 'kanto'
  | 'johto'
  | 'hoenn'
  | 'sinnoh'
  | 'unova'
  | 'kalos'
  | 'alola'
  | 'galar'
  | 'hisui'
  | 'paldea'

export interface RegionDexInfo {
  id: RegionId
  name: string
  totalSpecies: number
  speciesList: number[]
}

// Regional Dex species lists (National Dex numbers)
// Based on official regional pokedex listings

const KANTO_SPECIES = rangeInclusive(1, 151)

const JOHTO_SPECIES = rangeInclusive(152, 251)

const HOENN_SPECIES = rangeInclusive(252, 386)

const SINNOH_SPECIES = rangeInclusive(387, 493)

const UNOVA_SPECIES = rangeInclusive(494, 649)

const KALOS_SPECIES = rangeInclusive(650, 721)

const ALOLA_SPECIES = rangeInclusive(722, 809)

const GALAR_SPECIES = rangeInclusive(810, 898)

// Hisui only adds 7 new species to Gen 8
const HISUI_SPECIES = rangeInclusive(899, 905) // 899-905 (Wyrdeer through Enamorus)

// Paldea is Gen 9 species only
const PALDEA_SPECIES = rangeInclusive(906, 1025) // 906-1025

export const REGION_DEX_DATA: RegionDexInfo[] = [
  {
    id: 'kanto',
    name: 'Kanto',
    totalSpecies: KANTO_SPECIES.length,
    speciesList: KANTO_SPECIES,
  },
  {
    id: 'johto',
    name: 'Johto',
    totalSpecies: JOHTO_SPECIES.length,
    speciesList: JOHTO_SPECIES,
  },
  {
    id: 'hoenn',
    name: 'Hoenn',
    totalSpecies: HOENN_SPECIES.length,
    speciesList: HOENN_SPECIES,
  },
  {
    id: 'sinnoh',
    name: 'Sinnoh',
    totalSpecies: SINNOH_SPECIES.length,
    speciesList: SINNOH_SPECIES,
  },
  {
    id: 'unova',
    name: 'Unova',
    totalSpecies: UNOVA_SPECIES.length,
    speciesList: UNOVA_SPECIES,
  },
  {
    id: 'kalos',
    name: 'Kalos',
    totalSpecies: KALOS_SPECIES.length,
    speciesList: KALOS_SPECIES,
  },
  {
    id: 'alola',
    name: 'Alola',
    totalSpecies: ALOLA_SPECIES.length,
    speciesList: ALOLA_SPECIES,
  },
  {
    id: 'galar',
    name: 'Galar',
    totalSpecies: GALAR_SPECIES.length,
    speciesList: GALAR_SPECIES,
  },
  {
    id: 'hisui',
    name: 'Hisui',
    totalSpecies: HISUI_SPECIES.length,
    speciesList: HISUI_SPECIES,
  },
  {
    id: 'paldea',
    name: 'Paldea',
    totalSpecies: PALDEA_SPECIES.length,
    speciesList: PALDEA_SPECIES,
  },
]

/**
 * National Dex milestone thresholds
 */
export const NATIONAL_DEX_THRESHOLDS = {
  phase_1: 256, // 25% of 1025
  phase_2: 512, // 50% of 1025
  phase_3: 768, // 75% of 1025
  complete: 1025, // 100%
}

/**
 * Get national dex completion percentage
 */
export function getNationalDexCompletion(speciesPresent: Set<number>): number {
  return Math.round((speciesPresent.size / 1025) * 100)
}

/**
 * Check if national dex threshold is met
 */
export function isNationalDexThresholdMet(speciesPresent: Set<number>, threshold: number): boolean {
  return speciesPresent.size >= threshold
}

/**
 * Get regional dex info by region ID
 */
export function getRegionDex(regionId: RegionId): RegionDexInfo {
  const dex = REGION_DEX_DATA.find((d) => d.id === regionId)
  if (!dex) throw new Error(`Unknown region: ${regionId}`)
  return dex
}

/**
 * Calculate regional dex completion percentage
 * @param speciesPresent Set of species numbers that are present
 * @param regionId The region to calculate for
 * @returns Percentage completion (0-100)
 */
export function calculateRegionalDexCompletion(
  speciesPresent: Set<number>,
  regionId: RegionId
): number {
  const dex = getRegionDex(regionId)
  const uniqueInRegion = dex.speciesList.filter((num) => speciesPresent.has(num)).length
  return Math.round((uniqueInRegion / dex.totalSpecies) * 100)
}

/**
 * Get count of species completed in a region
 */
export function getRegionalDexCount(speciesPresent: Set<number>, regionId: RegionId): number {
  const dex = getRegionDex(regionId)
  return dex.speciesList.filter((num) => speciesPresent.has(num)).length
}

/**
 * Check if all species in a regional dex are present
 */
export function isRegionalDexComplete(speciesPresent: Set<number>, regionId: RegionId): boolean {
  const dex = getRegionDex(regionId)
  return dex.speciesList.every((num) => speciesPresent.has(num))
}

/**
 * Get all regional dexes that are not yet complete, ordered by completion percentage
 */
export function getIncompleteRegions(speciesPresent: Set<number>): Array<{
  region: RegionDexInfo
  completion: number
  remaining: number
}> {
  return REGION_DEX_DATA.filter((dex) => !isRegionalDexComplete(speciesPresent, dex.id))
    .map((dex) => {
      const count = getRegionalDexCount(speciesPresent, dex.id)
      return {
        region: dex,
        completion: Math.round((count / dex.totalSpecies) * 100),
        remaining: dex.totalSpecies - count,
      }
    })
    .sort((a, b) => b.completion - a.completion)
}
