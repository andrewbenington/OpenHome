import * as E from 'fp-ts/lib/Either'
import { createContext, useContext, useState } from 'react'
import { BackendContext } from 'src/ui/backend/backendContext'
import { AppState } from 'src/ui/backend/backendInterface'

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
    backend.getState().then(
      E.match(
        (err) => setError(err),
        (state) => {
          setAppState(state)
          setLoading(false)
          setError(undefined)
        }
      )
    )
  }

  if (!appState) {
    return { error, loaded: false }
  } else {
    return { state: appState, loaded: true }
  }
}
