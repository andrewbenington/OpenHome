import { SAV } from '@openhome-core/save/interfaces'
import { Option } from '@openhome-core/util/functional'
import { useItemBag } from '@openhome-ui/state/items'
// import { Availability, OriginGame, SvItemStorage } from '@pkm-rs/pkg'
import { OriginGame } from '@pkm-rs/pkg'
import { useMemo } from 'react'
import { ItemData } from './ItemRow'

export type SourceType = OriginGame | 'OpenHome'
export interface ItemTransferSource {
  getItemData: (pouchIndex?: number) => ItemData[]
  itemIsAllowed: (index: number) => boolean
  sourceType: SourceType
  addItems: (index: number, count: number) => void
  removeItems: (index: number, count: number) => void
  getPouchName?: (pouchIndex?: number) => string
}

export function useOpenHomeItemTransfer(): ItemTransferSource {
  const { itemCounts, addItem, removeItem } = useItemBag()

  const itemData = useMemo(
    () =>
      Object.entries(itemCounts)
        .map(([indexStr, count]) => ({
          index: parseInt(indexStr),
          count,
          pouch: 0,
          isObtained: true,
          isFavorite: false,
        }))
        .filter((item) => item.index !== 0),
    [itemCounts]
  )

  return {
    getItemData: () => itemData,
    itemIsAllowed: () => true,
    sourceType: 'OpenHome',
    addItems: addItem,
    removeItems: removeItem,
  }
}

// type ItemTransferSave = SAV & Required<Pick<SAV, 'getItemInventory' | 'updateItemData'>>

export function useSaveItemTransfer(save: SAV): Option<ItemTransferSource> {
  if (save.getItemInventory === undefined || !save.updateItemData) return

  const getItemInventory = () => save.getItemInventory?.() || []
  const updateItemData = save.updateItemData

  function addItems(index: number, added: number) {
    const existing = getItemInventory().find((item) => item.index === index)
    if (existing) {
      updateItemData({ ...existing, count: existing.count + added })
    } else {
      updateItemData({
        index,
        pouch: 0,
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
    itemIsAllowed: (index) =>
      getItemInventory().some(
        (item) => item.index === index && item.pouch !== 0 && item.pouch !== 4294967295
      ),
    sourceType: save.origin,
    addItems,
    removeItems,
  }
}

export interface ItemTransferDatabase {
  readonly pouchIndexes: number[]
  pouchName: (pouchIndex: number) => Option<string>
  maxAllowed: (itemIndex: number) => Option<number>
  // pouchItems: (pouchIndex?: number) => ItemData[]
  availability: (index: number) => Availability
  // getPouchName?: (pouchIndex?: number) => string
}

// export const ScarletVioletItemTransfer: ItemTransferDatabase = {
//   pouchIndexes: Array.from(SvItemStorage.pouchIndexes),
//   pouchName: SvItemStorage.pouchName,
//   maxAllowed: SvItemStorage.maxAllowed,
//   availability: SvItemStorage.availabilityOf,
// }
