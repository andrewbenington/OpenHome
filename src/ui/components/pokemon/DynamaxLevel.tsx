import { range } from '@openhome-core/util/functional'

interface DynamaxLevelProps {
  level: number
}

const dynamaxRowStyle = { display: 'flex', flexDirection: 'row' as 'row' }
const dynamaxLevelStyle = {
  height: 20,
  width: 8,
  marginRight: 4,
}

function dynamaxLevelColor(index: number): string {
  const greenHex = (40 + index * 20)?.toString(16).padStart(2, '0')

  return `#FF${greenHex}00`
}

const DynamaxLevel = (props: DynamaxLevelProps) => {
  const { level } = props

  return (
    <div style={dynamaxRowStyle}>
      {range(10).map((index: number) => (
        <div
          key={`dynamax_meter_${index}`}
          style={{
            backgroundColor: index < level ? dynamaxLevelColor(index) : 'grey',
            ...dynamaxLevelStyle,
          }}
        />
      ))}
    </div>
  )
}

export default DynamaxLevel
