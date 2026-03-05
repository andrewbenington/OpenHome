import { createContext } from 'react'
import { create, StateCreator, StoreApi, UseBoundStore } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { OhpkmIdentifier } from '../../../core/pkm/Lookup'
import { OHPKM } from '../../../core/pkm/OHPKM'
import { Option, R, Result } from '../../../core/util/functional'
import { OhpkmStoreData } from '../../state/ohpkm'
import { IdentifierNotPresent, IdentifierNotPresentError } from '../../state/ohpkm/useOhpkmStore'

export const OPENHOME_BOX_ROWS = 10
export const OPENHOME_BOX_COLUMNS = 12
export const OPENHOME_BOX_SLOTS = OPENHOME_BOX_COLUMNS * OPENHOME_BOX_ROWS

// export type OhpkmBytesByIdentifier = Record<string, Uint8Array>
// export type OhpkmB64BytesByIdentifier = Record<string, string>

export interface OhpkmStoreState {
  reloadStore: () => Promise<void>

  store: OhpkmStoreData

  getById: (id: OhpkmIdentifier) => Option<OHPKM>
  tryLoadFromId: (id: OhpkmIdentifier) => Result<OHPKM, IdentifierNotPresentError>
  tryLoadFromIds: (id: OhpkmIdentifier[]) => Result<OHPKM, IdentifierNotPresentError>[]
}

export const createOhpkmStoreStore = (stored: OhpkmStoreData, reloadStored: () => Promise<void>) =>
  create<OhpkmStoreState>()(
    immer<OhpkmStoreState>((set, readonlyState) => {
      return {
        store: stored,
        reloadStore: reloadStored,

        getById: (id: OhpkmIdentifier): Option<OHPKM> => {
          return readonlyState().store[id]
        },

        tryLoadFromId: (id: string): Result<OHPKM, IdentifierNotPresentError> => {
          return R.fromNullable(IdentifierNotPresent(id))(readonlyState().getById(id))
        },

        tryLoadFromIds: (ids: OhpkmIdentifier[]): Result<OHPKM, IdentifierNotPresentError>[] => {
          return ids.map(readonlyState().tryLoadFromId)
        },

        insertOrUpdate: (mon: OHPKM) => {
          set({ store: { [mon.openhomeId]: mon } })
        },
      }
    }) as StateCreator<OhpkmStoreState, [], []>
  )

type OhpkmStore = ReturnType<typeof createOhpkmStoreStore>

export const OhpkmStoreContext = createContext<OhpkmStore | null>(null)

type WithSelectors<S> = S extends { getState: () => infer T }
  ? S & { use: { [K in keyof T]: () => T[K] } }
  : never

const createSelectors = <S extends UseBoundStore<StoreApi<object>>>(_store: S) => {
  const store = _store as WithSelectors<typeof _store>
  store.use = {}
  for (const k of Object.keys(store.getState())) {
    ;(store.use as any)[k] = () => store((s) => s[k as keyof typeof s])
  }

  return store
}
