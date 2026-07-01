import { useContext } from 'react'
import { ItemBagContext } from './reducer'

export function useItemBag() {
  const [bagState, bagDispatch] = useContext(ItemBagContext)

  function addItem(index: number, quantity: number) {
    bagDispatch({ type: 'add_item', payload: { index, qty: quantity } })
  }

  function removeItem(index: number, quantity: number) {
    bagDispatch({ type: 'remove_item', payload: { index, qty: quantity } })
  }

  return { itemCounts: bagState.itemCounts, addItem, removeItem }
}
