export default function AttributeTag(props: {
  color: string
  backgroundColor: string
  label?: string
  icon?: string
}) {
  const { color, backgroundColor, label, icon } = props

  return (
    <div className="attribute-tag" style={{ color, backgroundColor }}>
      {icon ? <img className="attribute-tag-icon" alt={`${icon} icon`} src={icon} /> : label}
    </div>
  )
}
