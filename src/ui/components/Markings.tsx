import { MarkingColorValue, Markings } from '@pokemon-files/util'
import { CSSProperties } from 'react'
import { marking } from 'src/types/types'

interface MarkingsProps {
  markings: Markings
}

const markingsContainerStyle = {
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
  padding: 5,
  backgroundColor: '#666',
  marginTop: 10,
  borderRadius: 5,
} as CSSProperties

const getMarkingColorByNumber = (value: marking) => {
  if (value === 'blue' || value === true) return 'blue'
  if (value === 'red') return 'red'
  return 'grey'
}

const getMarkingColor = (value: boolean | MarkingColorValue) => {
  if (!value) return 'grey'
  if (value === true) return 'blue'
  return value
}

const MarkingsDisplay = (props: MarkingsProps) => {
  const { markings } = props

  if (!('length' in markings)) {
    return (
      <div style={markingsContainerStyle}>
        <span className="No-Select" style={{ color: getMarkingColor(markings.circle) }}>
          ●
        </span>
        <span className="No-Select" style={{ color: getMarkingColor(markings.square) }}>
          ■
        </span>
        <span className="No-Select" style={{ color: getMarkingColor(markings.triangle) }}>
          ▲
        </span>
        <span className="No-Select" style={{ color: getMarkingColor(markings.heart) }}>
          ♥
        </span>
        {'star' in markings ? (
          <span className="No-Select" style={{ color: getMarkingColor(markings.star) }}>
            ★
          </span>
        ) : (
          <div />
        )}
        {'diamond' in markings ? (
          <span className="No-Select" style={{ color: getMarkingColor(markings.diamond) }}>
            ◆
          </span>
        ) : (
          <div />
        )}
      </div>
    )
  }
  return (
    <div style={markingsContainerStyle}>
      <span className="No-Select" style={{ color: getMarkingColorByNumber(markings.circle) }}>
        ●
      </span>
      <span className="No-Select" style={{ color: getMarkingColorByNumber(markings.square) }}>
        ■
      </span>
      <span className="No-Select" style={{ color: getMarkingColorByNumber(markings.triangle) }}>
        ▲
      </span>
      <span className="No-Select" style={{ color: getMarkingColorByNumber(markings.heart) }}>
        ♥
      </span>
      {'star' in markings ? (
        <span className="No-Select" style={{ color: getMarkingColorByNumber(markings.star) }}>
          ★
        </span>
      ) : (
        <div />
      )}
      {'diamond' in markings ? (
        <span className="No-Select" style={{ color: getMarkingColorByNumber(markings.diamond) }}>
          ◆
        </span>
      ) : (
        <div />
      )}
    </div>
  )
}

export default MarkingsDisplay
