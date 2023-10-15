import { Types } from '../../consts'
import { Type } from '../../types/types'
import { getPublicImageURL, getTypeIconPath } from '../images/images'

interface TypeIconProps {
  type?: Type
  typeIndex?: number
}

const typeIconStyle = { height: 24, width: 24, marginRight: 5 }

const TypeIcon = (props: TypeIconProps) => {
  const type = props.type ?? Types[props.typeIndex ?? 0]
  return (
    <img
      draggable={false}
      alt={`${type} type`}
      style={typeIconStyle}
      src={getPublicImageURL(getTypeIconPath(type))}
    />
  )
}

export default TypeIcon
