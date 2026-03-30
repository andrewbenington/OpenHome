import TypeIcon from '@openhome-ui/components/pokemon/TypeIcon'
import { colorForType, contrastColorForType } from '@openhome-ui/util/color'
import { PkmType, PkmTypes } from '@pkm-rs/pkg'
import { Moves } from '@pokemon-resources/index'
import { includeClass } from 'src/ui/util/style'
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
      <>
        <div className="type-icon-container" />
        <div className="unknown-move-name">(Unknown Move: {move})</div>
      </>
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
