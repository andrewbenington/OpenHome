import React, { useState } from 'react'
import { PokemonData, Gender } from '../lib/types'

interface PokemonDetailModalProps {
  pokemon: PokemonData
  boxIndex: number
  slotIndex: number
  onClose: () => void
  onSave: (pokemon: PokemonData, boxIndex: number, slotIndex: number) => void
}

const NATURES = [
  'Hardy', 'Lonely', 'Brave', 'Adamant', 'Naughty',
  'Bold', 'Docile', 'Relaxed', 'Impish', 'Lax',
  'Timid', 'Hasty', 'Serious', 'Jolly', 'Naive',
  'Modest', 'Mild', 'Quiet', 'Bashful', 'Rash',
  'Calm', 'Gentle', 'Sassy', 'Careful', 'Quirky'
]

export const PokemonDetailModal: React.FC<PokemonDetailModalProps> = ({
  pokemon: initialPokemon,
  boxIndex,
  slotIndex,
  onClose,
  onSave,
}) => {
  const [pokemon, setPokemon] = useState(initialPokemon)
  const [activeTab, setActiveTab] = useState<'stats' | 'moves' | 'other'>('stats')

  const updatePokemon = (updates: Partial<PokemonData>) => {
    setPokemon(prev => ({ ...prev, ...updates }))
  }

  const handleSave = () => {
    onSave(pokemon, boxIndex, slotIndex)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-2">
          <h2 className="wireframe-title" style={{ margin: 0 }}>
            {pokemon.nickname} #{pokemon.dexNum}
          </h2>
          <button className="wireframe-button" onClick={onClose}>
            CLOSE
          </button>
        </div>

        <div className="wireframe-box">
          <div className="form-row">
            <div>
              <strong>OT:</strong> {pokemon.trainerName}
            </div>
            <div>
              <strong>ID:</strong> {pokemon.trainerID.toString().padStart(5, '0')}
            </div>
          </div>
          <div className="form-row" style={{ marginTop: '8px' }}>
            <div>
              <strong>Level:</strong> {pokemon.level}
            </div>
            <div>
              <strong>Gender:</strong> {pokemon.gender === Gender.Male ? '♂' : pokemon.gender === Gender.Female ? '♀' : '—'}
            </div>
          </div>
          {pokemon.isFakemon && (
            <div style={{ marginTop: '8px', color: '#cc0000', fontWeight: 'bold' }}>
              ⚠ FAKEMON - Cannot be transferred
            </div>
          )}
        </div>

        <div className="tabs">
          <div
            className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            STATS
          </div>
          <div
            className={`tab ${activeTab === 'moves' ? 'active' : ''}`}
            onClick={() => setActiveTab('moves')}
          >
            MOVES
          </div>
          <div
            className={`tab ${activeTab === 'other' ? 'active' : ''}`}
            onClick={() => setActiveTab('other')}
          >
            OTHER
          </div>
        </div>

        {activeTab === 'stats' && (
          <div>
            <h3 className="wireframe-subtitle">Base Stats</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-label">HP</div>
                <div className="stat-value">{pokemon.hp}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">ATTACK</div>
                <div className="stat-value">{pokemon.attack}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">DEFENSE</div>
                <div className="stat-value">{pokemon.defense}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">SP. ATK</div>
                <div className="stat-value">{pokemon.spAtk}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">SP. DEF</div>
                <div className="stat-value">{pokemon.spDef}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">SPEED</div>
                <div className="stat-value">{pokemon.speed}</div>
              </div>
            </div>

            <h3 className="wireframe-subtitle">IVs (Individual Values)</h3>
            <div className="stats-grid">
              <div className="form-group">
                <label className="form-label">HP IV</label>
                <input
                  type="number"
                  className="wireframe-input"
                  value={pokemon.hpIV}
                  onChange={(e) => updatePokemon({ hpIV: Math.min(31, Math.max(0, parseInt(e.target.value) || 0)) })}
                  min="0"
                  max="31"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Attack IV</label>
                <input
                  type="number"
                  className="wireframe-input"
                  value={pokemon.attackIV}
                  onChange={(e) => updatePokemon({ attackIV: Math.min(31, Math.max(0, parseInt(e.target.value) || 0)) })}
                  min="0"
                  max="31"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Defense IV</label>
                <input
                  type="number"
                  className="wireframe-input"
                  value={pokemon.defenseIV}
                  onChange={(e) => updatePokemon({ defenseIV: Math.min(31, Math.max(0, parseInt(e.target.value) || 0)) })}
                  min="0"
                  max="31"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Sp. Atk IV</label>
                <input
                  type="number"
                  className="wireframe-input"
                  value={pokemon.spAtkIV}
                  onChange={(e) => updatePokemon({ spAtkIV: Math.min(31, Math.max(0, parseInt(e.target.value) || 0)) })}
                  min="0"
                  max="31"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Sp. Def IV</label>
                <input
                  type="number"
                  className="wireframe-input"
                  value={pokemon.spDefIV}
                  onChange={(e) => updatePokemon({ spDefIV: Math.min(31, Math.max(0, parseInt(e.target.value) || 0)) })}
                  min="0"
                  max="31"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Speed IV</label>
                <input
                  type="number"
                  className="wireframe-input"
                  value={pokemon.speedIV}
                  onChange={(e) => updatePokemon({ speedIV: Math.min(31, Math.max(0, parseInt(e.target.value) || 0)) })}
                  min="0"
                  max="31"
                />
              </div>
            </div>

            <h3 className="wireframe-subtitle">EVs (Effort Values)</h3>
            <div className="stats-grid">
              <div className="form-group">
                <label className="form-label">HP EV</label>
                <input
                  type="number"
                  className="wireframe-input"
                  value={pokemon.hpEV}
                  onChange={(e) => updatePokemon({ hpEV: Math.min(255, Math.max(0, parseInt(e.target.value) || 0)) })}
                  min="0"
                  max="255"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Attack EV</label>
                <input
                  type="number"
                  className="wireframe-input"
                  value={pokemon.attackEV}
                  onChange={(e) => updatePokemon({ attackEV: Math.min(255, Math.max(0, parseInt(e.target.value) || 0)) })}
                  min="0"
                  max="255"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Defense EV</label>
                <input
                  type="number"
                  className="wireframe-input"
                  value={pokemon.defenseEV}
                  onChange={(e) => updatePokemon({ defenseEV: Math.min(255, Math.max(0, parseInt(e.target.value) || 0)) })}
                  min="0"
                  max="255"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Sp. Atk EV</label>
                <input
                  type="number"
                  className="wireframe-input"
                  value={pokemon.spAtkEV}
                  onChange={(e) => updatePokemon({ spAtkEV: Math.min(255, Math.max(0, parseInt(e.target.value) || 0)) })}
                  min="0"
                  max="255"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Sp. Def EV</label>
                <input
                  type="number"
                  className="wireframe-input"
                  value={pokemon.spDefEV}
                  onChange={(e) => updatePokemon({ spDefEV: Math.min(255, Math.max(0, parseInt(e.target.value) || 0)) })}
                  min="0"
                  max="255"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Speed EV</label>
                <input
                  type="number"
                  className="wireframe-input"
                  value={pokemon.speedEV}
                  onChange={(e) => updatePokemon({ speedEV: Math.min(255, Math.max(0, parseInt(e.target.value) || 0)) })}
                  min="0"
                  max="255"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'moves' && (
          <div>
            <h3 className="wireframe-subtitle">Moves</h3>
            <div className="form-group">
              <label className="form-label">Move 1 (ID: {pokemon.moves[0]})</label>
              <input
                type="number"
                className="wireframe-input"
                value={pokemon.moves[0]}
                onChange={(e) => updatePokemon({ moves: [parseInt(e.target.value) || 0, pokemon.moves[1], pokemon.moves[2], pokemon.moves[3]] })}
                min="0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Move 2 (ID: {pokemon.moves[1]})</label>
              <input
                type="number"
                className="wireframe-input"
                value={pokemon.moves[1]}
                onChange={(e) => updatePokemon({ moves: [pokemon.moves[0], parseInt(e.target.value) || 0, pokemon.moves[2], pokemon.moves[3]] })}
                min="0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Move 3 (ID: {pokemon.moves[2]})</label>
              <input
                type="number"
                className="wireframe-input"
                value={pokemon.moves[2]}
                onChange={(e) => updatePokemon({ moves: [pokemon.moves[0], pokemon.moves[1], parseInt(e.target.value) || 0, pokemon.moves[3]] })}
                min="0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Move 4 (ID: {pokemon.moves[3]})</label>
              <input
                type="number"
                className="wireframe-input"
                value={pokemon.moves[3]}
                onChange={(e) => updatePokemon({ moves: [pokemon.moves[0], pokemon.moves[1], pokemon.moves[2], parseInt(e.target.value) || 0] })}
                min="0"
              />
            </div>
            <p style={{ fontSize: '12px', marginTop: '8px' }}>
              Note: Move names are shown as IDs. Refer to Radical Red move list for IDs.
            </p>
          </div>
        )}

        {activeTab === 'other' && (
          <div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nickname</label>
                <input
                  type="text"
                  className="wireframe-input"
                  value={pokemon.nickname}
                  onChange={(e) => updatePokemon({ nickname: e.target.value.slice(0, 10) })}
                  maxLength={10}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Friendship</label>
                <input
                  type="number"
                  className="wireframe-input"
                  value={pokemon.friendship}
                  onChange={(e) => updatePokemon({ friendship: Math.min(255, Math.max(0, parseInt(e.target.value) || 0)) })}
                  min="0"
                  max="255"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Experience</label>
                <input
                  type="number"
                  className="wireframe-input"
                  value={pokemon.exp}
                  onChange={(e) => updatePokemon({ exp: Math.max(0, parseInt(e.target.value) || 0) })}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Nature</label>
                <select
                  className="wireframe-input"
                  value={pokemon.nature}
                  onChange={(e) => updatePokemon({ nature: parseInt(e.target.value) })}
                >
                  {NATURES.map((nature, index) => (
                    <option key={index} value={index}>
                      {nature}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Ability Slot</label>
                <select
                  className="wireframe-input"
                  value={pokemon.ability}
                  onChange={(e) => updatePokemon({ ability: parseInt(e.target.value) })}
                >
                  <option value={0}>Ability 1</option>
                  <option value={1}>Ability 2</option>
                  <option value={2}>Hidden Ability</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Ball Type</label>
                <input
                  type="number"
                  className="wireframe-input"
                  value={pokemon.ball}
                  onChange={(e) => updatePokemon({ ball: Math.max(0, parseInt(e.target.value) || 0) })}
                  min="0"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Held Item (ID)</label>
              <input
                type="number"
                className="wireframe-input"
                value={pokemon.heldItem}
                onChange={(e) => updatePokemon({ heldItem: Math.max(0, parseInt(e.target.value) || 0) })}
                min="0"
              />
            </div>
            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={pokemon.isShiny}
                  onChange={(e) => updatePokemon({ isShiny: e.target.checked })}
                />
                <span>Shiny (Note: May not work correctly)</span>
              </label>
            </div>
          </div>
        )}

        <div className="flex gap-2" style={{ marginTop: '24px' }}>
          <button className="wireframe-button" onClick={handleSave} style={{ flex: 1 }}>
            SAVE CHANGES
          </button>
          <button className="wireframe-button" onClick={onClose} style={{ flex: 1 }}>
            CANCEL
          </button>
        </div>
      </div>
    </div>
  )
}
