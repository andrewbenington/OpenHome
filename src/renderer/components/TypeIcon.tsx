import { teraTypeFromIndex, Type } from 'pokemon-resources'
import { getPublicImageURL, getTypeIconPath } from '../images/images'
import './components.css'

interface TypeIconProps {
  type?: Type
  typeIndex?: number
  border?: boolean
}

const typeIconStyle = { height: 24, width: 24 }

const TypeIcon = (props: TypeIconProps) => {
  const type = props.typeIndex ? teraTypeFromIndex(props.typeIndex) : props.type
  return (
    <img
      className={props.border ? 'type-icon-border' : ''}
      title={`${type} type`}
      draggable={false}
      alt={`${type} type`}
      style={typeIconStyle}
      src={type && getPublicImageURL(getTypeIconPath(type))}
    />
  )
}

export default TypeIcon
