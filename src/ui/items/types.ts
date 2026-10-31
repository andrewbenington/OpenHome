import { Option } from '@openhome-core/util/functional'
import { $O } from '@openhome-core/util/option'
import {
  Availability,
  Item,
  OpenhomeItemCategory,
  OpenhomeItemStorage,
  OriginGame,
  SvItemStorage,
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
// console.log(SvItemStorage.pouchIndexes)

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

export const ScarletVioletItemTransfer: ItemTransferDatabase = {
  categoryIndexes: () => Array.from(SvItemStorage.pouchIndexes()),
  categoryName: SvItemStorage.pouchName,
  maxAllowed: SvItemStorage.maxAllowed,
  availability: SvItemStorage.availabilityOf,
  internalCategoryForItem: (index) =>
    $O(SvItemStorage.pouchIndexForItem(index))
      .map(SvItemStorage.pouchIndexToOpenHome)
      .map(OpenhomeItemStorage.categoryIndex)
      .get(),
  internalCategoryToOpenhome: SvItemStorage.pouchIndexToOpenHome,
  internalCategoryFromOpenhome: SvItemStorage.pouchIndexFromOpenHome,
}

export type ItemData = {
  index: number
  pouch: number
  count: number
  isNew?: boolean
  isObtained: boolean
  isFavorite: boolean
}
