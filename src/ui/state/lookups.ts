import { BackendContext } from '@openhome-ui/backend/backendContext'
import { StoredLookups } from '@openhome-ui/backend/backendInterface'
import { useCallback, useContext, useEffect, useState } from 'react'

import { Errorable, R } from '@openhome-core/util/functional'

export type LookupsManager = { getLookups: () => Promise<Errorable<StoredLookups>> } & (
  | {
      loaded: true
      lookups: StoredLookups
    }
  | { loaded: false; lookups: undefined }
)

export function useLookups(): LookupsManager {
  const [lookupsCache, setLookupsCache] = useState<StoredLookups>()
  const [loading, setLoading] = useState(false)
  const backend = useContext(BackendContext)

  backend.registerListeners({
    onLookupsUpdate: (updatedLookups) => setLookupsCache(updatedLookups),
  })

  const loadAndCacheLookups = useCallback(async () => {
    if (lookupsCache) {
      return R.Ok<typeof lookupsCache, string>(lookupsCache)
    }

    const result = await backend.loadLookups()
    if (R.isOk(result)) {
      setLookupsCache(result.value)
    }

    return result
  }, [backend, lookupsCache])

  useEffect(() => {
    if (!lookupsCache && !loading) {
      setLoading(true)
      loadAndCacheLookups().finally(() => setLoading(false))
    }
  }, [loadAndCacheLookups, loading, lookupsCache])

  if (lookupsCache) {
    return { getLookups: loadAndCacheLookups, lookups: lookupsCache, loaded: true }
  } else {
    return { getLookups: loadAndCacheLookups, lookups: undefined, loaded: false }
  }
}

// export const LookupsContext = createContext<LookupsManager>([initialState, () => {}])
