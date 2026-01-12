import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { Errorable, R, Result } from '@openhome-core/util/functional'
import { createContext, useContext } from 'react'
import { OhpkmStoreData } from '.'
import { PKMInterface } from '../../../core/pkm/interfaces'
import { OhpkmIdentifier } from '../../../core/pkm/Lookup'
import { isTracked, MaybeTracked, OhpkmTracker } from '../../../tracker'
import { useLookups } from '../lookups'

export type OhpkmStore = {
  getById(id: string): OHPKM | undefined
  loadOhpkmIfTracked<P extends PKMInterface>(
    maybeTracked: MaybeTracked<P> | undefined
  ): OHPKM | P | undefined
  tryLoadFromId(id: OhpkmIdentifier): Result<OHPKM, IdentifierNotPresentError>
  tryLoadFromIds(ids: OhpkmIdentifier[]): Result<OHPKM, IdentifierNotPresentError>[]
  byId: OhpkmStoreData
  monIsStored(id: string): boolean
  overwrite(mon: OHPKM): void
  overwriteAll(mons: OhpkmStoreData): Promise<Errorable<null>>
  getAllStored: () => OHPKM[]
  tracker: OhpkmTracker
}

export type OhpkmLookup = (id: string) => OHPKM | undefined

export function useOhpkmStore(): OhpkmStore {
  const [ohpkmStore, updateStore] = useContext(OhpkmStoreContext)
  const { lookups } = useLookups()

  function getById(id: string): OHPKM | undefined {
    return ohpkmStore[id]
  }

  function loadOhpkmIfTracked<P extends PKMInterface>(
    maybeTracked: MaybeTracked<P> | undefined
  ): OHPKM | P | undefined {
    if (!maybeTracked) return undefined
    if (!isTracked(maybeTracked)) return maybeTracked.data
    return getById(maybeTracked.identifier) ?? maybeTracked.data
  }

  function tryLoadFromId(id: string): Result<OHPKM, IdentifierNotPresentError> {
    return R.fromNullable(IdentifierNotPresent(id))(getById(id))
  }

  function tryLoadFromIds(ids: OhpkmIdentifier[]): Result<OHPKM, IdentifierNotPresentError>[] {
    return ids.map(tryLoadFromId)
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

  const tracker = new OhpkmTracker(ohpkmStore, lookups)

  return {
    getById,
    loadOhpkmIfTracked,
    tryLoadFromId,
    tryLoadFromIds,
    byId: ohpkmStore,
    monIsStored,
    overwrite,
    overwriteAll,
    getAllStored,
    tracker,
  }
}

export type IdentifierNotPresentError = { identifier: OhpkmIdentifier }

function IdentifierNotPresent(identifier: OhpkmIdentifier): IdentifierNotPresentError {
  return { identifier }
}
export const OhpkmStoreContext = createContext<
  [OhpkmStoreData, (updated: OhpkmStoreData) => Promise<Errorable<null>>]
>([{}, async () => R.Err('Uninitialized')])
