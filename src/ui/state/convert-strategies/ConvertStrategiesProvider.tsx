import { AppBackend } from '@openhome-ui/backend'
import { useSyncedState } from '@openhome-ui/state/synced-state'
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
  return useSyncedState({
    identifier: 'convert_strategies',
    stateGetter: AppBackend.getConvertStrategies,
    stateReducer,
    stateUpdater: AppBackend.updateConvertStrategies,
  })
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
