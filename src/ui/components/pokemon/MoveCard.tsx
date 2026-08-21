import { Moves } from '@openhome-core/resources'
import TypeIcon from '@openhome-ui/components/pokemon/TypeIcon'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { colorForType, contrastColorForType } from '@openhome-ui/util/color'
import { cssClass } from '@openhome-ui/util/style'
import { PkmType, PkmTypes } from '@pkm-rs/pkg'
import './style.css'

interface MoveCardProps {
  move?: number
  movePP?: number
  maxPP?: number
  compact?: boolean
  noPP?: boolean
  masteredLa?: boolean
  plusMove?: boolean
  typeOverride?: PkmType
}

const MoveCard = (props: MoveCardProps) => {
  const { move } = props
  const moveData = move ? Moves[move] : undefined
  if (!moveData) {
    console.warn(`An unknown move has been detected. The move index is ${move}.`)
    return (
      <div
        className={cssClass('move-card')
          .with('move-card-small')
          .if(props.compact)
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

  const type = props.typeOverride ?? PkmTypes.tryFromString(moveData.type)

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

  const shouldShowPp = !props.compact && !props.noPP

  const content = (
    <>
      <div className="type-icon-container">
        <TypeIcon
          type={type}
          key={`${type}_type_icon`}
          size={props.compact ? '1.5rem' : '2rem'}
          border
        />
      </div>
      <div className="move-card-vert">
        <div className="move-name" style={{ color: contrastColorForType(type) }}>
          {moveData.name}
        </div>
        {shouldShowPp && (
          <div className="move-pp-display">
            {props.movePP ?? '--'}/{props.maxPP ?? '--'} PP
          </div>
        )}
      </div>
      <div className="move-icons">
        {props.masteredLa && (
          <img className="move-icon" src={getPublicImageURL('icons/move-mastery.png')} />
        )}
        {props.plusMove && (
          <img className="move-icon" src={getPublicImageURL('icons/plus-move.png')} />
        )}
      </div>
    </>
  )

  return (
    <div
      className={cssClass('move-card')
        .with('move-card-small')
        .if(props.compact)
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
