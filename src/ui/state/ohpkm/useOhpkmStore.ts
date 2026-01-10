import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { useContext } from 'react'
import { OhpkmStoreContext } from './reducer'

export type OhpkmStore = {
  getById(id: string): OHPKM | undefined
  monIsStored(id: string): boolean
  overwrite(mon: OHPKM): void
  getAllStored: () => OHPKM[]
}

export type OhpkmLookup = (id: string) => OHPKM | undefined

export function useOhpkmStore(): OhpkmStore {
  const [ohpkmStore, updateStore] = useContext(OhpkmStoreContext)

  function getById(id: string): OHPKM | undefined {
    return ohpkmStore[id]
  }

  function monIsStored(id: string): boolean {
    return id in ohpkmStore
  }

  function overwrite(mon: OHPKM) {
    updateStore({ [mon.getHomeIdentifier()]: mon })
  }

  function getAllStored(): OHPKM[] {
    return Object.values(ohpkmStore)
  }

  return {
    getById,
    monIsStored,
    overwrite,
    getAllStored,
  }
}
