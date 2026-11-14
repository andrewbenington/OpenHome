import { Option } from '@openhome-core/util/functional'
import { inverted, numericSorter, stringSorter } from '@openhome-core/util/sort'
import {
  SortAlphaDownIcon,
  SortAlphaUpcon,
  SortAmountDownIcon,
  SortAmountUpIcon,
} from '@openhome-ui/components/Icons'
import {
  Availability,
  Item,
  OpenhomeItemCategory,
  OpenhomeItemStorage,
  OriginGame,
} from '@pkm-rs/pkg'
import { ReactNode } from 'react'

export type SourceType = OriginGame | 'OpenHome'
export interface ItemTransferSource {
  getItemData: (pouchIndex?: number) => ItemData[]
  database: ItemTransferDatabase
  sourceType: SourceType
  addItems: (index: number, count: number) => void
  removeItems: (index: number, count: number) => void
  getPouchName?: (pouchIndex?: number) => string
}

export interface ItemTransferDatabase {
  categoryIndexes: () => number[]
  categoryName: (categoryIndex: number) => Option<string>
  maxAllowed: (itemIndex: number) => Option<number>
  availability: (index: number) => Availability
  internalCategoryForItem: (itemIndex: number) => Option<number>
  internalCategoryToOpenhome: (categoryIndex: number) => OpenhomeItemCategory
  internalCategoryFromOpenhome: (categoryToConvert: OpenhomeItemCategory) => Option<number>
}

export interface KeyItemTransferSource {
  getItemData: () => ItemData[]
  database: ItemTransferDatabase
  sourceType: SourceType
  registerItem: (index: number) => void
}

export const OpenHomeItemTransfer: ItemTransferDatabase = {
  categoryIndexes: () => Array.from(OpenhomeItemStorage.categoryIndexes()),
  categoryName: OpenhomeItemStorage.categoryName,
  maxAllowed: (index) => (OpenhomeItemStorage.categoryForItem(index) === 'KeyItems' ? 1 : 99999),
  availability: (index) => {
    const item = Item.fromIndex(index)
    return !item?.name || item.name === '???' ? 'Unsupported' : 'Obtainable'
  },
  internalCategoryForItem: OpenhomeItemStorage.categoryIndexForItem,
  internalCategoryToOpenhome: OpenhomeItemStorage.categoryFromIndex,
  internalCategoryFromOpenhome: OpenhomeItemStorage.categoryIndex,
}

export type ItemData = {
  index: number
  count: number
  isNew?: boolean
  isObtained: boolean
  isFavorite: boolean
}

export const ITEM_SORT_TYPES = [
  'count_decreasing',
  'count_increasing',
  'index_decreasing',
  'index_increasing',
  'alphabetical_a_z',
  'alphabetical_z_a',
] as const

export type ItemSortType = (typeof ITEM_SORT_TYPES)[number]

export type ItemSorter = (s: ItemSortType) => (a: ItemData, b: ItemData) => number

export function itemSorter(sortType: ItemSortType): (a: ItemData, b: ItemData) => number {
  switch (sortType) {
    case 'alphabetical_a_z':
      return stringSorter((item) => Item.fromIndex(item.index)?.name)
    case 'alphabetical_z_a':
      return inverted(stringSorter((item) => Item.fromIndex(item.index)?.name))
    case 'index_increasing':
      return numericSorter((item) => item.index)
    case 'index_decreasing':
      return inverted(numericSorter((item) => item.index))
    case 'count_increasing':
      return numericSorter((item) => item.count)
    case 'count_decreasing':
      return inverted(numericSorter((item) => item.count))
  }
}

export function displayItemSortType(sortType: ItemSortType): string {
  switch (sortType) {
    case 'alphabetical_a_z':
      return 'Alphabetical A-Z'
    case 'alphabetical_z_a':
      return 'Alphabetical Z-A'
    case 'index_decreasing':
      return 'Index Decreasing'
    case 'index_increasing':
      return 'Index Increasing'
    case 'count_decreasing':
      return 'Count Decreasing'
    case 'count_increasing':
      return 'Count Increasing'
  }
}

export function itemSortTypeIcon(sortType: ItemSortType): ReactNode {
  switch (sortType) {
    case 'alphabetical_a_z':
      return <SortAlphaDownIcon />
    case 'alphabetical_z_a':
      return <SortAlphaUpcon />
    case 'index_decreasing':
    case 'count_decreasing':
      return <SortAmountDownIcon />
    case 'index_increasing':
    case 'count_increasing':
      return <SortAmountUpIcon />
  }
}

export type ItemFilter = {
  includeUnsupported: boolean
  includeEmpty: boolean
  includeUnobtained: boolean
  sort: ItemSortType
}

export const defaultFilter: ItemFilter = {
  includeEmpty: false,
  includeUnsupported: false,
  includeUnobtained: false,
  sort: 'index_decreasing',
}
