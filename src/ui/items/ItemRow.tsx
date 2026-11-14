import { FavoriteIcon, RegisteredIcon } from '@openhome-ui/components/Icons'
import { cssClass } from '@openhome-ui/util/style'
import { Item, OpenhomeItemCategory, OpenhomeItemStorage } from '@pkm-rs/pkg'
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
  unobtained: boolean
  singleton: boolean
  disabled: boolean
  onClick?: () => void
  style?: CSSProperties
}

export function ItemRow(props: ItemRowProps) {
  const { itemData, singleton, database, selected, inactive, onClick } = props
  const item = Item.fromIndex(itemData.index)
  const sourceCategory = database.internalCategoryForItem(itemData.index)
  const openhomeCategory: OpenhomeItemCategory =
    sourceCategory !== undefined ? database.internalCategoryToOpenhome(sourceCategory) : 'General'

  return (
    <Grid
      className={cssClass('item-row')
        .with(`item-row-selected-${inactive ? 'inactive' : 'active'}`)
        .if(selected)
        .with('item-row-unobtained')
        .if(props.unobtained || (singleton && itemData.count === 0))
        .with('item-row-disabled')
        .if(props.disabled)
        .build()}
      onClick={props.disabled ? undefined : onClick}
      style={props.style}
    >
      <ItemIcon item={item} silhouette={props.unobtained} />
      <p>{item?.name}</p>
      {itemData.isFavorite ? <FavoriteIcon /> : <div />}
      {props.singleton ? (
        <div className="item-count">{itemData.count ? <RegisteredIcon /> : <div />}</div>
      ) : (
        <div className="item-count">x{itemData.count}</div>
      )}
      <img
        className="item-category-icon contrast-filter"
        src={OpenhomeItemStorage.categoryIconPath(openhomeCategory)}
      />
    </Grid>
  )
}
