import { FavoriteIcon } from '@openhome-ui/components/Icons'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { cssClass } from '@openhome-ui/util/style'
import { Item, OpenhomeItemStorage } from '@pkm-rs/pkg'
import { Grid } from '@radix-ui/themes'
import { CSSProperties } from 'react'
import { ItemIcon } from './ItemIcon'
import './ItemRow.css'
import { ItemTransferDatabase } from './transfer'

export type ItemData = {
  index: number
  pouch: number
  count: number
  isNew?: boolean
  isObtained: boolean
  isFavorite: boolean
}

export interface ItemRowProps {
  itemData: ItemData
  database: ItemTransferDatabase
  selected: boolean
  inactive: boolean
  otherText?: string
  onClick?: () => void
  style?: CSSProperties
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
        .if(database.availability(itemData.index) !== 'Obtainable')
        .build()}
      onClick={onClick}
      style={props.style}
    >
      <ItemIcon item={item} />
      <p>{item?.name}</p>
      {itemData.isFavorite ? <FavoriteIcon /> : <div />}
      <div className="item-count">x{itemData.count}</div>
      <img
        className="item-category-icon"
        src={getPublicImageURL(
          OpenhomeItemStorage.categoryIconPath(database.catIndexToOpenHome(itemData.pouch))
        )}
      />
    </Grid>
  )
}
