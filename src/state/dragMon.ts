import { ItemIndex } from '@pkm-rs-resources/pkg'
import { Dispatch, Reducer, createContext } from 'react'
import { MonWithLocation } from './openSaves'

export type DragPayload =
  | { kind: 'mon'; monData: MonWithLocation }
  | { kind: 'item'; item: ItemIndex }

export type DragMonState = { payload?: DragPayload }
export type DragMonAction =
  | {
      type: 'start_drag'
      payload: DragPayload
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
