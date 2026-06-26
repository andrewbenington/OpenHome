import { useContext } from 'react'
import { ItemBagContext } from './reducer'

export function useItemBag() {
  const [bagState] = useContext(ItemBagContext)

  return bagState.itemCounts
}
