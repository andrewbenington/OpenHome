import { teraTypeFromIndex, Type } from 'pokemon-resources'
import { getPublicImageURL, getTypeIconPath } from '../images/images'
import './components.css'

interface TypeIconProps {
  type?: Type
  typeIndex?: number
  border?: boolean
  size?: number
}

const TypeIcon = (props: TypeIconProps) => {
  const type = props.typeIndex ? teraTypeFromIndex(props.typeIndex) : props.type
  return (
    <img
      className={props.border ? 'type-icon-border' : ''}
      title={`${type} type`}
      draggable={false}
      alt={`${type} type`}
      style={{ height: props.size ?? 24, width: props.size ?? 24 }}
      src={type && getPublicImageURL(getTypeIconPath(type))}
    />
  )
}

export default TypeIcon
