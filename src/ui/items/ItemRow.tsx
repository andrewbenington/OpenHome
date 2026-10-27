import { FavoriteIcon } from '@openhome-ui/components/Icons'
import { cssClass } from '@openhome-ui/util/style'
import { Item, ItemDataTs } from '@pkm-rs/pkg'
import { Grid } from '@radix-ui/themes'
import { ItemIcon } from './ItemIcon'
import './ItemRow.css'

export interface ItemRowProps {
  itemData: ItemDataTs
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
      {itemData.is_favorite ? <FavoriteIcon /> : <div />}
      <div className="item-count">x{itemData.count}</div>
    </Grid>
  )
}
