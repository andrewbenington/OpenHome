import { StoredLookups } from '@openhome-core/backend/backendInterface'
import useBackend from '@openhome-core/backend/useBackend'
import { Option } from '@openhome-core/util/functional'

import { PropsWithChildren, useCallback } from 'react'
import { LookupsContext } from './useLookups'
import { OhpkmWrapper } from '@openhome-ui/state/convert-strategies/OhpkmWrapper.tsx'

function useLookupsTauri() {
  const backend = useBackend()

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

export default function LookupsProvider({ children }: PropsWithChildren) {
  return (
    <OhpkmWrapper
      useStateManager={{
        identifier: 'lookups',
      }}
      stateContext={LookupsContext}
      description="lookups"
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
