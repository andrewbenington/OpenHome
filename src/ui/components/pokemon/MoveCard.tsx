import TypeIcon from '@openhome-ui/components/pokemon/TypeIcon'
import { colorForType, contrastColorForType } from '@openhome-ui/util/color'
import { cssClass } from '@openhome-ui/util/style'
import { PkmType, PkmTypes } from '@pkm-rs/pkg'
import { Moves } from '@pokemon-resources/index'
import './style.css'

interface MoveCardProps {
  move?: number
  movePP?: number
  maxPP?: number
  noPP?: boolean
  typeOverride?: PkmType
}

const MoveCard = ({ move, movePP, maxPP, noPP, typeOverride }: MoveCardProps) => {
  const moveData = move ? Moves[move] : undefined
  if (!moveData) {
    console.warn(`An unknown move has been detected. The move index is ${move}.`)
    return (
      <div
        className={cssClass('move-card')
          .with('move-card-small')
          .if(noPP)
          .else('move-card-full')
          .build()}
        style={{
          backgroundColor: 'gray',
          color: 'white',
          opacity: 0.5,
        }}
      >
        <div className="type-icon-container" />
        <div className="move-card-vert" />
      </div>
    )
  }

  const type = typeOverride ?? PkmTypes.tryFromString(moveData.type)

  if (!type) {
    console.warn(
      `An unknown type has been detected for move ${moveData.name}. The type string is ${moveData.type}.`
    )
    return (
      <>
        <div className="type-icon-container" />
        <div className="unknown-move-name">
          {moveData.name} (Unknown Type: {moveData.type})
        </div>
      </>
    )
  }

  const content = (
    <>
      <div className="type-icon-container">
        <TypeIcon type={type} key={`${type}_type_icon`} size={noPP ? '1.5rem' : '2rem'} border />
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

  return (
    <div
      className={cssClass('move-card')
        .with('move-card-small')
        .if(noPP)
        .else('move-card-full')
        .build()}
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
