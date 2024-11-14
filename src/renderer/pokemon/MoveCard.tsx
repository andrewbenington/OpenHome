import { Moves, Type } from 'pokemon-resources'
import { useMemo } from 'react'
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
  const moveData = useMemo(() => Moves[move], [move])
  const type = useMemo(() => typeOverride ?? (moveData?.type as Type), [typeOverride, moveData])

  return (
    <div
      className="move-card"
      style={{
        backgroundColor: getTypeColor(type),
      }}
    >
      {moveData ? (
        <>
          <div className="type-icon-container">
            <TypeIcon type={type} key={`${type}_type_icon`} size={32} border />
          </div>

          <div className="move-card-vert">
            <div className="move-name">{Moves[move]?.name}</div>
            <div
              style={{
                color: 'white',
              }}
            >
              {movePP ?? '--'}/{maxPP ?? '--'} PP
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="type-icon-container"></div>
          <div className="unknown-move-name">(Unknown Move)</div>
        </>
      )}
    </div>
  )
}

export default MoveCard
