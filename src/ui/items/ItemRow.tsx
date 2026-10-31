import { FavoriteIcon } from '@openhome-ui/components/Icons'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { cssClass } from '@openhome-ui/util/style'
import { Item, OpenhomeItemStorage } from '@pkm-rs/pkg'
import { Grid } from '@radix-ui/themes'
import { CSSProperties } from 'react'
import { ItemIcon } from './ItemIcon'
import './ItemRow.css'
import { ItemData, ItemTransferDatabase } from './types'

export interface ItemRowProps {
  itemData: ItemData
  database: ItemTransferDatabase
  selected: boolean
  inactive: boolean
  unobtainable: boolean
  disabled: boolean
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
        .if(props.unobtainable)
        .with('item-row-disabled')
        .if(props.disabled)
        .build()}
      onClick={props.disabled ? undefined : onClick}
      style={props.style}
    >
      <ItemIcon item={item} />
      <p>{item?.name}</p>
      {itemData.isFavorite ? <FavoriteIcon /> : <div />}
      <div className="item-count">x{itemData.count}</div>
      <img
        className="item-category-icon"
        src={getPublicImageURL(
          OpenhomeItemStorage.categoryIconPath(database.internalCategoryToOpenhome(itemData.pouch))
        )}
      />
    </Grid>
  )
}
