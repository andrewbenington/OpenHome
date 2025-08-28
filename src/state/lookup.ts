import {
  createContext,
  Dispatch,
  Reducer,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { OHPKM } from 'src/types/pkm/OHPKM'
import { BackendContext } from '../backend/backendContext'
import { StoredLookups } from '../backend/backendInterface'

import * as E from 'fp-ts/lib/Either'
import { Errorable } from '../types/types'
export type LookupState = {
  error?: string
} & (
  | {
      homeMons: Record<string, OHPKM>
      loaded: true
    }
  | {
      homeMons?: Record<string, OHPKM>
      loaded: false
    }
)

export type LookupAction =
  | {
      type: 'load_home_mons'
      payload: Record<string, OHPKM>
    }
  | {
      type: 'set_error'
      payload: string | undefined
    }
  | {
      type: 'clear'
      payload?: undefined
    }

export const lookupReducer: Reducer<LookupState, LookupAction> = (
  state: LookupState,
  action: LookupAction
) => {
  const { type, payload } = action

  switch (type) {
    case 'set_error': {
      return {
        ...state,
        error: payload,
      }
    }
    case 'load_home_mons': {
      const homeMons: Record<string, OHPKM> = payload
      const newState: LookupState = { ...state, homeMons, loaded: true }

      return newState
    }
    case 'clear': {
      return { loaded: false }
    }
  }
}

const initialState: LookupState = { loaded: false }

export const LookupContext = createContext<[LookupState, Dispatch<LookupAction>]>([
  initialState,
  () => {},
])

export type LookupHookState = { getLookups: () => Promise<Errorable<StoredLookups>> } & (
  | {
      loaded: true
      lookups: StoredLookups
    }
  | { loaded: false; lookups: undefined }
)

export function useLookups(): LookupHookState {
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
