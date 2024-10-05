import { Card } from '@mui/joy'

const AttributeTag = (props: {
  color: string
  backgroundColor: string
  label?: string
  icon?: string
}) => {
  const { color, backgroundColor, label, icon } = props
  return (
    <Card
      style={{
        marginLeft: 5,
        marginTop: 5,
        padding: icon ? '5px 5px 0px' : 5,
        width: 'fit-content',
        fontWeight: 'bold',
        color,
        backgroundColor,
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
        label ?? ''
      )}
    </Card>
  )
}
export default AttributeTag
