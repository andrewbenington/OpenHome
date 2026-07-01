import { Errorable, R } from '@openhome-core/util/functional'
import useBackend from '@openhome-ui/backend/useBackend'
import { Pokedex } from '@openhome-ui/util/pokedex'
import { useCallback, useEffect, useState } from 'react'

export type PokedexManager = { getPokedex: () => Promise<Errorable<Pokedex>> } & (
  { loaded: true; pokedex: Pokedex } | { loaded: false; pokedex: undefined }
)

export function usePokedex(): PokedexManager {
  const [pokedexCache, setPokedexCache] = useState<Pokedex>()
  const [loading, setLoading] = useState(false)
  const backend = useBackend()

  backend.registerListeners({
    onPokedexUpdate: setPokedexCache,
  })

  const loadAndCachePokedex = useCallback(async () => {
    if (pokedexCache) {
      return R.Ok<Pokedex, string>(pokedexCache)
    }

    const result = await backend.loadPokedex()

    if (R.isOk(result)) {
      setPokedexCache(result.value)
    }

    return result
  }, [backend, pokedexCache])

  useEffect(() => {
    if (!pokedexCache && !loading) {
      setLoading(true)
      loadAndCachePokedex().finally(() => setLoading(false))
    }
  }, [loadAndCachePokedex, loading, pokedexCache])

  if (pokedexCache) {
    return { getPokedex: loadAndCachePokedex, pokedex: pokedexCache, loaded: true }
  } else {
    return { getPokedex: loadAndCachePokedex, pokedex: undefined, loaded: false }
  }
}

// export const PokedexContext = createContext<PokedexManager>([initialState, () => {}])
