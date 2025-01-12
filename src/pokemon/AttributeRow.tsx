const AttributeRow = (props: {
  label: string
  value?: string
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
          minHeight: 32,
          marginLeft: indent,
          display: 'grid',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            paddingLeft: 10,
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
        {value ?? children}
      </div>
    </div>
  )
}

export default AttributeRow
