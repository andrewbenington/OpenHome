import { Dispatch, Reducer, createContext } from 'react'
import { SAV } from 'src/types/SAVTypes/SAV'
import { PKMInterface } from '../types/interfaces'

export type DragSource = {
  save: SAV
  box: number
  boxPos: number
  mon: PKMInterface
}

export type MouseState = {
  shift: boolean
  saveIndex?: number
  boxCell?: number
  dragSource?: DragSource
}

export type MouseAction =
  | {
      type: 'set_shift'
      payload: boolean
    }
  | {
      type: 'set_box_cell'
      payload: number
    }
  | {
      type: 'set_save_index'
      payload?: number | undefined
    }
  | {
      type: 'set_drag_source'
      payload: DragSource | undefined
    }

export const mouseReducer: Reducer<MouseState, MouseAction> = (
  state: MouseState,
  action: MouseAction
) => {
  const { type, payload } = action
  switch (type) {
    case 'set_shift': {
      const newState = {
        ...state,
        shift: payload,
      }
      return newState
    }
    case 'set_box_cell': {
      const newState = {
        ...state,
        boxCell: payload,
      }
      return newState
    }
    case 'set_save_index': {
      const newState = {
        ...state,
        boxCell: payload,
      }
      return newState
    }
    case 'set_drag_source': {
      return { ...state, dragSource: payload }
    }
  }
}

const initialState = { shift: false }

export const MouseContext = createContext<[MouseState, Dispatch<MouseAction>]>([
  initialState,
  () => null,
])
