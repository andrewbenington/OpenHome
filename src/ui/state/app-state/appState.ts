import { AppState } from '@openhome-core/backend/backendInterface'
import useBackend from '@openhome-core/backend/useBackend'
import { R } from '@openhome-core/util/functional'
import { createContext, useContext, useEffect, useState } from 'react'

type PossiblyLoadedAppState =
  | {
      state: AppState
      loaded: true
      error?: undefined
    }
  | {
      state?: undefined
      loaded: false
      error?: string
    }

export const AppStateContext = createContext<AppState | null>(null)

export function useAppState(): AppState {
  const appState = useContext(AppStateContext)

  // AppStateProvider should only render children once state is loaded. If state is not loaded, this was called outside AppStateProvider.
  if (!appState) {
    throw new Error('useAppState() called outside of AppStateProvider')
  }

  return appState
}

export function usePossiblyLoadedAppState(): PossiblyLoadedAppState {
  const [appState, setAppState] = useState<AppState>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const backend = useBackend()

  useEffect(() => {
    if (loading || error || appState) return

    setLoading(true)
    backend
      .getState()
      .then(
        R.match(
          (state) => {
            setAppState(state)
            setError(undefined)
          },
          (err) => {
            console.error('[APP_STATE] getState() error:', err)
            setError(err)
          }
        )
      )
      .catch((e) => {
        console.error('[APP_STATE] getState() unhandled rejection:', e)
        setError(String(e))
      })
      .finally(() => {
        setLoading(false)
      })
  }, [backend, error, loading, appState])

  if (!appState) {
    return { error, loaded: false }
  } else {
    return { state: appState, loaded: true }
  }
}
