export default function AttributeTag(props: {
  color: string
  backgroundColor: string
  label?: string
  icon?: string
  onClick?: () => void
}) {
  const { color, backgroundColor, label, icon, onClick } = props

  return (
    <div className="attribute-tag" style={{ color, backgroundColor }} onClick={onClick}>
      {icon ? <img className="attribute-tag-icon" alt={`${icon} icon`} src={icon} /> : label}
    </div>
  )
}
