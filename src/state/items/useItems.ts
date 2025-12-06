import { useContext } from 'react'
import { MonLocation } from '../saves/reducer'
import { useSaves } from '../saves/useSaves'
import { ItemBagContext } from './reducer'

export function useItems() {
  const savesAndBanks = useSaves()
  const [, bagDispatch] = useContext(ItemBagContext)

  function moveMonItemToBag(monLocation: MonLocation) {
    const destMon = savesAndBanks.getMonAtLocation(monLocation)
    if (!destMon?.heldItemIndex) return
    savesAndBanks.setMonHeldItem(undefined, monLocation)
    bagDispatch({ type: 'add_item', payload: { index: destMon.heldItemIndex, qty: 1 } })
    savesAndBanks.setMonHeldItem(undefined, monLocation)
  }

  return { moveMonItemToBag }
}
