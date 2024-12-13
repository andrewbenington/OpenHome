import useIsDarkMode from '../hooks/dark-mode'

const AttributeRow = (props: {
  label: string
  value?: string
  justifyEnd?: boolean
  indent?: number
  children?: any
  style?: any
}) => {
  const { label, value, justifyEnd, indent, children, style } = props
  const isDarkMode = useIsDarkMode()

  return (
    <div
      style={{
        ...style,
        height: 'fit-content',
        minHeight: 32,
        marginBottom: 2,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <div
        style={{
          minWidth: indent ? `calc(33% - ${indent}px)` : '33%',
          height: '100%',
          minHeight: 32,
          backgroundColor: '#fff6',
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
        style={{
          maxWidth: 'calc(67% - 10px)',
          width: 'calc(67% - 10px)',
          height: '100%',
          minHeight: 32,
          padding: '0px 10px',
          backgroundColor: isDarkMode ? '#ddd3' : '#fff4',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: justifyEnd ? 'end' : 'start',
          textAlign: justifyEnd ? 'end' : 'start',
          overflowWrap: 'break-word',
          overflow: 'hidden',
        }}
      >
        {value ?? children}
      </div>
    </div>
  )
}

export default AttributeRow
