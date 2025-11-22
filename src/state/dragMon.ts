import { Item } from '@pkm-rs/pkg'
import { Dispatch, Reducer, createContext } from 'react'
import { MonWithLocation } from './saves/reducer'

export type DragPayload = { kind: 'mon'; monData: MonWithLocation } | { kind: 'item'; item: Item }

type DragMode = 'mon' | 'item'

export type DragMonState = { payload?: DragPayload; mode: DragMode }
export type DragMonAction =
  | {
      type: 'start_drag'
      payload: DragPayload
    }
  | {
      type: 'end_drag'
      payload?: undefined
    }
  | {
      type: 'set_mode'
      payload: DragMode
    }

// a reducer isnt necessary for this simple state, but will be necessary for multi-drag
export const dragMonReducer: Reducer<DragMonState, DragMonAction> = (
  state: DragMonState,
  action: DragMonAction
) => {
  const { type, payload } = action

  switch (type) {
    case 'start_drag': {
      return { ...state, payload }
    }
    case 'end_drag': {
      return { ...state, payload: undefined }
    }
    case 'set_mode': {
      return { ...state, mode: payload }
    }
  }
}

const initialState: DragMonState = { mode: 'mon' }

export const DragMonContext = createContext<[DragMonState, Dispatch<DragMonAction>]>([
  initialState,
  () => null,
])
