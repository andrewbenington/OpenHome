import { Filter } from '@openhome-ui/util/filter'
import { createContext, useContext } from 'react'

export type MonDisplayState = {
  filter: Filter
  topRightIndicator: TopRightIndicatorType | null
  showShiny: boolean
  showItem: boolean
}

export function initialMonDisplayState() {
  return { filter: {}, topRightIndicator: null, showShiny: true, showItem: true }
}

export const MonDisplayContext = createContext<[MonDisplayState, (state: MonDisplayState) => void]>(
  [initialMonDisplayState(), () => null]
)

export function useMonDisplay() {
  const [state, setState] = useContext(MonDisplayContext)

  function setFilter(newFilter: Partial<Filter>) {
    setState({ ...state, filter: newFilter })
  }

  function clearFilter() {
    setState({ ...state, filter: {} })
  }

  function setTopRightIndicatorType(topRightIndicator: TopRightIndicatorType | null) {
    setState({ ...state, topRightIndicator })
  }

  function setShowShiny(showShiny: boolean) {
    setState({ ...state, showShiny })
  }

  function setShowItem(showItem: boolean) {
    setState({ ...state, showItem })
  }

  return { ...state, setFilter, clearFilter, setTopRightIndicatorType, setShowShiny, setShowItem }
}

export type TopRightIndicatorType =
  | 'Origin Game'
  | 'Gender'
  | 'EVs (Total)'
  | 'IVs (Percent)'
  | EvIndicator

type StatDisplay = 'HP' | 'Attack' | 'Defense' | 'Special Attack' | 'Special Defense' | 'Speed'

type EvIndicator = `EV (${StatDisplay})`
