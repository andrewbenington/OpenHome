import { Option } from '@openhome-core/util/functional'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { getItemIconPath } from '@openhome-ui/images/items'
import { Item } from '@pkm-rs/pkg'
import { ImgHTMLAttributes } from 'react'

export type ItemIconProps = ImgHTMLAttributes<HTMLImageElement> & {
  item: Option<Item>
}

export function ItemIcon(props: ItemIconProps) {
  return props.item ? (
    <img
      className="fill-parent"
      src={getPublicImageURL(getItemIconPath(props.item.index))}
      alt={props.item.name}
      title={props.item.name}
      draggable={false}
      {...props}
    />
  ) : (
    <img src="/items/index/0000.png" alt="" aria-hidden draggable={false} style={{ opacity: 0 }} />
  )
}
