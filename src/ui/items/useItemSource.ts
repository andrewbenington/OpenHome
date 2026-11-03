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
  const [category, setCategory] = useState<number | 'ALL_ITEMS'>('ALL_ITEMS')

  const { filter } = itemFilter
  const allItems = useMemo(() => source.getItemData(), [source])

  const database = source.database

  const isKeyItemsCategory =
    category !== 'ALL_ITEMS' && database.internalCategoryToOpenhome(category) === 'KeyItems'

  const categoryIndexesWithItems = database
    .categoryIndexes()
    .filter((categoryIndex) =>
      allItems.some(
        (item) => item.count > 0 && database.internalCategoryForItem(item.index) === categoryIndex
      )
    )

  const items = useMemo(
    () =>
      allItems
        .filter(
          (item) =>
            filter.includeUnsupported ||
            (source.database.availability(item.index) !== 'Unsupported' &&
              dest.database.availability(item.index) !== 'Unsupported')
        )
        .filter(
          (item) =>
            category === 'ALL_ITEMS' || database.internalCategoryForItem(item.index) === category
        )
        .filter((item) => {
          const nameTrimmed = Item.fromIndex(item.index)?.name?.trim()
          return nameTrimmed && nameTrimmed !== '???'
        })
        .filter((item) => item.isObtained || filter.includeUnobtained)
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
    [allItems, category, dest.database, filter, database, source.database]
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
    pouch: category,
    setPouch: setCategory,
    isKeyItemsCategory,
    categoryIndexesWithItems,
    ...itemFilter,
  }
}

export type ItemSourceController = ReturnType<typeof useItemSource>
