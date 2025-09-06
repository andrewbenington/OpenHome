import { useCallback, useContext, useEffect, useState } from 'react'
import { BackendContext } from '../backend/backendContext'
import { StoredLookups } from '../backend/backendInterface'

import * as E from 'fp-ts/lib/Either'
import { Errorable } from '../types/types'

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
