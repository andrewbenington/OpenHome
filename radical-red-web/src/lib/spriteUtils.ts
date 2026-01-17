/**
 * Utility functions for getting Pokemon sprite URLs
 */

/**
 * Gets the sprite URL for a Pokemon
 * @param dexNum - National Pokedex number
 * @param isShiny - Whether the Pokemon is shiny
 * @param size - Size variant ('small' for box view, 'large' for modal)
 * @returns The URL to the Pokemon sprite
 */
export function getPokemonSpriteUrl(
  dexNum: number,
  isShiny: boolean = false,
  size: 'small' | 'large' = 'small'
): string {
  // Use PokeAPI sprites repository
  const baseUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

  if (size === 'large') {
    // Use official artwork for larger displays
    if (isShiny) {
      return `${baseUrl}/other/official-artwork/shiny/${dexNum}.png`;
    }
    return `${baseUrl}/other/official-artwork/${dexNum}.png`;
  }

  // Use standard sprites for small/box view
  if (isShiny) {
    return `${baseUrl}/shiny/${dexNum}.png`;
  }
  return `${baseUrl}/${dexNum}.png`;
}

/**
 * Gets a fallback sprite URL for when the primary sprite fails to load
 * @param dexNum - National Pokedex number
 * @returns A fallback sprite URL
 */
export function getFallbackSpriteUrl(dexNum: number): string {
  // Use the default (non-shiny) sprite as fallback
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dexNum}.png`;
}
