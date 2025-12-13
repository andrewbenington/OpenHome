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
        style={{ '--indent': `${indent ?? 0}px` } as React.CSSProperties}
      >
        <div className="attribute-row-label-text">{label}</div>
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
  } else if (typeof value === 'string') {
    return value
  } else if (typeof value === 'number') {
    return value.toString()
  } else if ('year' in value && 'month' in value) {
    return dayjs(new Date(value.year, value.month, value.day)).format('MMM D, YYYY')
  }
  return `${value}`
}

export default AttributeRow
