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

  const nonKeyItems = useMemo(
    () =>
      allItems
        .filter(
          (item) =>
            filter.includeUnsupported || dest.database.availability(item.index) !== 'Unsupported'
        )
        .filter((item) => pouch === 'ALL_ITEMS' || item.pouch === pouch)
        .filter((item) => {
          const nameTrimmed = Item.fromIndex(item.index)?.name?.trim()
          return (nameTrimmed && nameTrimmed !== '???') || filter.includeBlank
        })
        .filter((item) => item.count > 0 || filter?.includeEmpty)
        .toSorted(
          filter.sort === 'alphabetical'
            ? stringSorter((item) => Item.fromIndex(item.index)?.name)
            : multiSorter(
                numericSorter((item) => item.index),
                numericSorter((item) => item.pouch)
              )
        ),
    [allItems, pouch, dest, filter]
  )

  const selectedNonKeyItem = selection
    ? nonKeyItems.find((item) => item.index === selection)
    : undefined

  return {
    item: selectedNonKeyItem,
    items: nonKeyItems,
    selection,
    setSelection,
    source,
    database,
    pouch,
    setPouch,
    ...itemFilter,
  }
}

export type ItemSourceController = ReturnType<typeof useItemSource>
