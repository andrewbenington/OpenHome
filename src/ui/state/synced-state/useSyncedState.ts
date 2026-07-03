import useBackend from '@openhome-core/backend/useBackend'
import { Errorable, Option, R } from '@openhome-core/util/functional'
import { useCallback, useEffect, useState } from 'react'

type StateConverter<State, RustState> = [State] extends [RustState]
  ? { convertRustState?: undefined } // rust state is the same type as typescript state
  : {
      convertRustState: (payload: RustState) => State
    }

export type SyncedStateController<State, Action = State, RustState = State> = {
  identifier: string
  stateGetter: () => Promise<Errorable<State>>
  stateReducer: (prev: Option<State>, action: Action) => State
  stateUpdater: (updated: State) => Promise<Errorable<null>>
  onLoaded?: (data: State) => void
} & StateConverter<State, RustState>

export type RustStateManager<State, Action = State> = {
  updateState: (action: Action) => Promise<Errorable<null>>
} & (
  | { loaded: true; state: State; error: undefined }
  | { loaded: false; state: undefined; error: Option<string> }
)

export function useSyncedState<State, Action = State, RustState = State>(
  controller: SyncedStateController<State, Action, RustState>
): RustStateManager<State, Action> {
  const [stateCache, setStateCache] = useState<State>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const backend = useBackend()

  const { identifier, stateGetter, stateReducer, stateUpdater, convertRustState, onLoaded } =
    controller

  const updateState = useCallback(
    async (action: Action) => {
      const updatedState = stateReducer(stateCache, action)
      setStateCache(updatedState)
      return await stateUpdater(updatedState)
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
    stateGetter()
      .then(
        R.match(
          (data) => {
            onLoaded?.(data)
            setStateCache(data)
          },
          (err) => {
            console.error(`[SYNCED_STATE:${identifier}] stateGetter() error:`, err)
            setError(err)
          }
        )
      )
      .catch((e) => {
        console.error(`[SYNCED_STATE:${identifier}] stateGetter() unhandled rejection:`, e)
        setError(String(e))
      })
  }, [stateGetter, onLoaded, identifier])

  useEffect(() => {
    if (!stateCache && !loading) {
      setLoading(true)
      loadAndCacheState().finally(() => {
        setLoading(false)
      })
    }
  }, [loadAndCacheState, loading, stateCache, identifier])

  if (stateCache && error === undefined) {
    return { updateState, state: stateCache, loaded: true, error }
  } else {
    return { updateState, state: undefined, loaded: false, error }
  }
}
