import { Dispatch, useContext } from 'react'
import { Errorable } from '../../types/types'
import { OhpkmStoreAction, OhpkmStoreContext, OhpkmStoreData } from './reducer'

export type OhpkmStoreState = {
  store: OhpkmStoreData
  reloadStore: () => Promise<Errorable<OhpkmStoreData>>
}

export function useOhpkmStore(): [OhpkmStoreState, Dispatch<OhpkmStoreAction>] {
  const [ohpkmStore, ohpkmStoreDispatch, reloadStore] = useContext(OhpkmStoreContext)

  if (ohpkmStore.error) {
    throw new Error(`Error loading OHPKM store: ${ohpkmStore.error}`)
  }

  if (!ohpkmStore.loaded) {
    throw new Error(
      `OHPKM store not loaded. useOhpkmStore() must not be called in a component that is not descended from an OhpkmStoreProvider.`
    )
  }

  return [{ store: ohpkmStore.homeMons, reloadStore }, ohpkmStoreDispatch]
}
