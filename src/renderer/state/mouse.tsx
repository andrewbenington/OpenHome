import { Dispatch, Reducer, createContext, useReducer } from 'react'

export type MouseState = {
  shift: boolean
  saveIndex?: number
  boxCell?: number
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

const reducer: Reducer<MouseState, MouseAction> = (state: MouseState, action: MouseAction) => {
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
  }
}

const initialState = { shift: false }

export const MouseContext = createContext<[MouseState, Dispatch<MouseAction>]>([
  initialState,
  () => null,
])

export const MouseProvider = ({ children }: { children: JSX.Element | JSX.Element[] }) => {
  const [state, dispatch] = useReducer<Reducer<MouseState, MouseAction>>(reducer, initialState)

  return <MouseContext.Provider value={[state, dispatch]}>{children}</MouseContext.Provider>
}
