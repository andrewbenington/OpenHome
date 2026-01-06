import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { Errorable, R } from '@openhome-core/util/functional'
import { createContext, Dispatch, Reducer } from 'react'
import { StoredLookups } from '../../backend/backendInterface'

export type OhpkmStoreData = Record<string, OHPKM>

export type OhpkmStoreStateInternal = {
  error?: string
} & (
  | {
      homeMons: OhpkmStoreData
      lookups: StoredLookups
      saving: boolean
      loaded: true
    }
  | {
      homeMons?: OhpkmStoreData
      lookups?: StoredLookups
      saving: false
      loaded: false
    }
)

export type OhpkmStoreAction =
  | {
      type: 'load_persisted_pkm_data'
      payload: OhpkmStoreData
    }
  | {
      type: 'load_lookups'
      payload: StoredLookups
    }
  | {
      type: 'set_error'
      payload: string | undefined
    }
  | {
      type: 'set_saving'
      payload?: undefined
    }
  | {
      type: 'persist_data'
      payload: OHPKM
    }

export const ohpkmStoreReducer: Reducer<OhpkmStoreStateInternal, OhpkmStoreAction> = (
  state: OhpkmStoreStateInternal,
  action: OhpkmStoreAction
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
      let newState: OhpkmStoreStateInternal
      if (state.lookups) {
        newState = {
          ...state,
          homeMons,
          loaded: true,
          saving: false,
          lookups: state.lookups,
        }
      } else {
        newState = {
          ...state,
          homeMons,
          loaded: false,
          saving: false,
        }
      }

      return newState
    }
    case 'load_lookups': {
      const lookups = payload
      let newState: OhpkmStoreStateInternal
      if (state.homeMons) {
        newState = {
          ...state,
          lookups,
          loaded: true,
          saving: false,
          homeMons: state.homeMons,
        }
      } else {
        newState = {
          ...state,
          lookups,
          loaded: false,
          saving: false,
        }
      }

      return newState
    }
    case 'persist_data': {
      if (!state.loaded) return state
      const mon = payload

      return { ...state, homeMons: { ...state.homeMons, [mon.getHomeIdentifier()]: mon } }
    }
    case 'set_saving': {
      if (!state.loaded) return { ...state }
      return { ...state, saving: true }
    }
  }
}

const initialState: OhpkmStoreStateInternal = { loaded: false, saving: false }

export const OhpkmStoreContext = createContext<
  [OhpkmStoreStateInternal, Dispatch<OhpkmStoreAction>, () => Promise<Errorable<OhpkmStoreData>>]
>([initialState, () => {}, async () => R.Err('Uninitialized')])
