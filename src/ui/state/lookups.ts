import { BackendContext } from '@openhome-ui/backend/backendContext'
import { StoredLookups } from '@openhome-ui/backend/backendInterface'
import { useCallback, useContext, useEffect, useState } from 'react'

import { Errorable } from '@openhome-core/util/functional'
import * as E from 'fp-ts/lib/Either'

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
    onStateUpdate: { lookups: (updatedLookups) => console.log('new lookups V2:', updatedLookups) },
  })

  const loadAndCacheLookups = useCallback(async () => {
    if (lookupsCache) {
      return E.right(lookupsCache)
    }

    const result = await backend.loadLookups()

    if (E.isRight(result)) {
      setLookupsCache(result.right)
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
