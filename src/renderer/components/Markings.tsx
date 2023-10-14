import { CSSProperties } from 'react'
import { marking } from '../../types/types'

interface MarkingsProps {
  markings:
    | [marking, marking, marking, marking, marking, marking]
    | [marking, marking, marking, marking]
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

const getMarkingColor = (value: marking) => {
  return ['grey', 'blue', 'red'][value]
}

const Markings = (props: MarkingsProps) => {
  const { markings } = props
  return (
    <div style={markingsContainerStyle}>
      <span className="No-Select" style={{ color: getMarkingColor(markings[0]) }}>
        ●
      </span>
      <span className="No-Select" style={{ color: getMarkingColor(markings[1]) }}>
        ■
      </span>
      <span className="No-Select" style={{ color: getMarkingColor(markings[2]) }}>
        ▲
      </span>
      <span className="No-Select" style={{ color: getMarkingColor(markings[3]) }}>
        ♥
      </span>
      {markings[4] !== undefined ? (
        <span className="No-Select" style={{ color: getMarkingColor(markings[4]) }}>
          ★
        </span>
      ) : (
        <div />
      )}
      {markings[5] !== undefined ? (
        <span className="No-Select" style={{ color: getMarkingColor(markings[5]) }}>
          ◆
        </span>
      ) : (
        <div />
      )}
    </div>
  )
}

export default Markings
