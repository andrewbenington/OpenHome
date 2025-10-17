import { createContext, Dispatch, Reducer } from 'react'

// src/types/BagItem.ts

export interface BagItem {
  /** Item ID or index in the master item list */
  id: number

  /** Quantity (number of this item held) */
  quantity: number

  /** Optional: name or display label */
  name?: string

  /** Optional: image/icon path for rendering */
  iconPath?: string
}

/*
 *  STATE
 */
// bagContext.ts
export type BagState = {
  items: Record<string, number> // e.g. { "Potion": 5, "Ultra Ball": 12 }
  modified: boolean
  loaded: boolean
  error?: string
}

export type BagAction =
  | { type: 'load_bag'; payload: Record<string, number> }
  | { type: 'add_item'; payload: { name: string; qty: number } }
  | { type: 'remove_item'; payload: { name: string; qty: number } }
  | { type: 'clear_modified' }
  | { type: 'set_error'; payload?: string }

export const bagReducer: Reducer<BagState, BagAction> = (state, action) => {
  switch (action.type) {
    case 'load_bag':
      return { ...state, items: action.payload, loaded: true, modified: false, error: undefined }
    case 'add_item': {
      const qty = (state.items[action.payload.name] ?? 0) + action.payload.qty
      return { ...state, items: { ...state.items, [action.payload.name]: qty }, modified: true }
    }
    case 'remove_item': {
      const { name, qty } = action.payload
      const next = { ...state.items }
      const newQty = (next[name] ?? 0) - qty
      if (newQty <= 0) delete next[name]
      else next[name] = newQty
      return { ...state, items: next, modified: true }
    }
    case 'clear_modified':
      return { ...state, modified: false }
    case 'set_error':
      return { ...state, error: action.payload }
    default:
      return state
  }
}

const initialBagState: BagState = { items: {}, modified: false, loaded: false }

/*
 *  CONTEXT
 */
export const BagContext = createContext<[BagState, Dispatch<BagAction>]>([
  initialBagState,
  () => {},
])
