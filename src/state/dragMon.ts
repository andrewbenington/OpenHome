import { Dispatch, Reducer, createContext } from 'react'
import { MonWithLocation } from './openSaves'

export type DragMonState = { payload?: MonWithLocation }
export type DragMonAction =
  | {
      type: 'start_drag'
      payload: MonWithLocation
    }
  | {
      type: 'end_drag'
      payload?: undefined
    }

// a reducer isnt necessary for this simple state, but will be necessary for multi-drag
export const dragMonReducer: Reducer<DragMonState, DragMonAction> = (
  _: DragMonState,
  action: DragMonAction
) => {
  const { type, payload } = action

  switch (type) {
    case 'start_drag': {
      return { payload }
    }
    case 'end_drag': {
      return { payload: undefined }
    }
  }
}

const initialState = {}

export const DragMonContext = createContext<[DragMonState, Dispatch<DragMonAction>]>([
  initialState,
  () => null,
])
