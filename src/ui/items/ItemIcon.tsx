import { Option } from '@openhome-core/util/functional'
import { getItemIconPath } from '@openhome-ui/images/items'
import { cssClass } from '@openhome-ui/util/style'
import { Item } from '@pkm-rs/pkg'
import { ImgHTMLAttributes } from 'react'

export type ItemIconProps = ImgHTMLAttributes<HTMLImageElement> & {
  item: Option<Item>
  silhouette?: boolean
}

export function ItemIcon(props: ItemIconProps) {
  return props.item ? (
    <img
      className={cssClass('fill-parent').with('contrast-filter').if(props.silhouette).build()}
      src={getItemIconPath(props.item.index)}
      alt={props.item.name}
      title={props.item.name}
      draggable={false}
      {...props}
    />
  ) : (
    <img
      src="/items/index/0000.png"
      alt=""
      aria-hidden
      draggable={false}
      style={{ opacity: 0, ...props.style }}
      {...props}
    />
  )
}
