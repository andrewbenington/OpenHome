import { Item } from '@pkm-rs/pkg'
import { useCallback, useContext } from 'react'
import { MonLocation } from '../saves/reducer'
import { useSaves } from '../saves/useSaves'
import { ItemBagContext } from './reducer'

export function useItems() {
  const { setMonHeldItem, getMonAtLocation } = useSaves()
  const [bagState, bagDispatch] = useContext(ItemBagContext)

  const moveMonItemToBag = useCallback(
    (monLocation: MonLocation) => {
      const destMon = getMonAtLocation(monLocation)
      if (!destMon?.heldItemIndex) return
      setMonHeldItem(undefined, monLocation)
      bagDispatch({ type: 'add_item', payload: { index: destMon.heldItemIndex, qty: 1 } })
      setMonHeldItem(undefined, monLocation)
    },
    [setMonHeldItem, getMonAtLocation, bagDispatch]
  )

  const giveItemToMon = useCallback(
    (monLocation: MonLocation, item: Item) => {
      const destMon = getMonAtLocation(monLocation)
      bagDispatch({ type: 'remove_item', payload: { index: item.index, qty: 1 } })

      // If already holding an item, move it to the bag
      if (destMon?.heldItemIndex !== undefined) {
        bagDispatch({ type: 'add_item', payload: { index: destMon.heldItemIndex, qty: 1 } })
      }
      setMonHeldItem(item, monLocation)
    },
    [setMonHeldItem, getMonAtLocation, bagDispatch]
  )

  return { moveMonItemToBag, giveItemToMon, itemCounts: bagState.itemCounts }
}
