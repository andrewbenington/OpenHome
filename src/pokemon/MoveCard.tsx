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

  const content = useMemo(() => {
    if (move === 0) {
      // mon knows less than 4 moves
      return undefined
    }

    if (!moveData) {
      console.warn(`An unknown move has been detected. The move index is ${move}.`)
      // move is unknown
      return (
        <>
          <div className="type-icon-container"></div>
          <div className="unknown-move-name">(Unknown Move)</div>
        </>
      )
    }

    // move is known
    return (
      <>
        <div className="type-icon-container">
          <TypeIcon type={type} key={`${type}_type_icon`} size={32} border />
        </div>
        <div className="move-card-vert">
          <div className="move-name">{moveData.name}</div>
          <div
            style={{
              color: 'white',
            }}
          >
            {movePP ?? '--'}/{maxPP ?? '--'} PP
          </div>
        </div>
      </>
    )
  }, [move, moveData])

  return (
    <div
      className="move-card"
      style={{
        backgroundColor: getTypeColor(type),
      }}
    >
      {content}
    </div>
  )
}

export default MoveCard
