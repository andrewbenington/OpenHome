import { CSSProperties } from 'react'
import { markingColorValue, markings } from 'src/types/PKMInterfaces/types'
import { marking } from '../../types/types'

interface MarkingsProps {
  markings:
    | [marking, marking, marking, marking, marking, marking]
    | [marking, marking, marking, marking]
    | markings
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
  return ['grey', 'blue', 'red'][value]
}

const getMarkingColor = (value: boolean | markingColorValue) => {
  if (!value) return 'grey'
  if (value === true) return 'blue'
  return value
}

const Markings = (props: MarkingsProps) => {
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
      <span className="No-Select" style={{ color: getMarkingColorByNumber(markings[0]) }}>
        ●
      </span>
      <span className="No-Select" style={{ color: getMarkingColorByNumber(markings[1]) }}>
        ■
      </span>
      <span className="No-Select" style={{ color: getMarkingColorByNumber(markings[2]) }}>
        ▲
      </span>
      <span className="No-Select" style={{ color: getMarkingColorByNumber(markings[3]) }}>
        ♥
      </span>
      {markings[4] !== undefined ? (
        <span className="No-Select" style={{ color: getMarkingColorByNumber(markings[4]) }}>
          ★
        </span>
      ) : (
        <div />
      )}
      {markings[5] !== undefined ? (
        <span className="No-Select" style={{ color: getMarkingColorByNumber(markings[5]) }}>
          ◆
        </span>
      ) : (
        <div />
      )}
    </div>
  )
}

export default Markings
