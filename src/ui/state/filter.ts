import { Dispatch, Reducer, createContext } from 'react'
import { Filter } from 'src/types/filter'

export type FilterState = Filter

export type FilterAction =
  | {
      type: 'set_filter'
      payload: FilterState
    }
  | {
      type: 'clear_fields'
      payload: (keyof Filter)[]
    }
  | {
      type: 'clear_all'
      payload?: undefined
    }

export const filterReducer: Reducer<FilterState, FilterAction> = (
  state: FilterState,
  action: FilterAction
) => {
  const { type, payload } = action

  switch (type) {
    case 'set_filter': {
      const newState = {
        ...state,
        ...payload,
      }

      if ('dexNumber' in payload && !payload.dexNumber) {
        newState.formeNumber = undefined
      }

      return newState
    }
    case 'clear_fields': {
      const newState = { ...state }

      payload.forEach((field) => {
        delete newState[field]
      })
      if (payload.includes('dexNumber')) {
        delete newState.formeNumber
      }
      if (payload.includes('type1') && newState.type2) {
        newState.type1 = newState.type2
        delete newState.type2
      }
      return newState
    }
    case 'clear_all': {
      return {}
    }
  }
}

const initialState = {}

export const FilterContext = createContext<[FilterState, Dispatch<FilterAction>]>([
  initialState,
  () => null,
])
