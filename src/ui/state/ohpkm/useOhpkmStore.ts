import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { Errorable, R, Result } from '@openhome-core/util/functional'
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
import { isTracked, MaybeTracked, OhpkmTracker, tracked } from '../../../tracker'
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
  moveToSave: <P extends PKMInterface>(ohpkm: OHPKM, save: SAV<P>) => MaybeTracked<P>
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

  const loadOhpkmIfTracked = useCallback(
    <P extends PKMInterface>(maybeTracked: MaybeTracked<P> | undefined): OHPKM | P | undefined => {
      if (!maybeTracked) return undefined
      if (!isTracked(maybeTracked)) return maybeTracked.data
      return getById(maybeTracked.identifier) ?? maybeTracked.data
    },
    [getById]
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

  const overwrite = useCallback(
    (mon: OHPKM) => {
      console.log(`registering ${mon.nickname}: ${mon.getHomeIdentifier()}`)
      updateStore({ [mon.getHomeIdentifier()]: mon })
    },
    [updateStore]
  )

  const overwriteAll = useCallback(
    (mons: OhpkmStoreData) => {
      return updateStore(mons)
    },
    [updateStore]
  )

  const getAllStored = useCallback((): OHPKM[] => {
    return Object.values(ohpkmStore)
  }, [ohpkmStore])

  const tracker = useMemo(() => new OhpkmTracker(ohpkmStore, lookups), [ohpkmStore, lookups])

  const moveToSave = useCallback(
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

      overwrite(ohpkm)

      return tracked(save.convertOhpkm(ohpkm), ohpkmIdentifier)
    },
    [lookups, overwrite, updateLookups]
  )

  // console.log('tracked mons:', Object.values(ohpkmStore).length)

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
    moveToSave,
  }
}

export type IdentifierNotPresentError = { identifier: OhpkmIdentifier }

function IdentifierNotPresent(identifier: OhpkmIdentifier): IdentifierNotPresentError {
  return { identifier }
}
export const OhpkmStoreContext = createContext<
  [OhpkmStoreData, (updated: OhpkmStoreData) => Promise<Errorable<null>>]
>([{}, async () => R.Err('Uninitialized')])
