import { OHPKM } from '@openhome-core/pkm/OHPKM'
import * as E from 'fp-ts/lib/Either'
import { createContext, Dispatch, Reducer } from 'react'
import { Errorable } from 'src/core/util/functional'

export type OhpkmStoreData = Record<string, OHPKM>

export type OhpkmStoreStateInternal = {
  error?: string
} & (
  | {
      homeMons: OhpkmStoreData
      saving: boolean
      loaded: true
    }
  | {
      homeMons?: OhpkmStoreData
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
      const newState: OhpkmStoreStateInternal = { ...state, homeMons, loaded: true, saving: false }

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
>([initialState, () => {}, async () => E.left('Uninitialized')])
