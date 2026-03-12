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
    1: { name: 'Mega Venusaur', fallbackForm: 1 },
    2: { name: 'Gigantamax Venusaur', fallbackForm: 0 },
    3: { name: 'Clone Venusaur', fallbackForm: 0 },
  },

  // Charizard (Dex 6)
  6: {
    1: { name: 'Mega Charizard X', fallbackForm: 1 },
    2: { name: 'Mega Charizard Y', fallbackForm: 2 },
    3: { name: 'Gigantamax Charizard', fallbackForm: 0 },
    4: { name: 'Clone Charizard', fallbackForm: 0 },
  },

  // Blastoise (Dex 9)
  9: {
    1: { name: 'Mega Blastoise', fallbackForm: 1 },
    2: { name: 'Gigantamax Blastoise', fallbackForm: 0 },
    3: { name: 'Clone Blastoise', fallbackForm: 0 },
  },

  // Pikachu (Dex 25)
  25: {
    15: { name: 'Starter Pikachu', fallbackForm: 8 },
    16: { name: 'Gigantamax Pikachu', fallbackForm: 0 },
    17: { name: 'Clone Pikachu', fallbackForm: 0 },
  },

  // Gengar (Dex 94)
  94: {
    1: { name: 'Mega Gengar', fallbackForm: 1 },
    2: { name: 'Gigantamax Gengar', fallbackForm: 0 },
    3: { name: 'Stitched Gengar', fallbackForm: 0 },
  },

  // Onix (Dex 95)
  95: {
    1: { name: 'Crystal Onix', fallbackForm: 0 },
  },

  // Eevee (Dex 133)
  133: {
    1: { name: 'Starter Eevee', fallbackForm: 1 },
    2: { name: 'Gigantamax Eevee', fallbackForm: 0 },
    3: { name: 'Bandana Eevee', fallbackForm: 0 },
  },

  // Mewtwo (Dex 150)
  150: {
    1: { name: 'Mega Mewtwo X', fallbackForm: 1 },
    2: { name: 'Mega Mewtwo Y', fallbackForm: 2 },
    3: { name: 'Armored Mewtwo MK2', fallbackForm: 0 },
    4: { name: 'Armored Mewtwo MK1', fallbackForm: 0 },
  },
}

/**
 * Returns custom form metadata for a Luminescent Platinum Pokémon.
 */
export function getLumiCustomForm(dexNum: number, formeNum: number): CustomFormInfo | undefined {
  return LUMI_CUSTOM_FORMS[dexNum]?.[formeNum]
}
