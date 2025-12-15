import { range } from '@openhome-core/util/functional'
import './style.css'

export type MiniBoxIndicatorProps = {
  currentIndex: number
  columns: number
  rows: number
  emptyIndexes?: number[]
}

export default function MiniBoxIndicator(props: MiniBoxIndicatorProps) {
  const { currentIndex, columns, rows, emptyIndexes } = props

  return (
    <div className="position-display-container">
      {range(columns).map((i) => (
        <div className="position-display-col" key={`pos-display-col-${i}`}>
          {range(rows).map((j) => (
            <div
              className={`position-display-cell ${currentIndex === j * columns + i ? 'position-display-cell-active' : ''} ${emptyIndexes?.includes(j * columns + i) ? 'position-display-cell-empty' : ''}`}
              key={`pos-display-cell-${i}-${j}`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
