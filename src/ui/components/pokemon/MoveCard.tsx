import { Moves, Type } from '@pokemon-resources/index'
import { useMemo } from 'react'
import TypeIcon from 'src/ui/components/pokemon/TypeIcon'
import { getTypeColor } from 'src/util/PokemonSprite'
import './style.css'

interface MoveCardProps {
  move?: number
  movePP?: number
  maxPP?: number
  typeOverride?: Type
}

const MoveCard = ({ move, movePP, maxPP, typeOverride }: MoveCardProps) => {
  const moveData = useMemo(() => (move ? Moves[move] : undefined), [move])
  const type = useMemo(() => typeOverride ?? (moveData?.type as Type), [typeOverride, moveData])

  const content = useMemo(() => {
    if (move === 0 || move === undefined) {
      // mon knows less than 4 moves
      return undefined
    }

    if (!moveData) {
      console.warn(`An unknown move has been detected. The move index is ${move}.`)
      // move is unknown
      return (
        <>
          <div className="type-icon-container" />
          <div className="unknown-move-name">(Unknown Move: {move})</div>
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
  }, [maxPP, move, moveData, movePP, type])

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
