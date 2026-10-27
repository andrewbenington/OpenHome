import { FavoriteIcon } from '@openhome-ui/components/Icons'
import { cssClass } from '@openhome-ui/util/style'
import { Item } from '@pkm-rs/pkg'
import { Grid } from '@radix-ui/themes'
import { ItemIcon } from './ItemIcon'
import './ItemRow.css'

export type ItemData = {
  index: number
  pouch: number
  count: number
  isObtained: boolean
  isFavorite: boolean
}

export interface ItemRowProps {
  itemData: ItemData
  selected: boolean
  inactive: boolean
  onClick?: () => void
}

export function ItemRow({ itemData, selected, inactive, onClick }: ItemRowProps) {
  const item = Item.fromIndex(itemData.index)
  return (
    <Grid
      className={cssClass('item-row')
        .with(`item-row-selected-${inactive ? 'inactive' : 'active'}`)
        .if(selected)
        .build()}
      onClick={onClick}
    >
      <ItemIcon item={item} />
      <p>{item?.name}</p>
      {itemData.isFavorite ? <FavoriteIcon /> : <div />}
      <div className="item-count">x{itemData.count}</div>
    </Grid>
  )
}
