import useBackend from '@openhome-core/backend/useBackend'
import { Option } from '@openhome-core/util/functional'
import { SyncedStateController, useSyncedState } from '@openhome-ui/state/synced-state'
import { ConvertStrategy } from '@pkm-rs/pkg'
import { PropsWithChildren } from 'react'
import { ConversionSettingsContext } from '.'
import SyncedStateProvider from '../synced-state/SyncedStateProvider'

type NamedStrategy = {
  name: string
  strategy: ConvertStrategy
}

export type ConvertStrategies = {
  strategies_by_id: Record<string, NamedStrategy>
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
  updated: ConvertStrategies
): ConvertStrategies {
  return { ...prev, ...updated }
}

function useSyncedConvertState(): SyncedStateController<ConvertStrategies> {
  const backend = useBackend()

  const stateGetter = backend.getConvertStrategies
  const stateUpdater = backend.updateConvertStrategies

  return {
    identifier: 'convert_strategies',
    stateGetter,
    stateReducer,
    stateUpdater,
  }
}
