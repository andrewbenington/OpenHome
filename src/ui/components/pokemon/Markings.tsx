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

  const markingShapes: MarkingShape[] =
    'star' in modifiedMarkings && 'diamond' in modifiedMarkings
      ? ['circle', 'triangle', 'square', 'heart', 'star', 'diamond']
      : ['circle', 'square', 'triangle', 'heart']

  return (
    <div className="markings-container">
      {markingShapes.map((shape) => (
        <Marking
          key={shape}
          shape={shape}
          markings={modifiedMarkings as AnyMarkings}
          onClick={cycleMarkingValue}
        />
      ))}
    </div>
  )
}

type AnyMarkings = {
  [K in MarkingShape]: MarkingValue
}

type MarkingProps = {
  shape: MarkingShape
  markings: AnyMarkings
  onClick?: (shape: MarkingShape) => void
}

function Marking({ shape, markings, onClick: toggleMarking }: MarkingProps) {
  return (
    <span
      className="marking-shape"
      onClick={() => toggleMarking?.(shape)}
      style={{
        cursor: toggleMarking ? 'pointer' : 'default',
        color: getMarkingColorByNumber(markings[shape]),
      }}
    >
      {markingDisplay(shape)}
    </span>
  )
}

export default MarkingsDisplay
