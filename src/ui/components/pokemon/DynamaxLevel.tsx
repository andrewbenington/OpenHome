import { range } from '@openhome-core/util/functional'

interface DynamaxLevelProps {
  level: number
}

function dynamaxLevelColor(index: number): string {
  const greenHex = (40 + index * 20)?.toString(16).padStart(2, '0')

  return `#FF${greenHex}00`
}

const DynamaxLevel = (props: DynamaxLevelProps) => {
  const { level } = props

  return (
    <div className="flex-row">
      {range(10).map((index: number) => (
        <div
          className="dynamax-level"
          key={`dynamax_meter_${index}`}
          style={{
            backgroundColor: index < level ? dynamaxLevelColor(index) : 'gray',
          }}
        />
      ))}
    </div>
  )
}

export default DynamaxLevel
