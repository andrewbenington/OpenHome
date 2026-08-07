import { ImageIndicator } from './pokemon/indicator/ImageIndicator'

export default function AttributeTag(props: {
  color: string
  backgroundColor: string
  label?: string
  icon?: string
  onClick?: () => void
}) {
  const { color, backgroundColor, label, icon, onClick } = props

  return (
    <ImageIndicator
      src={icon}
      style={{ color, backgroundColor }}
      backgroundColor={backgroundColor}
      onClick={onClick}
      text={label}
    />
  )
}
