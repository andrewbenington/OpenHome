import React from 'react'
import { Box, PokemonData } from '../lib/types'
import { getPokemonSpriteUrl, getFallbackSpriteUrl } from '../lib/spriteUtils'

interface BoxViewerProps {
  box: Box
  boxIndex: number
  onPokemonClick: (pokemon: PokemonData, boxIndex: number, slotIndex: number) => void
}

export const BoxViewer: React.FC<BoxViewerProps> = ({ box, boxIndex, onPokemonClick }) => {
  return (
    <div>
      <h3 className="wireframe-subtitle text-center">{box.name}</h3>
      <div className="box-grid">
        {box.pokemon.map((pokemon, slotIndex) => (
          <div
            key={slotIndex}
            className={`pokemon-slot ${!pokemon ? 'empty' : ''} ${pokemon?.isFakemon ? 'fakemon' : ''}`}
            onClick={() => pokemon && onPokemonClick(pokemon, boxIndex, slotIndex)}
            title={pokemon?.isFakemon ? 'Fakemon - Cannot be transferred' : ''}
          >
            {pokemon ? (
              <div className="pokemon-info-compact">
                <img
                  src={getPokemonSpriteUrl(
                    pokemon.dexNum,
                    pokemon.speciesName,
                    pokemon.isShiny,
                    'small'
                  )}
                  alt={pokemon.speciesName}
                  className={`pokemon-sprite ${pokemon.isShiny ? 'shiny' : ''}`}
                  title={`${pokemon.speciesName}${pokemon.isShiny ? ' (Shiny)' : ''}`}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    if (
                      target.src !==
                      getFallbackSpriteUrl(pokemon.dexNum, pokemon.speciesName, pokemon.isShiny)
                    ) {
                      target.src = getFallbackSpriteUrl(
                        pokemon.dexNum,
                        pokemon.speciesName,
                        pokemon.isShiny
                      )
                    }
                  }}
                />
                <div className="pokemon-level">Lv.{pokemon.level}</div>
                <div className="pokemon-name">{pokemon.nickname}</div>
              </div>
            ) : (
              <div className="empty-slot-placeholder">—</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
