import { createContext, Dispatch, Reducer } from 'react'

/*
 *  STATE
 */
export type BagState = {
  itemCounts: Record<number, number>
  modified: boolean
  loaded: boolean
  error?: string
}

export type BagAction =
  | { type: 'load_bag'; payload: Record<number, number> }
  | { type: 'add_item'; payload: { index: number; qty: number } }
  | { type: 'remove_item'; payload: { index: number; qty: number } }
  | { type: 'clear_modified' }
  | { type: 'set_error'; payload?: string }

export const bagReducer: Reducer<BagState, BagAction> = (state, action) => {
  switch (action.type) {
    case 'load_bag':
      return {
        ...state,
        itemCounts: action.payload,
        loaded: true,
        modified: false,
        error: undefined,
      }
    case 'add_item': {
      const qty = (state.itemCounts[action.payload.index] ?? 0) + action.payload.qty
      return {
        ...state,
        itemCounts: { ...state.itemCounts, [action.payload.index]: qty },
        modified: true,
      }
    }
    case 'remove_item': {
      const { index, qty } = action.payload
      const next = { ...state.itemCounts }
      const newQty = (next[index] ?? 0) - qty
      if (newQty <= 0) delete next[index]
      else next[index] = newQty
      return { ...state, itemCounts: next, modified: true }
    }
    case 'clear_modified':
      return { ...state, modified: false }
    case 'set_error':
      return { ...state, error: action.payload }
    default:
      return state
  }
}

const initialBagState: BagState = { itemCounts: {}, modified: false, loaded: false }

/*
 *  CONTEXT
 */
export const BagContext = createContext<[BagState, Dispatch<BagAction>]>([
  initialBagState,
  () => {},
])
