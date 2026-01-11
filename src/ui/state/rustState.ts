import { BackendContext } from '@openhome-ui/backend/backendContext'
import { useCallback, useContext, useEffect, useState } from 'react'

import * as E from 'fp-ts/lib/Either'
import { Errorable, Option } from '../../core/util/functional'
import BackendInterface from '../backend/backendInterface'

export type RustStateManager<State> = {
  updateState: (updated: State) => Promise<Errorable<null>>
} & (
  | { loaded: true; state: State; error: undefined }
  | { loaded: false; state: undefined; error: Option<string> }
)

export function useRustState<State>(
  stateType: string,
  stateGetter: (b: BackendInterface) => Promise<Errorable<State>>,
  stateUpdater: (b: BackendInterface, updated: State) => Promise<Errorable<null>>,
  onLoaded?: (data: State) => void
): RustStateManager<State> {
  const [stateCache, setStateCache] = useState<State>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const backend = useContext(BackendContext)

  backend.registerListeners({
    onStateUpdate: {
      [stateType]: (updatedState) => setStateCache(updatedState as unknown as State),
    },
  })

  const loadAndCacheState = useCallback(async () => {
    stateGetter(backend).then(
      E.match(
        (err) => setError(err),
        (data) => {
          onLoaded?.(data)
          setStateCache(data)
        }
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
