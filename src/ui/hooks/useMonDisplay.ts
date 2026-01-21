import { Filter } from '@openhome-ui/util/filter'
import { createContext, useContext } from 'react'
import { AppInfoContext, initialMonDisplayState } from '../state/appInfo'

export type MonDisplayState = {
  filter: Filter
  topRightIndicator: TopRightIndicatorType | null
  showShiny: boolean
  showItem: boolean
}

export const MonDisplayContext = createContext<[MonDisplayState, (state: MonDisplayState) => void]>(
  [initialMonDisplayState(), () => null]
)

export function useMonDisplay() {
  const [{ settings }, dispatchAppInfo] = useContext(AppInfoContext)

  const monDisplayState = settings.monDisplayState

  function updateState(newState: MonDisplayState) {
    dispatchAppInfo({ type: 'set_mon_display_state', payload: newState })
  }

  function setFilter(newFilter: Partial<Filter>) {
    updateState({ ...monDisplayState, filter: newFilter })
  }

  function clearFilter() {
    updateState({ ...monDisplayState, filter: {} })
  }

  function setTopRightIndicatorType(topRightIndicator: TopRightIndicatorType | null) {
    updateState({ ...monDisplayState, topRightIndicator })
  }

  function setShowShiny(showShiny: boolean) {
    updateState({ ...monDisplayState, showShiny })
  }

  function setShowItem(showItem: boolean) {
    updateState({ ...monDisplayState, showItem })
  }

  return {
    ...monDisplayState,
    setFilter,
    clearFilter,
    setTopRightIndicatorType,
    setShowShiny,
    setShowItem,
  }
}

export const TopRightIndicatorTypes = [
  'Gender',
  'Origin Game',
  'Most Recent Save',
  'EVs (Total)',
  'EV (HP)',
  'EV (Attack)',
  'EV (Defense)',
  'EV (Special Attack)',
  'EV (Special Defense)',
  'EV (Speed)',
  'IVs/DVs (Percent)',
  'Perfect IVs Count',
  'Ribbon Count',
  'Ball',
  'Alpha',
  'Gigantamax',
] as const

export type TopRightIndicatorType = (typeof TopRightIndicatorTypes)[number]
