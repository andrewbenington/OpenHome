import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { Errorable } from '@openhome-core/util/functional'
import * as E from 'fp-ts/Either'
import { useContext } from 'react'
import { OhpkmIdentifier } from '../../../core/pkm/Lookup'
import { OhpkmStoreContext } from './reducer'

export type OhpkmStore = {
  reloadStore: () => Promise<Errorable<OhpkmLookup>>
  getById(id: string): OHPKM | undefined
  tryLoadFromId(id: OhpkmIdentifier): E.Either<IdentifierNotPresentError, OHPKM>
  tryLoadFromIds(ids: OhpkmIdentifier[]): E.Either<IdentifierNotPresentError, OHPKM>[]
  monIsStored(id: string): boolean
  overwrite(mon: OHPKM): void
  getAllStored: () => OHPKM[]
  setSaving(): void
}

export type OhpkmLookup = (id: string) => OHPKM | undefined

export function useOhpkmStore(): OhpkmStore {
  const [ohpkmStore, ohpkmStoreDispatch, reloadStore] = useContext(OhpkmStoreContext)

  if (ohpkmStore.error) {
    throw new Error(`Error loading OHPKM store: ${ohpkmStore.error}`)
  }

  if (!ohpkmStore.loaded) {
    throw new Error(
      `OHPKM store not loaded. useOhpkmStore() must not be called in a component that is not descended from an OhpkmStoreProvider.`
    )
  }

  const monsById = ohpkmStore.homeMons

  function getById(id: string): OHPKM | undefined {
    return monsById[id]
  }

  function tryLoadFromId(id: string): E.Either<IdentifierNotPresentError, OHPKM> {
    return E.fromNullable(IdentifierNotPresent(id))(monsById[id])
  }

  function tryLoadFromIds(ids: OhpkmIdentifier[]): E.Either<IdentifierNotPresentError, OHPKM>[] {
    return ids.map(tryLoadFromId)
  }

  function monIsStored(id: string): boolean {
    return id in monsById
  }

  function overwrite(mon: OHPKM) {
    ohpkmStoreDispatch({ type: 'persist_data', payload: mon })
  }

  function getAllStored(): OHPKM[] {
    return Object.values(monsById)
  }

  function setSaving() {
    ohpkmStoreDispatch({ type: 'set_saving' })
  }

  async function reloadAndReturnLookup() {
    return reloadStore().then(
      E.map((newLookup) => {
        return (id: string) => newLookup[id]
      })
    )
  }

  return {
    reloadStore: reloadAndReturnLookup,
    getById,
    tryLoadFromId,
    tryLoadFromIds,
    monIsStored,
    overwrite,
    getAllStored,
    setSaving,
  }
}

type IdentifierNotPresentError = { identifier: OhpkmIdentifier }

function IdentifierNotPresent(identifier: OhpkmIdentifier): IdentifierNotPresentError {
  return { identifier }
}
