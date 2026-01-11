import { OHPKM } from '@openhome-core/pkm/OHPKM'
import * as E from 'fp-ts/lib/Either'
import { createContext, useContext } from 'react'
import { OhpkmStoreData } from '.'
import { Errorable } from '../../../core/util/functional'

export type OhpkmStore = {
  getById(id: string): OHPKM | undefined
  byId: OhpkmStoreData
  monIsStored(id: string): boolean
  overwrite(mon: OHPKM): void
  overwriteAll(mons: OhpkmStoreData): Promise<Errorable<null>>
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

  function overwriteAll(mons: OhpkmStoreData) {
    return updateStore(mons)
  }

  function getAllStored(): OHPKM[] {
    return Object.values(ohpkmStore)
  }

  return {
    getById,
    byId: ohpkmStore,
    monIsStored,
    overwrite,
    overwriteAll,
    getAllStored,
  }
}

export const OhpkmStoreContext = createContext<
  [OhpkmStoreData, (updated: OhpkmStoreData) => Promise<Errorable<null>>]
>([{}, async () => E.left('Uninitialized')])
