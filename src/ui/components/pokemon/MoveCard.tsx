import TypeIcon from '@openhome-ui/components/pokemon/TypeIcon'
import { colorForType, contrastColorForType } from '@openhome-ui/util/color'
import { Moves, Type } from '@pokemon-resources/index'
import { useMemo } from 'react'
import { includeClass } from 'src/ui/util/style'
import './style.css'

interface MoveCardProps {
  move?: number
  movePP?: number
  maxPP?: number
  noPP?: boolean
  typeOverride?: Type
}

const MoveCard = ({ move, movePP, maxPP, noPP, typeOverride }: MoveCardProps) => {
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
          <TypeIcon type={type} key={`${type}_type_icon`} size={noPP ? 22 : 32} border />
        </div>
        <div className="move-card-vert">
          <div className="move-name" style={{ color: contrastColorForType(type) }}>
            {moveData.name}
          </div>
          {!noPP && (
            <div className="move-pp-display">
              {movePP ?? '--'}/{maxPP ?? '--'} PP
            </div>
          )}
        </div>
      </>
    )
  }, [maxPP, move, moveData, movePP, noPP, type])

  return (
    <div
      className={includeClass('move-card')
        .with('move-card-full')
        .unless(noPP)
        .then('move-card-small')}
      style={{
        backgroundColor: colorForType(type),
        color: contrastColorForType(type),
      }}
    >
      {content}
    </div>
  )
}

export default MoveCard
