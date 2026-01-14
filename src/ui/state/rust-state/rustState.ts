import { BackendContext } from '@openhome-ui/backend/backendContext'
import { useCallback, useContext, useEffect, useState } from 'react'

import { Errorable, Option, R } from '../../../core/util/functional'
import BackendInterface from '../../backend/backendInterface'

export interface SharedRustState<State, RustState = State> {
  stateGetter: () => Promise<Errorable<State>>
  stateReducer: (prev: State, updated: State) => State
  stateUpdater: (updated: State) => Promise<Errorable<null>>
  onLoaded?: (data: State) => void
  transformRustState?: (payload: RustState) => State
}

export type RustStateManager<State> = {
  updateState: (updated: State) => Promise<Errorable<null>>
} & (
  | { loaded: true; state: State; error: undefined }
  | { loaded: false; state: undefined; error: Option<string> }
)

export function useRustState<State, TauriResponse = State>(
  stateType: string,
  stateGetter: (b: BackendInterface) => Promise<Errorable<State>>,
  stateReducer: (prev: State, updated: State) => State,
  stateUpdater: (b: BackendInterface, updated: State) => Promise<Errorable<null>>,
  onLoaded?: (data: State) => void,
  transformTauriResponse?: (payload: TauriResponse) => State
): RustStateManager<State> {
  const [stateCache, setStateCache] = useState<State>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const backend = useContext(BackendContext)

  const updateState = useCallback(
    async (updated: State) => {
      if (stateCache) setStateCache(stateReducer(stateCache, updated))
      return await stateUpdater(backend, updated)
    },
    [backend, stateCache, stateReducer, stateUpdater]
  )

  useEffect(() => {
    const stopListening = backend.registerListeners({
      onStateUpdate: {
        [stateType]: (updatedState) => {
          const transformedResponse = transformTauriResponse
            ? transformTauriResponse(updatedState as unknown as TauriResponse)
            : (updatedState as unknown as State)
          setStateCache(transformedResponse)
        },
      },
    })

    return () => {
      stopListening()
    }
  }, [backend, stateType, transformTauriResponse])

  const loadAndCacheState = useCallback(async () => {
    stateGetter(backend).then(
      R.match(
        (data) => {
          onLoaded?.(data)
          setStateCache(data)
        },
        (err) => setError(err)
      )
    )
  }, [backend, onLoaded, stateGetter])

  useEffect(() => {
    if (!stateCache && !loading) {
      setLoading(true)
      loadAndCacheState().finally(() => setLoading(false))
    }
  }, [loadAndCacheState, loading, stateCache])

  if (stateCache && error === undefined) {
    return { updateState, state: stateCache, loaded: true, error }
  } else {
    return { updateState, state: undefined, loaded: false, error }
  }
}
