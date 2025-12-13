const AttributeTag = (props: {
  color: string
  backgroundColor: string
  label?: string
  icon?: string
}) => {
  const { color, backgroundColor, label, icon } = props

  return (
    <div
      style={{
        marginTop: 5,
        padding: 3,
        display: 'grid',
        width: 'fit-content',
        fontWeight: 'bold',
        color,
        backgroundColor,
        borderRadius: 5,
      }}
    >
      {icon ? (
        <img
          alt={`${icon} icon`}
          src={icon}
          style={{
            height: 18,
            objectFit: 'contain',
          }}
        />
      ) : (
        (label ?? '')
      )}
    </div>
  )
}

export default AttributeTag
