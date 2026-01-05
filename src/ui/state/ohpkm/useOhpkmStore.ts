import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { Errorable, R, Result } from '@openhome-core/util/functional'
import { useContext } from 'react'
import { OhpkmIdentifier } from '../../../core/pkm/Lookup'
import { OhpkmStoreContext } from './reducer'

export type OhpkmStore = {
  reloadStore: () => Promise<Errorable<OhpkmLookup>>
  getById(id: string): OHPKM | undefined
  tryLoadFromId(id: OhpkmIdentifier): Result<OHPKM, IdentifierNotPresentError>
  tryLoadFromIds(ids: OhpkmIdentifier[]): Result<OHPKM, IdentifierNotPresentError>[]
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

  function tryLoadFromId(id: string): Result<OHPKM, IdentifierNotPresentError> {
    return R.fromNullable(IdentifierNotPresent(id))(getById(id))
  }

  function tryLoadFromIds(ids: OhpkmIdentifier[]): Result<OHPKM, IdentifierNotPresentError>[] {
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
      R.map((newLookup) => {
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
