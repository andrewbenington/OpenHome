import { Option } from '@openhome-core/util/functional'
import { multiSorter, numericSorter, stringSorter } from '@openhome-core/util/sort'
import { Item } from '@pkm-rs/pkg'
import { useMemo, useState } from 'react'
import { ItemTransferSource } from './types'
import { ItemFilterController } from './useItemFilter'

export function useItemSource(
  source: ItemTransferSource,
  dest: ItemTransferSource,
  itemFilter: ItemFilterController
) {
  const [selection, setSelection] = useState<Option<number>>(undefined)
  const [pouch, setPouch] = useState<number | 'ALL_ITEMS'>('ALL_ITEMS')

  const { filter } = itemFilter
  const allItems = useMemo(() => source.getItemData(), [source])

  const database = source.database

  const isKeyItemsCategory =
    pouch !== 'ALL_ITEMS' && database.internalCategoryToOpenhome(pouch) === 'KeyItems'

  const items = useMemo(
    () =>
      allItems
        .filter(
          (item) =>
            filter.includeUnsupported || dest.database.availability(item.index) !== 'Unsupported'
        )
        .filter(
          (item) => pouch === 'ALL_ITEMS' || database.internalCategoryForItem(item.index) === pouch
        )
        .filter((item) => {
          const nameTrimmed = Item.fromIndex(item.index)?.name?.trim()
          return nameTrimmed && nameTrimmed !== '???'
        })
        .filter((item) => item.isObtained || filter.includeUnobtained)
        .filter((item) => isKeyItemsCategory || item.count > 0 || filter?.includeEmpty)
        .map((item) => ({
          ...item,
          pouch: database.internalCategoryForItem(item.index) ?? 0,
        }))
        .toSorted(
          filter.sort === 'alphabetical'
            ? stringSorter((item) => Item.fromIndex(item.index)?.name)
            : multiSorter(
                numericSorter((item) => item.index),
                numericSorter((item) => item.pouch)
              )
        ),
    [allItems, pouch, dest, filter, isKeyItemsCategory, database]
  )

  const selectedItem = selection ? items.find((item) => item.index === selection) : undefined

  function getItemData(index: number) {
    return allItems.find((item) => item.index === index)
  }

  return {
    selectedItem,
    items,
    getItemData,
    selection,
    setSelection,
    source,
    database,
    pouch,
    setPouch,
    isKeyItemsCategory,
    ...itemFilter,
  }
}

export type ItemSourceController = ReturnType<typeof useItemSource>
