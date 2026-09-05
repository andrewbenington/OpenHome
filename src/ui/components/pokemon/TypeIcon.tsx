import { teraTypeStringFromIndex } from '@openhome-core/resources'
import { getPublicImageURL, getTypeIconPath } from '@openhome-ui/images/images'
import { PkmType, TeraType } from '@pkm-rs/pkg'
import { memo } from 'react'
import './style.css'

type TypeIconProps = {
  border?: boolean
  size?: number | string
} & (
  | {
      type: PkmType
      typeIndex?: undefined
      teraType?: undefined
    }
  | {
      type?: undefined
      typeIndex: number
      teraType?: undefined
    }
  | {
      type?: undefined
      typeIndex?: undefined
      teraType: TeraType
    }
)

const TypeIcon = memo((props: TypeIconProps) => {
  let type: string

  if (props.teraType) {
    type = props.teraType === 'Stellar' ? 'Stellar' : props.teraType.Standard
  } else if (props.typeIndex !== undefined) {
    type = teraTypeStringFromIndex(props.typeIndex)
  } else {
    type = props.type
  }

  return (
    <img
      className={props.border ? 'type-icon-border' : ''}
      title={`${type} type`}
      draggable={false}
      alt={`${type} type`}
      style={{ height: props.size ?? 24, width: props.size ?? 24 }}
      src={getPublicImageURL(getTypeIconPath(type))}
    />
  )
})

export default TypeIcon
