import { getPublicImageURL, getTypeIconPath } from '@openhome-ui/images/images'
import { PkmType } from '@pkm-rs/pkg'
import { teraTypeStringFromIndex } from '@pokemon-resources/index'
import './style.css'

interface TypeIconProps {
  type?: PkmType
  typeIndex?: number
  border?: boolean
  size?: number
}

const TypeIcon = (props: TypeIconProps) => {
  const type = props.typeIndex ? teraTypeStringFromIndex(props.typeIndex) : props.type

  return (
    type && (
      <img
        className={props.border ? 'type-icon-border' : ''}
        title={`${type} type`}
        draggable={false}
        alt={`${type} type`}
        style={{ height: props.size ?? 24, width: props.size ?? 24 }}
        src={getPublicImageURL(getTypeIconPath(type))}
      />
    )
  )
}

export default TypeIcon
