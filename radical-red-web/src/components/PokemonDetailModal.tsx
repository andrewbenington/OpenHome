import React, { useState, useMemo } from 'react'
import { AlertTriangle, Sparkles } from 'lucide-react'
import { PokemonData, Gender } from '../lib/types'
import { getPokemonSpriteUrl, getFallbackSpriteUrl } from '../lib/spriteUtils'
import { levelToExp } from '../lib/pokemonParser'
import speciesData from '../lib/species-data.json'
import movesData from '../lib/moves-data.json'

interface PokemonDetailModalProps {
  pokemon: PokemonData
  boxIndex: number
  slotIndex: number
  onClose: () => void
  onSave: (pokemon: PokemonData, boxIndex: number, slotIndex: number) => void
}

const NATURES = [
  'Hardy',
  'Lonely',
  'Brave',
  'Adamant',
  'Naughty',
  'Bold',
  'Docile',
  'Relaxed',
  'Impish',
  'Lax',
  'Timid',
  'Hasty',
  'Serious',
  'Jolly',
  'Naive',
  'Modest',
  'Mild',
  'Quiet',
  'Bashful',
  'Rash',
  'Calm',
  'Gentle',
  'Sassy',
  'Careful',
  'Quirky',
]

// Nature stat modifiers: [increasedStat, decreasedStat] or null for neutral
const NATURE_MODIFIERS: Array<{ increased: string | null; decreased: string | null }> = [
  { increased: null, decreased: null }, // Hardy
  { increased: 'Atk', decreased: 'Def' }, // Lonely
  { increased: 'Atk', decreased: 'Spe' }, // Brave
  { increased: 'Atk', decreased: 'SpA' }, // Adamant
  { increased: 'Atk', decreased: 'SpD' }, // Naughty
  { increased: 'Def', decreased: 'Atk' }, // Bold
  { increased: null, decreased: null }, // Docile
  { increased: 'Def', decreased: 'Spe' }, // Relaxed
  { increased: 'Def', decreased: 'SpA' }, // Impish
  { increased: 'Def', decreased: 'SpD' }, // Lax
  { increased: 'Spe', decreased: 'Atk' }, // Timid
  { increased: 'Spe', decreased: 'Def' }, // Hasty
  { increased: null, decreased: null }, // Serious
  { increased: 'Spe', decreased: 'SpA' }, // Jolly
  { increased: 'Spe', decreased: 'SpD' }, // Naive
  { increased: 'SpA', decreased: 'Atk' }, // Modest
  { increased: 'SpA', decreased: 'Def' }, // Mild
  { increased: 'SpA', decreased: 'Spe' }, // Quiet
  { increased: null, decreased: null }, // Bashful
  { increased: 'SpA', decreased: 'SpD' }, // Rash
  { increased: 'SpD', decreased: 'Atk' }, // Calm
  { increased: 'SpD', decreased: 'Def' }, // Gentle
  { increased: 'SpD', decreased: 'Spe' }, // Sassy
  { increased: 'SpD', decreased: 'SpA' }, // Careful
  { increased: null, decreased: null }, // Quirky
]

// Helper function to get nature modifier display text
const getNatureModifierText = (natureIndex: number): string => {
  const modifier = NATURE_MODIFIERS[natureIndex]
  if (!modifier.increased || !modifier.decreased) {
    return '(Neutral)'
  }
  return `(+${modifier.increased}, -${modifier.decreased})`
}

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
    setPokemon((prev) => ({ ...prev, ...updates }))
  }

  // Get species info including abilities and level up type
  const speciesInfo = useMemo(() => {
    const species = (speciesData as any)[pokemon.dexNum.toString()]
    if (!species || !species.formes || species.formes.length === 0) {
      return {
        ability1: null,
        ability2: null,
        abilityH: null,
        levelUpType: 'Medium Fast',
      }
    }
    // Use the forme that matches the pokemon's formNum
    const forme = species.formes[pokemon.formNum] || species.formes[0]
    return {
      ability1: forme.ability1 || null,
      ability2: forme.ability2 || null,
      abilityH: forme.abilityH || null,
      levelUpType: species.levelUpType || 'Medium Fast',
    }
  }, [pokemon.dexNum, pokemon.formNum])

  // Get abilities for the current Pokemon (for backward compatibility)
  const abilities = useMemo(
    () => ({
      ability1: speciesInfo.ability1,
      ability2: speciesInfo.ability2,
      abilityH: speciesInfo.abilityH,
    }),
    [speciesInfo]
  )

  // Handler for level changes - also updates EXP
  const handleLevelChange = (newLevel: number) => {
    const clampedLevel = Math.min(100, Math.max(1, newLevel))
    const newExp = levelToExp(clampedLevel, speciesInfo.levelUpType)
    updatePokemon({ level: clampedLevel, exp: newExp })
  }

  // Helper to create number input handlers that allow free typing
  const createNumberInputHandlers = (
    field: keyof PokemonData,
    min: number,
    max: number,
    defaultVal: number = min
  ) => ({
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value === '' ? defaultVal : parseInt(e.target.value)
      if (!isNaN(val)) {
        updatePokemon({ [field]: val } as Partial<PokemonData>)
      }
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value)
      if (isNaN(val) || val < min) {
        updatePokemon({ [field]: defaultVal } as Partial<PokemonData>)
      } else if (val > max) {
        updatePokemon({ [field]: max } as Partial<PokemonData>)
      }
    },
  })

  // Get all moves sorted by name
  const allMoves = useMemo(() => {
    const moves = Object.values(movesData as any).map((move: any) => ({
      id: move.id,
      name: move.name,
    }))
    moves.sort((a, b) => a.name.localeCompare(b.name))
    return [{ id: 0, name: 'None' }, ...moves]
  }, [])

  const handleSave = () => {
    onSave(pokemon, boxIndex, slotIndex)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="wireframe-title">
            {pokemon.nickname} (#{pokemon.dexNum} {pokemon.speciesName})
          </h2>
          <button className="wireframe-button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="text-center" style={{ margin: '16px 0' }}>
          <img
            src={getPokemonSpriteUrl(pokemon.dexNum, pokemon.speciesName, pokemon.isShiny, 'large')}
            alt={pokemon.speciesName}
            className="pokemon-sprite-large"
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
          {pokemon.isShiny && (
            <div className="shiny-banner">
              <Sparkles className="icon icon-muted" />
              <span>Shiny</span>
            </div>
          )}
        </div>

        <div className="wireframe-box">
          <div className="form-row">
            <div className="read-only-stat">
              <div className="stat-label">OT</div>
              <div className="stat-value">{pokemon.trainerName}</div>
            </div>
            <div className="read-only-stat">
              <div className="stat-label">ID</div>
              <div className="stat-value">{pokemon.trainerID.toString().padStart(5, '0')}</div>
            </div>
          </div>
          <div className="form-row tight">
            <div style={{ flex: 1 }}>
              <label className="form-label">Level</label>
              <input
                type="number"
                className="wireframe-input"
                value={pokemon.level || ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : e.target.value
                  if (val === '') {
                    updatePokemon({ level: 0 })
                  } else {
                    const parsed = parseInt(val)
                    if (!isNaN(parsed)) {
                      updatePokemon({ level: parsed })
                    }
                  }
                }}
                onBlur={(e) => {
                  const val = parseInt(e.target.value)
                  if (isNaN(val) || val < 1) handleLevelChange(1)
                  else if (val > 100) handleLevelChange(100)
                  else handleLevelChange(val)
                }}
                min="1"
                max="100"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label">Gender</label>
              <select
                className="wireframe-input"
                value={pokemon.gender}
                onChange={(e) => updatePokemon({ gender: parseInt(e.target.value) as Gender })}
              >
                <option value={Gender.Male}>♂ Male</option>
                <option value={Gender.Female}>♀ Female</option>
                <option value={Gender.Genderless}>— Genderless</option>
              </select>
            </div>
          </div>
          {pokemon.isFakemon && (
            <div className="fakemon-warning">
              <AlertTriangle className="icon icon-muted" />
              <span>Fakemon — cannot be transferred</span>
            </div>
          )}
        </div>

        <div className="tabs">
          <div
            className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Stats
          </div>
          <div
            className={`tab ${activeTab === 'moves' ? 'active' : ''}`}
            onClick={() => setActiveTab('moves')}
          >
            Moves
          </div>
          <div
            className={`tab ${activeTab === 'other' ? 'active' : ''}`}
            onClick={() => setActiveTab('other')}
          >
            Other
          </div>
        </div>

        {activeTab === 'stats' && (
          <div>
            <h3 className="wireframe-subtitle">Base Stats</h3>
            <div className="stats-grid">
              <div className="stat-item read-only-stat">
                <div className="stat-label">HP</div>
                <div className="stat-value">{pokemon.baseStats.hp}</div>
              </div>
              <div className="stat-item read-only-stat">
                <div className="stat-label">ATTACK</div>
                <div className="stat-value">{pokemon.baseStats.atk}</div>
              </div>
              <div className="stat-item read-only-stat">
                <div className="stat-label">DEFENSE</div>
                <div className="stat-value">{pokemon.baseStats.def}</div>
              </div>
              <div className="stat-item read-only-stat">
                <div className="stat-label">SP. ATK</div>
                <div className="stat-value">{pokemon.baseStats.spa}</div>
              </div>
              <div className="stat-item read-only-stat">
                <div className="stat-label">SP. DEF</div>
                <div className="stat-value">{pokemon.baseStats.spd}</div>
              </div>
              <div className="stat-item read-only-stat">
                <div className="stat-label">SPEED</div>
                <div className="stat-value">{pokemon.baseStats.spe}</div>
              </div>
            </div>

            <h3 className="wireframe-subtitle">Calculated Stats (at Level {pokemon.level})</h3>
            <div className="stats-grid">
              <div className="stat-item read-only-stat">
                <div className="stat-label">HP</div>
                <div className="stat-value">{pokemon.hp}</div>
              </div>
              <div className="stat-item read-only-stat">
                <div className="stat-label">ATTACK</div>
                <div className="stat-value">{pokemon.attack}</div>
              </div>
              <div className="stat-item read-only-stat">
                <div className="stat-label">DEFENSE</div>
                <div className="stat-value">{pokemon.defense}</div>
              </div>
              <div className="stat-item read-only-stat">
                <div className="stat-label">SP. ATK</div>
                <div className="stat-value">{pokemon.spAtk}</div>
              </div>
              <div className="stat-item read-only-stat">
                <div className="stat-label">SP. DEF</div>
                <div className="stat-value">{pokemon.spDef}</div>
              </div>
              <div className="stat-item read-only-stat">
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
                  value={pokemon.hpIV ?? ''}
                  {...createNumberInputHandlers('hpIV', 0, 31, 0)}
                  min="0"
                  max="31"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Attack IV</label>
                <input
                  type="number"
                  className="wireframe-input"
                  value={pokemon.attackIV ?? ''}
                  {...createNumberInputHandlers('attackIV', 0, 31, 0)}
                  min="0"
                  max="31"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Defense IV</label>
                <input
                  type="number"
                  className="wireframe-input"
                  value={pokemon.defenseIV ?? ''}
                  {...createNumberInputHandlers('defenseIV', 0, 31, 0)}
                  min="0"
                  max="31"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Sp. Atk IV</label>
                <input
                  type="number"
                  className="wireframe-input"
                  value={pokemon.spAtkIV ?? ''}
                  {...createNumberInputHandlers('spAtkIV', 0, 31, 0)}
                  min="0"
                  max="31"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Sp. Def IV</label>
                <input
                  type="number"
                  className="wireframe-input"
                  value={pokemon.spDefIV ?? ''}
                  {...createNumberInputHandlers('spDefIV', 0, 31, 0)}
                  min="0"
                  max="31"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Speed IV</label>
                <input
                  type="number"
                  className="wireframe-input"
                  value={pokemon.speedIV ?? ''}
                  {...createNumberInputHandlers('speedIV', 0, 31, 0)}
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
                  value={pokemon.hpEV ?? ''}
                  {...createNumberInputHandlers('hpEV', 0, 255, 0)}
                  min="0"
                  max="255"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Attack EV</label>
                <input
                  type="number"
                  className="wireframe-input"
                  value={pokemon.attackEV ?? ''}
                  {...createNumberInputHandlers('attackEV', 0, 255, 0)}
                  min="0"
                  max="255"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Defense EV</label>
                <input
                  type="number"
                  className="wireframe-input"
                  value={pokemon.defenseEV ?? ''}
                  {...createNumberInputHandlers('defenseEV', 0, 255, 0)}
                  min="0"
                  max="255"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Sp. Atk EV</label>
                <input
                  type="number"
                  className="wireframe-input"
                  value={pokemon.spAtkEV ?? ''}
                  {...createNumberInputHandlers('spAtkEV', 0, 255, 0)}
                  min="0"
                  max="255"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Sp. Def EV</label>
                <input
                  type="number"
                  className="wireframe-input"
                  value={pokemon.spDefEV ?? ''}
                  {...createNumberInputHandlers('spDefEV', 0, 255, 0)}
                  min="0"
                  max="255"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Speed EV</label>
                <input
                  type="number"
                  className="wireframe-input"
                  value={pokemon.speedEV ?? ''}
                  {...createNumberInputHandlers('speedEV', 0, 255, 0)}
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
              <label className="form-label">Move 1</label>
              <select
                className="wireframe-input"
                value={pokemon.moves[0]}
                onChange={(e) =>
                  updatePokemon({
                    moves: [
                      parseInt(e.target.value),
                      pokemon.moves[1],
                      pokemon.moves[2],
                      pokemon.moves[3],
                    ],
                  })
                }
              >
                {allMoves.map((move) => (
                  <option value={move.id}>{move.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Move 2</label>
              <select
                className="wireframe-input"
                value={pokemon.moves[1]}
                onChange={(e) =>
                  updatePokemon({
                    moves: [
                      pokemon.moves[0],
                      parseInt(e.target.value),
                      pokemon.moves[2],
                      pokemon.moves[3],
                    ],
                  })
                }
              >
                {allMoves.map((move) => (
                  <option value={move.id}>{move.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Move 3</label>
              <select
                className="wireframe-input"
                value={pokemon.moves[2]}
                onChange={(e) =>
                  updatePokemon({
                    moves: [
                      pokemon.moves[0],
                      pokemon.moves[1],
                      parseInt(e.target.value),
                      pokemon.moves[3],
                    ],
                  })
                }
              >
                {allMoves.map((move) => (
                  <option value={move.id}>{move.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Move 4</label>
              <select
                className="wireframe-input"
                value={pokemon.moves[3]}
                onChange={(e) =>
                  updatePokemon({
                    moves: [
                      pokemon.moves[0],
                      pokemon.moves[1],
                      pokemon.moves[2],
                      parseInt(e.target.value),
                    ],
                  })
                }
              >
                {allMoves.map((move) => (
                  <option value={move.id}>{move.name}</option>
                ))}
              </select>
            </div>
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
                  value={pokemon.friendship ?? ''}
                  {...createNumberInputHandlers('friendship', 0, 255, 0)}
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
                  value={pokemon.exp ?? ''}
                  {...createNumberInputHandlers('exp', 0, 16777215, 0)}
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
                <div className="helper-text">
                  {NATURES[pokemon.nature]} {getNatureModifierText(pokemon.nature)}
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Ability</label>
                <select
                  className="wireframe-input"
                  value={pokemon.ability}
                  onChange={(e) => updatePokemon({ ability: parseInt(e.target.value) })}
                >
                  {abilities.ability1 && <option value={0}>{abilities.ability1}</option>}
                  {abilities.ability2 && <option value={1}>{abilities.ability2}</option>}
                  {abilities.abilityH && <option value={2}>{abilities.abilityH} (Hidden)</option>}
                  {!abilities.ability1 && !abilities.ability2 && !abilities.abilityH && (
                    <option value={0}>No abilities found</option>
                  )}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Ball Type</label>
                <input
                  type="number"
                  className="wireframe-input"
                  value={pokemon.ball ?? ''}
                  {...createNumberInputHandlers('ball', 0, 65535, 0)}
                  min="0"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Held Item (ID)</label>
              <input
                type="number"
                className="wireframe-input"
                value={pokemon.heldItem ?? ''}
                {...createNumberInputHandlers('heldItem', 0, 65535, 0)}
                min="0"
              />
            </div>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={pokemon.isShiny}
                onChange={(e) => updatePokemon({ isShiny: e.target.checked })}
              />
              <span>Shiny (Note: May not work correctly)</span>
            </label>
          </div>
        )}

        <div className="modal-actions">
          <button className="wireframe-button" onClick={handleSave} style={{ flex: 1 }}>
            Save changes
          </button>
          <button className="wireframe-button" onClick={onClose} style={{ flex: 1 }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
