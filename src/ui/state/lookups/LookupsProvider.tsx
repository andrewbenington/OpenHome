import { StoredLookups } from '@openhome-ui/backend/backendInterface'
import { PropsWithChildren, useCallback, useContext } from 'react'
import { RustStateProvider, SyncedStateController, useSyncedState } from 'src/ui/state/synced-state'
import { BackendContext } from '../../backend/backendContext'
import { LookupsContext } from './useLookups'

function useLookupsTauri() {
  return useSyncedState(useSyncedLookupsState())
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

function useSyncedLookupsState(): SyncedStateController<StoredLookups> {
  const backend = useContext(BackendContext)

  const stateUpdater = useCallback(
    (newEntries: StoredLookups) => {
      return backend.addToLookups(newEntries)
    },
    [backend]
  )

  return {
    identifier: 'lookups',
    stateGetter: backend.loadLookups,
    stateReducer,
    stateUpdater,
  }
}
