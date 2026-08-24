import { Moves } from '@openhome-core/resources'
import TypeIcon from '@openhome-ui/components/pokemon/TypeIcon'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { colorForType, contrastColorForType } from '@openhome-ui/util/color'
import { cssClass } from '@openhome-ui/util/style'
import { PkmType, PkmTypes } from '@pkm-rs/pkg'
import OhoFlex from '../OhoFlex'
import './style.css'

type MoveCardProps = {
  move?: number
  movePP?: number
  maxPP?: number
  ppUps?: number
  compact?: boolean
  noPP?: boolean
  masteredLa?: boolean
  plusMove?: boolean
  typeOverride?: PkmType
} & React.HTMLProps<HTMLDivElement>

const MoveCard = (props: MoveCardProps) => {
  const { move, ppUps } = props
  const moveData = move ? Moves[move] : undefined
  if (move && !moveData) {
    console.warn(`An unknown move has been detected. The move index is ${move}.`)
  }

  if (!moveData) {
    return (
      <div
        {...props}
        className={cssClass('move-card')
          .with('move-card-small')
          .if(props.compact)
          .else('move-card-full')
          .with(props.className)
          .build()}
        style={{
          backgroundColor: 'gray',
          color: 'white',
          opacity: 0.5,
          ...props.style,
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
    <div className="move-card">
      <OhoFlex.RowStart width="100%" height="100%">
        <div className="type-icon-container">
          <TypeIcon
            type={type}
            key={`${type}_type_icon`}
            size={props.compact ? '1.5rem' : '2.5rem'}
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
      </OhoFlex.RowStart>
      <OhoFlex.Row width="100%" gap="0">
        {ppUps !== undefined &&
          [1, 2, 3].map((ppUpNumber) => (
            <div
              className={cssClass('pp-up-indicator')
                .with('missing')
                .if(ppUps < ppUpNumber)
                .else('present')
                .build()}
              key={`pp-up-${ppUpNumber}`}
            />
          ))}
      </OhoFlex.Row>
    </div>
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
      {...props}
    >
      {content}
    </div>
  )
}

export default MoveCard
