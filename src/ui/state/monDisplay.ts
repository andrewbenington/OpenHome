import { Filter } from '@openhome-ui/util/filter'
import { Dispatch, Reducer, createContext, useContext } from 'react'

export type MonDisplayState = { filter: Filter }

export type MonDisplayAction =
  | {
      type: 'set_filter'
      payload: MonDisplayState
    }
  | {
      type: 'clear_filter'
      payload?: undefined
    }

export const filterReducer: Reducer<MonDisplayState, MonDisplayAction> = (
  state: MonDisplayState,
  action: MonDisplayAction
) => {
  const { type, payload } = action

  switch (type) {
    case 'set_filter': {
      const newState = { ...state, ...payload }

      if ('dexNumber' in payload && !payload.dexNumber) {
        newState.filter.formeNumber = undefined
      }

      return newState
    }
    case 'clear_filter': {
      return initialMonDisplayState()
    }
  }
}

function initialMonDisplayState() {
  return { filter: {} }
}

export const MonStateContext = createContext<[MonDisplayState, Dispatch<MonDisplayAction>]>([
  initialMonDisplayState(),
  () => null,
])

export function useMonDisplay() {
  const [state, dispatchState] = useContext(MonStateContext)

  function setFilter(newFilter: Partial<Filter>) {
    dispatchState({ type: 'set_filter', payload: { filter: newFilter } })
  }

  function clearFilter() {
    dispatchState({ type: 'clear_filter' })
  }

  return { ...state, setFilter, clearFilter }
}
