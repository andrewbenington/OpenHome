import { BackendContext } from '@openhome-ui/backend/backendContext'
import { useCallback, useContext, useEffect, useState } from 'react'

import { Errorable, Option, R } from '../../../core/util/functional'

type StateConverter<State, RustState> = [State] extends [RustState]
  ? { convertRustState?: undefined } // rust state is the same type as typescript state
  : {
      convertRustState: (payload: RustState) => State
    }

export type SyncedStateController<State, RustState = State> = {
  identifier: string
  stateGetter: () => Promise<Errorable<State>>
  stateReducer: (prev: State, updated: State) => State
  stateUpdater: (updated: State) => Promise<Errorable<null>>
  onLoaded?: (data: State) => void
} & StateConverter<State, RustState>

export type RustStateManager<State> = {
  updateState: (updated: State) => Promise<Errorable<null>>
} & (
  | { loaded: true; state: State; error: undefined }
  | { loaded: false; state: undefined; error: Option<string> }
)

export function useSyncedState<State, RustState = State>(
  controller: SyncedStateController<State, RustState>
): RustStateManager<State> {
  const [stateCache, setStateCache] = useState<State>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const backend = useContext(BackendContext)

  const { identifier, stateGetter, stateReducer, stateUpdater, convertRustState, onLoaded } =
    controller

  const updateState = useCallback(
    async (updated: State) => {
      if (stateCache) setStateCache(stateReducer(stateCache, updated))
      return await stateUpdater(updated)
    },
    [stateCache, stateReducer, stateUpdater]
  )

  useEffect(() => {
    const stopListening = backend.registerListeners({
      onStateUpdate: {
        [identifier]: (updatedState) => {
          const transformedResponse = convertRustState
            ? convertRustState(updatedState as unknown as RustState)
            : (updatedState as unknown as State)
          setStateCache(transformedResponse)
        },
      },
    })

    return () => {
      stopListening()
    }
  }, [backend, convertRustState, identifier])

  const loadAndCacheState = useCallback(async () => {
    stateGetter().then(
      R.match(
        (data) => {
          onLoaded?.(data)
          setStateCache(data)
        },
        (err) => setError(err)
      )
    )
  }, [stateGetter, onLoaded])

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
