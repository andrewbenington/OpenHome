import { R } from '@openhome-core/util/functional'
import { BackendContext } from '@openhome-ui/backend/backendContext'
import { AppState } from '@openhome-ui/backend/backendInterface'
import { createContext, useContext, useState } from 'react'

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
  const backend = useContext(BackendContext)

  if (!loading && !error && !appState) {
    console.log('[APP_STATE] Calling backend.getState()...')
    setLoading(true)
    backend
      .getState()
      .then(
        R.match(
          (state) => {
            console.log('[APP_STATE] getState() succeeded:', state)
            setAppState(state)
            setLoading(false)
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
  }

  if (!appState) {
    return { error, loaded: false }
  } else {
    return { state: appState, loaded: true }
  }
}
