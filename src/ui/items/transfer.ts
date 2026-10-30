import { SAV } from '@openhome-core/save/interfaces'
import { Option } from '@openhome-core/util/functional'
import { useItemBag } from '@openhome-ui/state/items'
// import { Availability, OriginGame, SvItemStorage } from '@pkm-rs/pkg'
import {
  Availability,
  Item,
  OpenhomeItemCategory,
  OpenhomeItemStorage,
  OriginGame,
  SvItemStorage,
} from '@pkm-rs/pkg'
import { useMemo } from 'react'
import { ItemData } from './ItemRow'

export type SourceType = OriginGame | 'OpenHome'
export interface ItemTransferSource {
  getItemData: (pouchIndex?: number) => ItemData[]
  database: ItemTransferDatabase
  sourceType: SourceType
  addItems: (index: number, count: number) => void
  removeItems: (index: number, count: number) => void
  getPouchName?: (pouchIndex?: number) => string
}

export function useOpenHomeItemTransfer(): ItemTransferSource {
  const { itemCounts, addItem, removeItem } = useItemBag()
  const itemData = useMemo(() => {
    const counts = new Map(
      Object.entries(itemCounts).map(([indexStr, count]) => [parseInt(indexStr), count] as const)
    )
    const maxIndex = Math.max(0, ...counts.keys())

    return Array.from({ length: maxIndex }, (_, i) => i + 1) // 1..maxIndex, skips 0
      .map((index) => {
        const count = counts.get(index) ?? 0
        return {
          index,
          count,
          pouch: OpenhomeItemStorage.categoryIndexForItem(index) ?? 0,
          isObtained: count > 0,
          isFavorite: false,
        }
      })
  }, [itemCounts])

  return {
    getItemData: () => itemData,
    database: OpenHomeItemTransfer,
    sourceType: 'OpenHome',
    addItems: addItem,
    removeItems: removeItem,
  }
}

// type ItemTransferSave = SAV & Required<Pick<SAV, 'getItemInventory' | 'updateItemData'>>

export function useSaveItemTransfer(save: SAV): Option<ItemTransferSource> {
  if (save.getItemInventory === undefined || !save.updateItemData || !save.getItemDatabase) return

  const getItemInventory = () => save.getItemInventory?.() || []
  const updateItemData = save.updateItemData

  function addItems(index: number, added: number) {
    const existing = getItemInventory().find((item) => item.index === index)
    // const database = save.getItemDatabase?.()
    const openhomeCategory =
      OpenhomeItemStorage.categoryIndexForItem(index) ?? OpenhomeItemStorage.categoryIndex('None')

    if (existing) {
      updateItemData({ ...existing, count: existing.count + added })
    } else {
      updateItemData({
        index,
        pouch: openhomeCategory,
        count: added,
        isNew: true,
        isObtained: true,
        isFavorite: false,
      })
    }
  }

  function removeItems(index: number, removed: number) {
    const existing = getItemInventory().find((item) => item.index === index)
    if (existing) {
      let newCount = existing.count - removed
      updateItemData({ ...existing, count: newCount > 0 ? newCount : 0 })
    }
  }

  return {
    getItemData: getItemInventory,
    database: save.getItemDatabase(),
    sourceType: save.origin,
    addItems,
    removeItems,
  }
}

export interface ItemTransferDatabase {
  categoryIndexes: () => number[]
  categoryName: (categoryIndex: number) => Option<string>
  maxAllowed: (itemIndex: number) => Option<number>
  convertCategory: (otherCategoryIndex: number) => OpenhomeItemCategory
  availability: (index: number) => Availability
  catIndexToOpenHome: (categoryIndex: number) => OpenhomeItemCategory
}
// console.log(SvItemStorage.pouchIndexes)

export const OpenHomeItemTransfer: ItemTransferDatabase = {
  categoryIndexes: () => Array.from(OpenhomeItemStorage.categoryIndexes()),
  categoryName: OpenhomeItemStorage.categoryName,
  maxAllowed: (index) => (OpenhomeItemStorage.categoryForItem(index) === 'KeyItems' ? 1 : 99999),
  convertCategory: OpenhomeItemStorage.categoryFromIndex,
  availability: (index) => {
    const item = Item.fromIndex(index)
    return !item?.name || item.name === '???' ? 'Unsupported' : 'Obtainable'
  },
  catIndexToOpenHome: OpenhomeItemStorage.categoryFromIndex,
}

export const ScarletVioletItemTransfer: ItemTransferDatabase = {
  categoryIndexes: () =>
    Array.from(SvItemStorage.pouchIndexes())
      .map(SvItemStorage.categoryToOpenHome)
      .map(OpenhomeItemStorage.categoryIndex),
  categoryName: SvItemStorage.pouchName,
  maxAllowed: SvItemStorage.maxAllowed,
  convertCategory: SvItemStorage.categoryToOpenHome,
  availability: SvItemStorage.availabilityOf,
  catIndexToOpenHome: SvItemStorage.categoryToOpenHome,
}
