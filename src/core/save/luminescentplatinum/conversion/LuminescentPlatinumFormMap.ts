/**
 * Custom form definitions for Luminescent Platinum.
 * Data derived from:
 * https://github.com/TalonSabre/PKLumiHex
 * (see FormConverter.cs GetFormsLumi and GetFormsPikachu).
 */

export type CustomFormInfo = {
  name: string
  fallbackForm: number // Standard form used by OpenHome for rendering compatibility
}

/**
 * Luminescent Platinum introduces additional forms that do not exist
 * in the official games. These forms are represented by unique formIndex
 *
 * These entries map:
 *   Pokédex number → form index → custom form metadata
 */
export const LUMI_CUSTOM_FORMS: Record<number, Record<number, CustomFormInfo>> = {
  // Venusaur (Dex 3)
  3: {
    1: { name: 'Mega', fallbackForm: 0 },
    2: { name: 'Gigantamax', fallbackForm: 0 },
    3: { name: 'Clone', fallbackForm: 0 },
  },

  // Charizard (Dex 6)
  6: {
    1: { name: 'Mega X', fallbackForm: 0 },
    2: { name: 'Mega Y', fallbackForm: 0 },
    3: { name: 'Gigantamax', fallbackForm: 0 },
    4: { name: 'Clone', fallbackForm: 0 },
  },

  // Blastoise (Dex 9)
  9: {
    1: { name: 'Mega', fallbackForm: 0 },
    2: { name: 'Gigantamax', fallbackForm: 0 },
    3: { name: 'Clone', fallbackForm: 0 },
  },

  // Pikachu (Dex 25)
  25: {
    15: { name: 'Starter', fallbackForm: 0 },
    16: { name: 'Gigantamax', fallbackForm: 0 },
    17: { name: 'Clone', fallbackForm: 0 },
  },

  // Gengar (Dex 94)
  94: {
    1: { name: 'Mega', fallbackForm: 0 },
    2: { name: 'Gigantamax', fallbackForm: 0 },
    3: { name: 'Stitched', fallbackForm: 0 },
  },

  // Onix (Dex 95)
  95: {
    1: { name: 'Crystal', fallbackForm: 0 },
  },

  // Eevee (Dex 133)
  133: {
    1: { name: 'Starter', fallbackForm: 0 },
    2: { name: 'Gigantamax', fallbackForm: 0 },
    3: { name: 'Bandana', fallbackForm: 0 },
  },

  // Mewtwo (Dex 150)
  150: {
    1: { name: 'Mega X', fallbackForm: 0 },
    2: { name: 'Mega Y', fallbackForm: 0 },
    3: { name: 'Armor MK2', fallbackForm: 0 },
    4: { name: 'Armor MK1', fallbackForm: 0 },
  },
}

/**
 * Returns custom form metadata for a Luminescent Platinum Pokémon.
 */
export function getLumiCustomForm(dexNum: number, formeNum: number): CustomFormInfo | undefined {
  return LUMI_CUSTOM_FORMS[dexNum]?.[formeNum]
}
