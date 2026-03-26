import { BackendContext } from '@openhome-ui/backend/backendContext'
import { ConvertStrategy } from '@pkm-rs/pkg'
import { PropsWithChildren, useContext } from 'react'
import { SyncedStateController, useSyncedState } from 'src/ui/state/synced-state'
import { ConversionSettingsContext } from '.'
import SyncedStateProvider from '../synced-state/SyncedStateProvider'

export type NamedStrategy = {
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

function stateReducer(prev: ConvertStrategies, updated: ConvertStrategies): ConvertStrategies {
  return { ...prev, ...updated }
}

function useSyncedConvertState(): SyncedStateController<ConvertStrategies> {
  const backend = useContext(BackendContext)

  const stateGetter = backend.getConvertStrategies
  const stateUpdater = backend.updateConvertStrategies

  return {
    identifier: 'convert_strategies',
    stateGetter,
    stateReducer,
    stateUpdater,
  }
}
