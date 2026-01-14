import { StoredLookups } from '@openhome-ui/backend/backendInterface'
import { RustStateProvider, useRustState } from '@openhome-ui/state/rust-state'
import { PropsWithChildren } from 'react'
import { LookupsContext } from './useLookups'

function useLookupsTauri() {
  return useRustState<StoredLookups>(
    'lookups',
    (backend) => backend.loadLookups(),
    (prev, updated) => ({
      gen12: { ...prev.gen12, ...updated.gen12 },
      gen345: { ...prev.gen345, ...updated.gen345 },
    }),
    (backend, updated) => backend.updateLookups(updated.gen12, updated.gen345)
  )
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
