import { Filter } from '@openhome-ui/util/filter'
import { createContext, useContext } from 'react'

export type MonDisplayState = { filter: Filter; extraIndicator?: ExtraIndicatorType }

export function initialMonDisplayState() {
  return { filter: {} }
}

export const MonStateContext = createContext<[MonDisplayState, (state: MonDisplayState) => void]>([
  initialMonDisplayState(),
  () => null,
])

export function useMonDisplay() {
  const [state, setState] = useContext(MonStateContext)

  function setFilter(newFilter: Partial<Filter>) {
    setState({ ...state, filter: newFilter })
  }

  function clearFilter() {
    setState({ ...state, filter: {} })
  }

  function setExtraIndicatorType(extraIndicator: ExtraIndicatorType | undefined) {
    setState({ ...state, extraIndicator })
  }

  return { ...state, setFilter, clearFilter, setExtraIndicatorType }
}

export type ExtraIndicatorType = 'GameOfOrigin' | 'Gender' | 'EVs' | 'IVs'
