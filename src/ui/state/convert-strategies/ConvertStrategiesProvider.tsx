import useBackend from '@openhome-core/backend/useBackend'
import { ConvertStrategyEntries, NamedStrategy } from '@openhome-core/tauri/spectaCommands'
import { Option } from '@openhome-core/util/functional'
import { filterUndefined } from '@openhome-core/util/sort'
import { SyncedStateController, useSyncedState } from '@openhome-ui/state/synced-state'
import { PropsWithChildren } from 'react'
import { ConversionSettingsContext } from '.'
import SyncedStateProvider from '../synced-state/SyncedStateProvider'

export type ConvertStrategies = {
  strategies_by_id: Partial<Record<string, NamedStrategy>>
  default_strategy_id: string
}

function useConvertStrategiesTauri() {
  return useSyncedState(useSyncedConvertState())
}

export default function ConvertStrategiesProvider({ children }: PropsWithChildren) {
  return (
    <SyncedStateProvider
      useStateManager={useConvertStrategiesTauri}
      StateContext={ConversionSettingsContext}
      stateDescription="OHPKM Store"
    >
      {children}
    </SyncedStateProvider>
  )
}

function stateReducer(
  prev: Option<ConvertStrategies>,
  action: ConvertStrategyEntries
): ConvertStrategies {
  let strategies_by_id = { ...prev?.strategies_by_id }
  action.ids_and_strategies.forEach(([id, strategy]) => {
    strategies_by_id[id] = strategy
  })

  return {
    default_strategy_id: action.default_strategy_id,
    strategies_by_id,
  }
}

function assembleEntries(entries: ConvertStrategyEntries) {
  let strategies_by_id: {
    [x: string]: NamedStrategy
  } = {}
  entries.ids_and_strategies.forEach(([id, strategy]) => {
    strategies_by_id[id] = strategy
  })

  return {
    default_strategy_id: entries.default_strategy_id,
    strategies_by_id,
  }
}

function useSyncedConvertState(): SyncedStateController<
  ConvertStrategies,
  ConvertStrategyEntries,
  ConvertStrategyEntries
> {
  const backend = useBackend()

  const stateGetter = backend.getConvertStrategies
  const stateUpdater = (newState: ConvertStrategies) =>
    backend.updateConvertStrategies({
      ids_and_strategies: Object.entries(newState.strategies_by_id)
        .map(([k, v]) => (v === undefined ? undefined : ([k, v] as [string, NamedStrategy])))
        .filter(filterUndefined),
      default_strategy_id: newState.default_strategy_id,
    })

  return {
    identifier: 'convert_strategies',
    stateGetter,
    stateReducer,
    stateUpdater,
    convertRustState: assembleEntries,
  }
}
