import { FavoriteIcon } from '@openhome-ui/components/Icons'
import { cssClass } from '@openhome-ui/util/style'
import { Item } from '@pkm-rs/pkg'
import { Grid } from '@radix-ui/themes'
import { ItemIcon } from './ItemIcon'
import './ItemRow.css'
import { ItemTransferDatabase } from './transferSource'

export type ItemData = {
  index: number
  pouch: number
  count: number
  isObtained: boolean
  isFavorite: boolean
}

export interface ItemRowProps {
  itemData: ItemData
  database: ItemTransferDatabase
  selected: boolean
  disallowed: boolean
  inactive: boolean
  onClick?: () => void
}

export function ItemRow(props: ItemRowProps) {
  const { itemData, database, selected, inactive, onClick } = props
  const item = Item.fromIndex(itemData.index)
  return (
    <Grid
      className={cssClass('item-row')
        .with(`item-row-selected-${inactive ? 'inactive' : 'active'}`)
        .if(selected)
        .with('item-row-disallowed')
        .if(props.disallowed)
        .build()}
      onClick={onClick}
    >
      <ItemIcon item={item} />
      <p>
        {item?.name} – {database.pouchName(itemData.pouch)} – {database.availability(itemData.index)}
      </p>
      {itemData.isFavorite ? <FavoriteIcon /> : <div />}
      <div className="item-count">x{itemData.count}</div>
    </Grid>
  )
}
