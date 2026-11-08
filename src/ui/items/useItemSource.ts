import { Option } from '@openhome-core/util/functional'
import { Item } from '@pkm-rs/pkg'
import { useMemo, useState } from 'react'
import { itemSorter, ItemTransferSource } from './types'
import { useItemFilter } from './useItemFilter'

export function useItemSource(source: ItemTransferSource, dest: ItemTransferSource) {
  const [selection, setSelection] = useState<Option<number>>(undefined)
  const [category, setCategory] = useState<number | 'ALL_ITEMS'>('ALL_ITEMS')

  const filterController = useItemFilter()
  const filter = filterController.filter
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
        .toSorted(itemSorter(filter.sort)),
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
    ...filterController,
  }
}

export type ItemSourceController = ReturnType<typeof useItemSource>
