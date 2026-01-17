/**
 * Utility functions for getting Pokemon sprite URLs
 */

/**
 * Converts a Pokemon species name to Pokemon Showdown format
 * @param speciesName - The Pokemon species name
 * @returns The formatted name for Pokemon Showdown URLs
 */
function formatPokemonName(speciesName: string): string {
  return speciesName
    .toLowerCase()
    .replace(/[♀]/g, '-f')
    .replace(/[♂]/g, '-m')
    .replace(/['\s.]/g, '')
    .replace(/:/g, '');
}

/**
 * Gets the sprite URL for a Pokemon using Pokemon Showdown sprites
 * @param _dexNum - National Pokedex number (reserved for future use)
 * @param speciesName - Pokemon species name
 * @param isShiny - Whether the Pokemon is shiny
 * @param size - Size variant ('small' for box view, 'large' for modal)
 * @returns The URL to the Pokemon sprite
 */
export function getPokemonSpriteUrl(
  _dexNum: number,
  speciesName: string,
  isShiny: boolean = false,
  size: 'small' | 'large' = 'small'
): string {
  const formattedName = formatPokemonName(speciesName);
  const baseUrl = 'https://play.pokemonshowdown.com/sprites';

  if (size === 'large') {
    // Use animated sprites for larger displays
    const folder = isShiny ? 'ani-shiny' : 'ani';
    return `${baseUrl}/${folder}/${formattedName}.gif`;
  }

  // Use gen5 sprites for small/box view (higher quality than default)
  const folder = isShiny ? 'gen5-shiny' : 'gen5';
  return `${baseUrl}/${folder}/${formattedName}.png`;
}

/**
 * Gets a fallback sprite URL for when the primary sprite fails to load
 * @param _dexNum - National Pokedex number (reserved for future use)
 * @param speciesName - Pokemon species name
 * @param isShiny - Whether to get shiny fallback sprite
 * @returns A fallback sprite URL
 */
export function getFallbackSpriteUrl(_dexNum: number, speciesName: string, isShiny: boolean = false): string {
  const formattedName = formatPokemonName(speciesName);
  // Use the appropriate sprite based on shiny status
  const folder = isShiny ? 'gen5-shiny' : 'gen5';
  return `https://play.pokemonshowdown.com/sprites/${folder}/${formattedName}.png`;
}
