import React from 'react'
import { Box, PokemonData } from '../lib/types'

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
                <div className="pokemon-sprite">
                  #{pokemon.dexNum}
                </div>
                <div className="pokemon-level">Lv.{pokemon.level}</div>
                <div style={{ fontSize: '9px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', textAlign: 'center' }}>
                  {pokemon.nickname}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '20px', opacity: 0.3 }}>—</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
