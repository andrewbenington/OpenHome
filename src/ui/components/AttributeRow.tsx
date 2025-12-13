import { PKMDate } from '@pokemon-files/util'
import dayjs from 'dayjs'

export type AttributeRowValue = string | number | PKMDate | undefined

const AttributeRow = (props: {
  label: string
  value?: AttributeRowValue
  justifyEnd?: boolean
  indent?: number
  children?: any
  style?: any
}) => {
  const { label, value, justifyEnd, indent, children, style } = props

  return (
    <div className="attribute-row" style={style}>
      <div
        className="attribute-row-label"
        style={{
          minWidth: indent ? `calc(33% - ${indent}px)` : '33%',
          height: '100%',
          minHeight: 28,
          marginLeft: indent,
          display: 'grid',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            paddingLeft: 8,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </div>
      </div>
      <div
        className="attribute-row-content"
        style={{
          justifyContent: justifyEnd ? 'end' : 'start',
          textAlign: justifyEnd ? 'end' : 'start',
        }}
      >
        {children !== undefined ? children : formatValue(value)}
      </div>
    </div>
  )
}

function formatValue(value: AttributeRowValue): string {
  if (value === undefined) {
    return '<not present>'
  }
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number') {
    return value.toString()
  }
  if ('year' in value && 'month' in value) {
    return dayjs(new Date(value.year, value.month, value.day)).format('MMM D, YYYY')
  }
  return `${value}`
}

export default AttributeRow
