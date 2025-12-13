import { useCallback, useContext, useEffect, useState } from 'react'
import { BackendContext } from 'src/ui/backend/backendContext'

import * as E from 'fp-ts/lib/Either'
import { Pokedex } from 'src/types/pokedex'
import { Errorable } from 'src/types/types'

export type PokedexManager = { getPokedex: () => Promise<Errorable<Pokedex>> } & (
  | {
      loaded: true
      pokedex: Pokedex
    }
  | { loaded: false; pokedex: undefined }
)

export function usePokedex(): PokedexManager {
  const [pokedexCache, setPokedexCache] = useState<Pokedex>()
  const [loading, setLoading] = useState(false)
  const backend = useContext(BackendContext)

  backend.registerListeners({
    onPokedexUpdate: (updatedPokedex) => {
      setPokedexCache(updatedPokedex)
    },
  })

  const loadAndCachePokedex = useCallback(async () => {
    if (pokedexCache) {
      return E.right(pokedexCache)
    }

    const result = await backend.loadPokedex()

    if (E.isRight(result)) {
      setPokedexCache(result.right)
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
