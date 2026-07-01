import {
  markingDisplay,
  Markings,
  MarkingShape,
  markingsHaveColor,
  MarkingValue,
} from '@openhome-core/util/types'

type MarkingsProps<M extends Markings> = {
  readonly markings: M
  onUpdate?: (newMarkings: M) => void
}

const getMarkingColorByNumber = (value: MarkingValue) => {
  if (value === 'blue' || value === true) return 'blue'
  if (value === 'red') return 'red'
  return 'gray'
}

const MarkingsDisplay = <M extends Markings>(props: MarkingsProps<M>) => {
  const { markings, onUpdate } = props

  const modifiedMarkings = markings

  const cycleMarkingValue =
    onUpdate && markingsHaveColor(modifiedMarkings)
      ? (shape: MarkingShape) => {
          if (modifiedMarkings[shape] === 'blue') {
            modifiedMarkings[shape] = 'red'
          } else if (modifiedMarkings[shape] === 'red') {
            modifiedMarkings[shape] = 'unset'
          } else {
            modifiedMarkings[shape] = 'blue'
          }

          onUpdate(modifiedMarkings)
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
