import { MarkingValue } from '@openhome-core/util/types'
import { useSaves } from '@openhome-ui/state/saves'
import { markingDisplay, Markings, MarkingShape, markingsHaveColor } from '@pokemon-files/util'

type MarkingsProps = {
  readonly markings: Markings
} & ({ openHomeId: string; allowUpdate: true } | { openHomeId?: string; allowUpdate?: false })

const getMarkingColorByNumber = (value: MarkingValue) => {
  if (value === 'blue' || value === true) return 'blue'
  if (value === 'red') return 'red'
  return 'gray'
}

const MarkingsDisplay = (props: MarkingsProps) => {
  const { markings, openHomeId, allowUpdate } = props

  const { updateMonMarkings } = useSaves()

  const modifiedMarkings = { ...markings }

  const cycleMarkingValue =
    allowUpdate && markingsHaveColor(modifiedMarkings)
      ? (shape: MarkingShape) => {
          if (modifiedMarkings[shape] === 'blue') {
            modifiedMarkings[shape] = 'red'
          } else if (modifiedMarkings[shape] === 'red') {
            modifiedMarkings[shape] = null
          } else {
            modifiedMarkings[shape] = 'blue'
          }

          updateMonMarkings(openHomeId, modifiedMarkings)
        }
      : undefined

  return (
    <div className="markings-container">
      <Marking marking="circle" markings={modifiedMarkings} onClick={cycleMarkingValue} />
      <Marking marking="square" markings={modifiedMarkings} onClick={cycleMarkingValue} />
      <Marking marking="triangle" markings={modifiedMarkings} onClick={cycleMarkingValue} />
      <Marking marking="heart" markings={modifiedMarkings} onClick={cycleMarkingValue} />
      <Marking marking="star" markings={modifiedMarkings} onClick={cycleMarkingValue} />
      <Marking marking="diamond" markings={modifiedMarkings} onClick={cycleMarkingValue} />
    </div>
  )
}

type MarkingProps = {
  marking: MarkingShape
  markings: Markings
  onClick?: (shape: MarkingShape) => void
}

function Marking({ marking, markings, onClick: toggleMarking }: MarkingProps) {
  let value: MarkingValue

  if (marking === 'star' || marking === 'diamond') {
    if (!markingsHaveColor(markings)) return <></>
    value = markings[marking]
  } else {
    value = markings[marking]
  }

  return (
    <span
      className="marking-shape"
      onClick={() => toggleMarking?.(marking)}
      style={{
        cursor: toggleMarking ? 'pointer' : 'default',
        color: getMarkingColorByNumber(value),
      }}
    >
      {markingDisplay(marking)}
    </span>
  )
}

export default MarkingsDisplay
