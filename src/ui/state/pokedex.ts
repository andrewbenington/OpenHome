import useBackend from '@openhome-core/backend/useBackend'
import { Errorable, R } from '@openhome-core/util/functional'
import { Pokedex } from '@openhome-ui/util/pokedex'
import { useCallback, useEffect, useState } from 'react'

export type PokedexManager = {
  getPokedex: () => Promise<Errorable<Pokedex>>
  populatePokedexFromOhpkms: () => Promise<Errorable<null>>
} & ({ loaded: true; pokedex: Pokedex } | { loaded: false; pokedex: undefined })

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
      setPokedexCache(result.data)
    }

    return result
  }, [backend, pokedexCache])

  useEffect(() => {
    if (!pokedexCache && !loading) {
      setLoading(true)
      loadAndCachePokedex().finally(() => setLoading(false))
    }
  }, [loadAndCachePokedex, loading, pokedexCache])

  const functions = {
    getPokedex: loadAndCachePokedex,
    populatePokedexFromOhpkms: backend.syncPokedex,
  }

  if (pokedexCache) {
    return { pokedex: pokedexCache, loaded: true, ...functions }
  } else {
    return { pokedex: undefined, loaded: false, ...functions }
  }
}

// export const PokedexContext = createContext<PokedexManager>([initialState, () => {}])
