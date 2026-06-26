import { BackendContext } from '@openhome-core/backend/backendContext'
import { StoredLookups } from '@openhome-core/backend/backendInterface'
import { Option } from '@openhome-core/util/functional'
import {
  RustStateProvider,
  SyncedStateController,
  useSyncedState,
} from '@openhome-ui/state/synced-state'
import { PropsWithChildren, useCallback, useContext } from 'react'
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

function stateReducer(prev: Option<StoredLookups>, updated: StoredLookups): StoredLookups {
  return {
    gen12: { ...prev?.gen12, ...updated.gen12 },
    gen345: { ...prev?.gen345, ...updated.gen345 },
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
