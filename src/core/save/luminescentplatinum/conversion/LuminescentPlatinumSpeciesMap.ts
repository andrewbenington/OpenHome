/**
 * Species and form mapping used for Luminescent Platinum.
 * Data and behavior derived from:
 * https://github.com/TalonSabre/PKLumiHex
 * (see Species.cs and FormConverter.cs).
 */

// Highest supported species index in Luminescent Platinum (up to Pecharunt)
export const LUMI_MAX_SPECIES_ID = 1025

// Luminescent Platinum follows National Dex ordering, so no species remapping is required.
// These empty maps exist only to satisfy the PB8LUMI plugin interface.
export const LumiToNationalDexMap: Record<number, number> = {}
export const NationalDexToLumiMap: Record<number, number> = {}

/**
 * Converts a species index from a Luminescent Platinum save
 * into the National Dex index used internally by OpenHome.
 */
export function fromLumiPokemonIndex(
  gameIndex: number,
  _map?: Record<number, number>,
  _gameName?: string
): number {
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
export function toLumiPokemonIndex(
  nationalDexNumber: number,
  _formIndex: number,
  _map?: Record<number, number>
): number {
  if (nationalDexNumber === 0 || nationalDexNumber > LUMI_MAX_SPECIES_ID) {
    return 0
  }

  // Species IDs match the National Dex directly
  return nationalDexNumber
}

/**
 * Custom Luminescent Platinum forms.
 *
 * These constants correspond to the formIndex values used in the PB8 save
 * structure for regional variants and special forms.
 *
 * Source reference:
 * https://github.com/TalonSabre/PKLumiHex (FormConverter.cs)
 */
export const LUMI_CUSTOM_FORMS = {
  VENUSAUR: {
    NORMAL: 0,
    MEGA: 1,
    GIGANTAMAX: 2,
    CLONE: 3,
  },
  CHARIZARD: {
    NORMAL: 0,
    MEGA_X: 1,
    MEGA_Y: 2,
    GIGANTAMAX: 3,
    CLONE: 4,
  },
  BLASTOISE: {
    NORMAL: 0,
    MEGA: 1,
    GIGANTAMAX: 2,
    CLONE: 3,
  },
  GENGAR: {
    NORMAL: 0,
    MEGA: 1,
    GIGANTAMAX: 2,
    STITCHED: 3,
  },
  ONIX: {
    NORMAL: 0,
    CRYSTAL: 1,
  },
  EEVEE: {
    NORMAL: 0,
    STARTER: 1,
    GIGANTAMAX: 2,
    BANDANA: 3,
  },
  MEWTWO: {
    NORMAL: 0,
    MEGA_X: 1,
    MEGA_Y: 2,
    ARMOR_MK2: 3,
    ARMOR_MK1: 4,
  },
} as const
