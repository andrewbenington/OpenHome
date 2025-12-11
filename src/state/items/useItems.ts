import { Item } from '@pkm-rs/pkg'
import { useContext } from 'react'
import { MonLocation } from '../saves/reducer'
import { useSaves } from '../saves/useSaves'
import { ItemBagContext } from './reducer'

export function useItems() {
  const savesAndBanks = useSaves()
  const [bagState, bagDispatch] = useContext(ItemBagContext)

  function moveMonItemToBag(monLocation: MonLocation) {
    const destMon = savesAndBanks.getMonAtLocation(monLocation)
    if (!destMon?.heldItemIndex) return
    savesAndBanks.setMonHeldItem(undefined, monLocation)
    bagDispatch({ type: 'add_item', payload: { index: destMon.heldItemIndex, qty: 1 } })
    savesAndBanks.setMonHeldItem(undefined, monLocation)
  }

  function giveItemToMon(monLocation: MonLocation, item: Item) {
    // Avoid losing the second item if mon already holding same item
    const destMon = savesAndBanks.getMonAtLocation(monLocation)
    if (destMon?.heldItemIndex === item.index) {
      return
    }
    savesAndBanks.setMonHeldItem(item, monLocation)
    bagDispatch({ type: 'remove_item', payload: { index: item.index, qty: 1 } })
  }

  return { moveMonItemToBag, giveItemToMon, itemCounts: bagState.itemCounts }
}
