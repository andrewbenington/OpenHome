import { Type } from 'pokemon-resources'
import { useMemo } from 'react'
import { MOVE_DATA } from '../../consts/Moves'
import TypeIcon from '../components/TypeIcon'
import { getTypeColor } from '../util/PokemonSprite'
import './style.css'

interface MoveCardProps {
  move: number
  movePP?: number
  maxPP?: number
  typeOverride?: Type
}

const MoveCard = ({ move, movePP, maxPP, typeOverride }: MoveCardProps) => {
  const type = useMemo(() => typeOverride ?? (MOVE_DATA[move]?.type as Type), [typeOverride, move])

  return (
    <div
      className="move-card"
      style={{
        backgroundColor: getTypeColor(type),
      }}
    >
      {type && (
        <>
          <div className="type-icon-container">
            <TypeIcon type={type} key={`${type}_type_icon`} border />
          </div>

          <div className="move-card-vert">
            <div className="move-name">{MOVE_DATA[move]?.name}</div>
            <div
              style={{
                color: 'white',
              }}
            >
              {movePP ?? '--'}/{maxPP ?? '--'} PP
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default MoveCard
