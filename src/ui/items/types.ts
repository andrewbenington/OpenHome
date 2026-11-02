import { Option } from '@openhome-core/util/functional'
import {
  Availability,
  Item,
  OpenhomeItemCategory,
  OpenhomeItemStorage,
  OriginGame,
} from '@pkm-rs/pkg'

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
