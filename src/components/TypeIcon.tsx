import { teraTypeFromIndex, Type } from '@pokemon-resources/index'
import { PkmType } from '../../pkm_rs_resources/pkg/pkm_rs_resources'
import { getPublicImageURL, getTypeIconPath } from '../images/images'
import './components.css'

interface TypeIconProps {
  type?: Type
  typeIndex?: number | PkmType
  border?: boolean
  size?: number
}

const TypeIcon = (props: TypeIconProps) => {
  const type = props.typeIndex ? teraTypeFromIndex(props.typeIndex) : props.type

  return (
    type && (
      <img
        className={props.border ? 'type-icon-border' : ''}
        title={`${type} type`}
        draggable={false}
        alt={`${type} type`}
        style={{ height: props.size ?? 24, width: props.size ?? 24 }}
        src={getPublicImageURL(getTypeIconPath(type.toString()))}
      />
    )
  )
}

export default TypeIcon
