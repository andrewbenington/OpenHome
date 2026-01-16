import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { Errorable, Option, R, Result } from '@openhome-core/util/functional'
import { createContext, useCallback, useContext, useMemo } from 'react'
import { OhpkmStoreData } from '.'
import { PKMInterface } from '../../../core/pkm/interfaces'
import {
  getMonGen12Identifier,
  getMonGen345Identifier,
  OhpkmIdentifier,
} from '../../../core/pkm/Lookup'
import { SAV } from '../../../core/save/interfaces'
import { SAVClass } from '../../../core/save/util'
import { OhpkmTracker } from '../../../tracker'
import { useLookups } from '../lookups'

export type OhpkmStore = {
  getById(id: string): OHPKM | undefined
  tryLoadFromId(id: OhpkmIdentifier): Result<OHPKM, IdentifierNotPresentError>
  tryLoadFromIds(ids: OhpkmIdentifier[]): Result<OHPKM, IdentifierNotPresentError>[]
  byId: OhpkmStoreData
  monIsStored(id: string): boolean
  insertOrUpdate(mon: OHPKM): void
  insertOrUpdateAll(mons: OhpkmStoreData): Promise<Errorable<null>>
  getAllStored: () => OHPKM[]
  tracker: OhpkmTracker
  getIdIfTracked: (mon: PKMInterface) => Option<OhpkmIdentifier>
  loadOhpkmIfTracked: <P extends PKMInterface>(mon: P) => OHPKM | P
  trackAndConvertForSave: <P extends PKMInterface>(ohpkm: OHPKM, save: SAV<P>) => P
  startTracking: <P extends PKMInterface>(mon: P, sourceSave: Option<SAV<P>>) => OHPKM
}

export type OhpkmLookup = (id: string) => OHPKM | undefined

export function useOhpkmStore(): OhpkmStore {
  const [ohpkmStore, updateStore] = useContext(OhpkmStoreContext)
  const { lookups, updateLookups } = useLookups()
  const getById = useCallback(
    (id: string): OHPKM | undefined => {
      return ohpkmStore[id]
    },
    [ohpkmStore]
  )

  const tryLoadFromId = useCallback(
    (id: string): Result<OHPKM, IdentifierNotPresentError> => {
      return R.fromNullable(IdentifierNotPresent(id))(getById(id))
    },
    [getById]
  )

  const tryLoadFromIds = useCallback(
    (ids: OhpkmIdentifier[]): Result<OHPKM, IdentifierNotPresentError>[] => {
      return ids.map(tryLoadFromId)
    },
    [tryLoadFromId]
  )

  const monIsStored = useCallback(
    (id: string): boolean => {
      return id in ohpkmStore
    },
    [ohpkmStore]
  )

  const insertOrUpdate = useCallback(
    (mon: OHPKM) => {
      updateStore({ [mon.getHomeIdentifier()]: mon })
    },
    [updateStore]
  )

  const insertOrUpdateAll = useCallback(
    (mons: OhpkmStoreData) => {
      return updateStore(mons)
    },
    [updateStore]
  )

  const getAllStored = useCallback((): OHPKM[] => {
    return Object.values(ohpkmStore)
  }, [ohpkmStore])

  const tracker = useMemo(() => new OhpkmTracker(ohpkmStore, lookups), [ohpkmStore, lookups])

  const trackAndConvertForSave = useCallback(
    <P extends PKMInterface>(ohpkm: OHPKM, save: SAV<P>) => {
      const lookupType = (save.constructor as SAVClass).lookupType
      const ohpkmIdentifier = ohpkm.getHomeIdentifier()

      if (lookupType === 'gen12') {
        const gen12Identifier = getMonGen12Identifier(ohpkm)
        if (!gen12Identifier) {
          throw Error(`could not build gen 1/2 identifier for mon ${ohpkmIdentifier}`)
        }

        updateLookups({
          ...lookups,
          gen12: { ...lookups.gen12, [gen12Identifier]: ohpkmIdentifier },
        })
      } else if (lookupType === 'gen345') {
        const gen345Identifier = getMonGen345Identifier(ohpkm)
        if (!gen345Identifier) {
          throw Error(`could not build gen 3/4/5 identifier for mon ${ohpkmIdentifier}`)
        }

        updateLookups({
          ...lookups,
          gen345: { ...lookups.gen345, [gen345Identifier]: ohpkmIdentifier },
        })
      }

      insertOrUpdate(ohpkm)

      return save.convertOhpkm(ohpkm)
    },
    [lookups, insertOrUpdate, updateLookups]
  )

  const startTracking = useCallback(
    <P extends PKMInterface>(mon: P, sourceSave: Option<SAV<P>>) => {
      const ohpkm = sourceSave ? OHPKM.fromMonInSave(mon, sourceSave) : new OHPKM(mon)
      insertOrUpdate(ohpkm)
      return ohpkm
    },
    [insertOrUpdate]
  )

  const getIdIfTracked = useCallback(
    (mon: PKMInterface): Option<OhpkmIdentifier> => {
      return tracker.loadIfTracked(mon)?.getHomeIdentifier()
    },
    [tracker]
  )

  const loadOhpkmIfTracked = useCallback(
    <P extends PKMInterface>(mon: P): OHPKM | P => {
      return tracker.loadIfTracked(mon) ?? mon
    },
    [tracker]
  )
  // console.log('tracked mons:', Object.values(ohpkmStore).length)

  return {
    getById,
    tryLoadFromId,
    tryLoadFromIds,
    byId: ohpkmStore,
    monIsStored,
    insertOrUpdate,
    insertOrUpdateAll,
    getAllStored,
    tracker,
    trackAndConvertForSave,
    startTracking,
    getIdIfTracked,
    loadOhpkmIfTracked,
  }
}

export type IdentifierNotPresentError = { identifier: OhpkmIdentifier }

function IdentifierNotPresent(identifier: OhpkmIdentifier): IdentifierNotPresentError {
  return { identifier }
}
export const OhpkmStoreContext = createContext<
  [OhpkmStoreData, (updated: OhpkmStoreData) => Promise<Errorable<null>>]
>([{}, async () => R.Err('Uninitialized')])
