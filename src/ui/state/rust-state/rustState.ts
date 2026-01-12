import { BackendContext } from '@openhome-ui/backend/backendContext'
import { useCallback, useContext, useEffect, useState } from 'react'

import { Errorable, Option, R } from '../../../core/util/functional'
import BackendInterface from '../../backend/backendInterface'

export type RustStateManager<State> = {
  updateState: (updated: State) => Promise<Errorable<null>>
} & (
  | { loaded: true; state: State; error: undefined }
  | { loaded: false; state: undefined; error: Option<string> }
)

export function useRustState<State, TauriResponse = State>(
  stateType: string,
  stateGetter: (b: BackendInterface) => Promise<Errorable<State>>,
  stateUpdater: (b: BackendInterface, updated: State) => Promise<Errorable<null>>,
  onLoaded?: (data: State) => void,
  transformTauriResponse?: (payload: TauriResponse) => State
): RustStateManager<State> {
  const [stateCache, setStateCache] = useState<State>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const backend = useContext(BackendContext)

  backend.registerListeners({
    onStateUpdate: {
      [stateType]: (updatedState) => {
        console.log(`received state update for ${stateType}`)
        const transformedResponse = transformTauriResponse
          ? transformTauriResponse(updatedState as unknown as TauriResponse)
          : (updateState as unknown as State)
        setStateCache(transformedResponse)
      },
    },
  })

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

  const updateState = useCallback(
    async (updated: State) => {
      return await stateUpdater(backend, updated)
    },
    [backend, stateUpdater]
  )

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
