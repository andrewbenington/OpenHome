import { createContext, Dispatch, Reducer } from 'react'
import { OHPKM } from 'src/types/pkm/OHPKM'

export type PersistedPkmDataState = {
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

export type PersistedPkmDataAction =
  | {
      type: 'load_persisted_pkm_data'
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

export const persistedPkmDataReducer: Reducer<PersistedPkmDataState, PersistedPkmDataAction> = (
  state: PersistedPkmDataState,
  action: PersistedPkmDataAction
) => {
  const { type, payload } = action

  switch (type) {
    case 'set_error': {
      return {
        ...state,
        error: payload,
      }
    }
    case 'load_persisted_pkm_data': {
      const homeMons: Record<string, OHPKM> = payload
      const newState: PersistedPkmDataState = { ...state, homeMons, loaded: true }

      return newState
    }
    case 'clear': {
      return { loaded: false }
    }
  }
}

const initialState: PersistedPkmDataState = { loaded: false }

export const PersistedPkmDataContext = createContext<
  [PersistedPkmDataState, Dispatch<PersistedPkmDataAction>]
>([initialState, () => {}])
