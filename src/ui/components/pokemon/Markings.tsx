import { useSaves } from '@openhome/ui/state/saves/useSaves'
import { markingDisplay, Markings, MarkingShape, markingsHaveColor } from '@pokemon-files/util'
import { MarkingValue } from 'src/types/types'

type MarkingsProps = {
  markings: Markings
} & ({ openHomeId: string; allowUpdate: true } | { openHomeId?: string; allowUpdate?: false })

const getMarkingColorByNumber = (value: MarkingValue) => {
  if (value === 'blue' || value === true) return 'blue'
  if (value === 'red') return 'red'
  return 'grey'
}

const MarkingsDisplay = (props: MarkingsProps) => {
  const { markings, openHomeId, allowUpdate } = props

  const { updateMonMarkings } = useSaves()

  const cycleMarkingValue =
    allowUpdate && markingsHaveColor(markings)
      ? (shape: MarkingShape) => {
          if (markings[shape] === 'blue') {
            markings[shape] = 'red'
          } else if (markings[shape] === 'red') {
            markings[shape] = null
          } else {
            markings[shape] = 'blue'
          }

          updateMonMarkings(openHomeId, markings)
          props.markings = { ...markings }
        }
      : undefined

  return (
    <div className="markings-container">
      <Marking marking="circle" markings={markings} onClick={cycleMarkingValue} />
      <Marking marking="square" markings={markings} onClick={cycleMarkingValue} />
      <Marking marking="triangle" markings={markings} onClick={cycleMarkingValue} />
      <Marking marking="heart" markings={markings} onClick={cycleMarkingValue} />
      <Marking marking="star" markings={markings} onClick={cycleMarkingValue} />
      <Marking marking="diamond" markings={markings} onClick={cycleMarkingValue} />
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
