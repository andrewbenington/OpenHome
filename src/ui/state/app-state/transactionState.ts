import { R } from '@openhome-core/util/functional'
import { BackendContext } from '@openhome-ui/backend/backendContext'
import { AppState as TransactionState } from '@openhome-ui/backend/backendInterface'
import { createContext, useContext, useState } from 'react'

type PossiblyLoadedTransactionState =
  | {
      state: TransactionState
      loaded: true
      error?: undefined
    }
  | {
      state?: undefined
      loaded: false
      error?: string
    }

export const TransactionStateContext = createContext<TransactionState | null>(null)

export function useTransactionState(): TransactionState {
  const appState = useContext(TransactionStateContext)

  // TransactionStateProvider should only render children once state is loaded. If state is not loaded, this was called outside TransactionStateProvider.
  if (!appState) {
    throw new Error('useTransactionState() called outside of TransactionStateProvider')
  }

  return appState
}

export function usePossiblyLoadedTxState(): PossiblyLoadedTransactionState {
  const [transactionState, setTransactionState] = useState<TransactionState>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const backend = useContext(BackendContext)

  if (!loading && !error && !transactionState) {
    setLoading(true)
    backend
      .getState()
      .then(
        R.match(
          (state) => {
            setTransactionState(state)
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
  if (!transactionState) {
    return { error, loaded: false }
  } else {
    return { state: transactionState, loaded: true }
  }
}
