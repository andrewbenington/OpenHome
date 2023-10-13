/* eslint-disable react/jsx-props-no-spreading */
import _ from 'lodash'

interface RawDisplayProps {
  bytes: Uint8Array
}

const RawDisplay = (props: RawDisplayProps) => {
  const { bytes } = props
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {_.range(bytes.length / 16).map((row: number) => {
        return (
          <code key={`code_row_${row}`}>{`0x${row
            .toString(16)
            .padStart(3, '0')}0\t${_.range(16)
            .map(
              (byte: number) =>
                bytes[Math.min(row * 16 + byte, bytes.length - 1)]
                  .toString(16)
                  .padStart(2, '0') + (byte % 2 ? ' ' : '')
            )
            .join('')}`}</code>
        )
      })}
    </div>
  )
}
export default RawDisplay
