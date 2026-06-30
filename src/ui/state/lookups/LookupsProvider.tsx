import { AppBackend } from '@openhome-ui/backend'
import { StoredLookups } from '@openhome-ui/backend/backendInterface'
import { RustStateProvider, useSyncedState } from '@openhome-ui/state/synced-state'
import { PropsWithChildren } from 'react'
import { LookupsContext } from './useLookups'

function useLookupsTauri() {
  return useSyncedState({
    identifier: 'lookups',
    stateGetter: AppBackend.loadLookups,
    stateReducer,
    stateUpdater: AppBackend.addToLookups,
  })
}

export default function LookupsProvider({ children }: PropsWithChildren) {
  return (
    <RustStateProvider
      useStateManager={useLookupsTauri}
      StateContext={LookupsContext}
      stateDescription="lookups"
      children={children}
    />
  )
}

function stateReducer(prev: StoredLookups, updated: StoredLookups): StoredLookups {
  return {
    gen12: { ...prev.gen12, ...updated.gen12 },
    gen345: { ...prev.gen345, ...updated.gen345 },
  }
}
