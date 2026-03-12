/**
 * Species and form mapping used for Luminescent Platinum.
 * Data and behavior derived from:
 * https://github.com/TalonSabre/PKLumiHex
 * (see Species.cs and FormConverter.cs).
 */

// Highest supported species index in Luminescent Platinum (up to Pecharunt)
export const LUMI_MAX_SPECIES_ID = 1025

/**
 * Converts a species index from a Luminescent Platinum save
 * into the National Dex index used internally by OpenHome.
 */
export function fromLumiPokemonIndex(gameIndex: number): number {
  if (gameIndex === 0 || gameIndex > LUMI_MAX_SPECIES_ID) {
    return 0 // None / Egg
  }

  // Species IDs match the National Dex directly
  return gameIndex
}

/**
 * Converts a National Dex index back into the Luminescent Platinum
 * species index used in the save file.
 */
export function toLumiPokemonIndex(nationalDexNumber: number): number {
  if (nationalDexNumber === 0 || nationalDexNumber > LUMI_MAX_SPECIES_ID) {
    return 0
  }

  // Species IDs match the National Dex directly
  return nationalDexNumber
}
