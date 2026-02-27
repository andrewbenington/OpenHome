import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { Errorable, Option, R, Result } from '@openhome-core/util/functional'
import { createContext, useCallback, useContext } from 'react'
import { OhpkmStoreData } from '.'
import { MonFormat, PKMInterface } from '../../../core/pkm/interfaces'
import {
  getMonFileIdentifier,
  getMonGen12Identifier,
  getMonGen345Identifier,
  OhpkmIdentifier,
} from '../../../core/pkm/Lookup'
import { SAV } from '../../../core/save/interfaces'
import { SAVClass } from '../../../core/save/util'
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
  getIdIfTracked: (mon: PKMInterface) => Option<OhpkmIdentifier>
  loadIfTracked: <P extends PKMInterface>(mon: P) => Option<OHPKM>
  monOrOhpkmIfTracked: <P extends PKMInterface>(mon: P) => OHPKM | P
  updateAndConvertForSave: <P extends PKMInterface>(ohpkm: OHPKM, save: SAV<P>) => P
  startTrackingNewMon: <P extends PKMInterface>(
    mon: P,
    sourceSave: Option<SAV<P>>,
    destSave: Option<SAV>
  ) => OHPKM
}

export type OhpkmLookup = (id: string) => OHPKM | undefined

export function useOhpkmStore(): OhpkmStore {
  const [ohpkmStore, updateStore] = useContext(OhpkmStoreContext)
  const { lookups, updateLookups } = useLookups()
  const { gen12: gen12Lookup, gen345: gen345Lookup } = lookups

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
      updateStore({ [mon.openhomeId]: mon })
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

  const handleLookupsUpdate = useCallback(
    (ohpkm: OHPKM, save: SAV) => {
      const lookupType = (save.constructor as SAVClass).lookupType
      const ohpkmIdentifier = ohpkm.openhomeId

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
    },
    [lookups, updateLookups]
  )

  const updateAndConvertForSave = useCallback(
    <P extends PKMInterface>(ohpkm: OHPKM, save: SAV<P>) => {
      handleLookupsUpdate(ohpkm, save)
      insertOrUpdate(ohpkm)

      return save.convertOhpkm(ohpkm)
    },
    [handleLookupsUpdate, insertOrUpdate]
  )

  const startTrackingNewMon = useCallback(
    <P extends PKMInterface>(mon: P, sourceSave: Option<SAV<P>>, destSave: Option<SAV>) => {
      const ohpkm = sourceSave ? OHPKM.fromMonInSave(mon, sourceSave) : new OHPKM(mon)
      if (destSave) {
        handleLookupsUpdate(ohpkm, destSave)
      }

      insertOrUpdate(ohpkm)

      return ohpkm
    },
    [handleLookupsUpdate, insertOrUpdate]
  )

  const loadIfTracked = useCallback(
    (mon: PKMInterface): Option<OHPKM> => {
      const format: MonFormat = mon.format as MonFormat
      switch (format) {
        case 'PK1':
        case 'PK2': {
          const gen12Identifier = getMonGen12Identifier(mon)
          if (!gen12Identifier) {
            throw Error(
              `unable to calculate gen 1/2 identifier for ${mon.nickname} (${mon.format})`
            )
          }

          const homeIdentifier = gen12Lookup[gen12Identifier]
          if (!homeIdentifier) return undefined

          return ohpkmStore[homeIdentifier]
        }
        case 'PK3':
        case 'COLOPKM':
        case 'XDPKM':
        case 'PK3RR':
        case 'PK3UB':
        case 'PK4':
        case 'PK5': {
          const gen345Identifier = getMonGen345Identifier(mon)
          if (!gen345Identifier) {
            throw Error(
              `unable to calculate gen 3/4/5 identifier for ${mon.nickname} (${mon.format})`
            )
          }

          const homeIdentifier = gen345Lookup[gen345Identifier]
          if (!homeIdentifier) return undefined

          return ohpkmStore[homeIdentifier]
        }
        case 'PK6':
        case 'PK7':
        case 'PB7':
        case 'PK8':
        case 'PA8':
        case 'PB8':
        case 'PK9':
        case 'PA9': {
          const homeIdentifier = getMonFileIdentifier(mon)
          if (!homeIdentifier) {
            throw Error(
              `unable to calculate OpenHome identifier for ${mon.nickname} (${mon.format})`
            )
          }

          return ohpkmStore[homeIdentifier]
        }
        default:
          // use type system to enforce exhaustiveness
          const _exhaustiveCheck: never = format
          throw Error(`unrecognized pkm format: ${mon.format}`)
      }
    },
    [gen12Lookup, gen345Lookup, ohpkmStore]
  )

  const monOrOhpkmIfTracked = useCallback(
    <P extends PKMInterface>(mon: P): OHPKM | P => {
      return loadIfTracked(mon) ?? mon
    },
    [loadIfTracked]
  )

  const getIdIfTracked = useCallback(
    (mon: PKMInterface): Option<OhpkmIdentifier> => {
      return loadIfTracked(mon)?.openhomeId
    },
    [loadIfTracked]
  )
  return {
    getById,
    tryLoadFromId,
    tryLoadFromIds,
    byId: ohpkmStore,
    monIsStored,
    insertOrUpdate,
    insertOrUpdateAll,
    getAllStored,
    updateAndConvertForSave,
    startTrackingNewMon,
    getIdIfTracked,
    loadIfTracked,
    monOrOhpkmIfTracked,
  }
}

export type IdentifierNotPresentError = { identifier: OhpkmIdentifier }

function IdentifierNotPresent(identifier: OhpkmIdentifier): IdentifierNotPresentError {
  return { identifier }
}
export const OhpkmStoreContext = createContext<
  [OhpkmStoreData, (updated: OhpkmStoreData) => Promise<Errorable<null>>]
>([{}, async () => R.Err('Uninitialized')])
