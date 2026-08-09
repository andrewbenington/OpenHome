import useBackend from '@openhome-core/backend/useBackend'
import { PKMInterface } from '@openhome-core/pkm/interfaces'
import {
  getMonFileIdentifier,
  getMonGen12Identifier,
  getMonGen345Identifier,
  OhpkmIdentifier,
} from '@openhome-core/pkm/Lookup'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { SAV } from '@openhome-core/save/interfaces'
import { SAVClass } from '@openhome-core/save/util'
import { expectExhaustive } from '@openhome-core/util'
import { $R, Errorable, Option, R, Result } from '@openhome-core/util/functional'
import { Lookup, MarkingsSixShapesColors, ModernRibbon, OriginGames } from '@pkm-rs/pkg/pkm_rs'
import dayjs from 'dayjs'
import { createContext, useCallback, useContext } from 'react'
import { OhpkmStoreData } from '.'
import { useConvertStrategies } from '../convert-strategies'
import { useLookups } from '../lookups'

// FALSE IN PRODUCTION
const FORCE_MISSED_LOOKUP = true

export function useOhpkmStore() {
  const [ohpkmStore, updateStore] = useContext(OhpkmStoreContext)
  const { defaultConvertStrategy } = useConvertStrategies()
  const { lookups, updateLookups } = useLookups()
  const { gen12: gen12Lookup, gen345: gen345Lookup } = lookups
  const backend = useBackend()

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
      updateStore({ [mon.openhomeId]: mon.clone() })
    },
    [updateStore]
  )

  const insertOrUpdateAll = useCallback(
    (mons: OhpkmStoreData) => {
      return updateStore(mons)
    },
    [updateStore]
  )

  const replaceHeldItem = useCallback(
    (mon: OHPKM) => {
      const replacedItem = mon.heldItemIndex
      mon.heldItemIndex = 0
      insertOrUpdate(mon)
      return replacedItem
    },
    [insertOrUpdate]
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
        backend.log('DEBUG', `added ${ohpkm.nickname} to gen 1/2 lookup`, {
          ohpkm_id: ohpkm.openhomeId,
          event: 'lookups_update',
          gen12Identifier,
        })
      } else if (lookupType === 'gen345') {
        // If original generation, keep the original PID
        const isOriginalGen =
          OriginGames.generation(ohpkm.gameOfOrigin) === OriginGames.generation(save.origin)
        const gen345Identifier = getMonGen345Identifier(ohpkm, isOriginalGen)
        if (!gen345Identifier) {
          throw Error(`could not build gen 3/4/5 identifier for mon ${ohpkmIdentifier}`)
        }

        updateLookups({
          ...lookups,
          gen345: { ...lookups.gen345, [gen345Identifier]: ohpkmIdentifier },
        })
        backend.log('DEBUG', `added ${ohpkm.nickname} to gen 3/4/5 lookup`, {
          ohpkm_id: ohpkm.openhomeId,
          event: 'lookups_update',
          gen345Identifier,
        })
      }
    },
    [backend, lookups, updateLookups]
  )

  const updateAndConvertForSave = useCallback(
    <P extends PKMInterface>(ohpkm: OHPKM, save: SAV<P>) => {
      handleLookupsUpdate(ohpkm, save)
      insertOrUpdate(ohpkm)
      handleLookupsUpdate(ohpkm, save)

      return save.convertOhpkm(ohpkm, defaultConvertStrategy)
    },
    [defaultConvertStrategy, handleLookupsUpdate, insertOrUpdate]
  )

  const updateMonMarkings = useCallback(
    (monId: string, markings: MarkingsSixShapesColors) => {
      const result = tryLoadFromId(monId)
      if (R.isErr(result)) return result

      const mon = result.data
      mon.markings = { ...markings }

      insertOrUpdate(mon)
      return R.Ok(mon)
    },
    [insertOrUpdate, tryLoadFromId]
  )

  const updateMonNotes = useCallback(
    (monId: string, notes: string | undefined) => {
      const result = tryLoadFromId(monId)
      if (R.isErr(result)) return result

      const mon = result.data
      mon.notes = notes

      insertOrUpdate(mon)
      return R.Ok(mon)
    },
    [insertOrUpdate, tryLoadFromId]
  )

  const updateMonTags = useCallback(
    (monId: string, tags: { label: string; color: string; icon?: string }[] | undefined) => {
      const result = tryLoadFromId(monId)
      if (R.isErr(result)) return result

      const mon = result.data
      mon.setTags(tags ?? [])

      insertOrUpdate(mon)
      return R.Ok(mon)
    },
    [insertOrUpdate, tryLoadFromId]
  )

  const updateMonDisplayColor = useCallback(
    (monId: string, color: string | undefined) => {
      const result = tryLoadFromId(monId)
      if (R.isErr(result)) return result

      const mon = result.data
      mon.displayColor = color

      insertOrUpdate(mon)
      return R.Ok(mon)
    },
    [insertOrUpdate, tryLoadFromId]
  )

  const updateMonAffixedRibbon = useCallback(
    (monId: string, affixedRibbon: Option<ModernRibbon>) => {
      const result = tryLoadFromId(monId)
      if (R.isErr(result)) return result

      const mon = result.data
      mon.affixedRibbon = affixedRibbon

      insertOrUpdate(mon)
      return R.Ok(mon)
    },
    [insertOrUpdate, tryLoadFromId]
  )

  const setMonNickname = useCallback(
    (monId: string, nickname: Option<string>) => {
      const result = tryLoadFromId(monId)
      if (R.isErr(result)) return result

      const mon = result.data
      mon.nickname = nickname || Lookup.speciesName(mon.nationalDex, mon.language)

      insertOrUpdate(mon)
      return R.Ok(mon)
    },
    [tryLoadFromId, insertOrUpdate]
  )

  const startTrackingNewMon = useCallback(
    <P extends PKMInterface>(mon: P, sourceSave: Option<SAV<P>>, destSave: Option<SAV>) => {
      const ohpkm = sourceSave
        ? OHPKM.fromMonInSave(mon, sourceSave)
        : OHPKM.fromMonUnknownSave(mon)
      ohpkm.startedTrackingTimestamp = dayjs()
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
      if (FORCE_MISSED_LOOKUP) return undefined
      switch (mon.format) {
        case 'OHPKM':
          if (!(mon instanceof OHPKM)) throw Error('Non-OHPKM has OHPKM format')
          return mon
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
          const gen345Identifier = getMonGen345Identifier(mon, true)
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
        case 'PB8LUMI':
        case 'PK9':
        case 'PK9Compass':
        case 'PA9': {
          const homeIdentifier = getMonFileIdentifier(mon)
          if (!homeIdentifier) {
            throw Error(
              `unable to calculate OpenHome identifier for ${mon.nickname} (${mon.format})`
            )
          }

          // because the game of origin may have been changed for legality reasons, we need to ignore the origin when looking up in the store
          const homeIdentifierNoOrigin = homeIdentifier.split('-').slice(0, -1).join('-')

          return Object.entries(ohpkmStore).find(([id, _]) =>
            id.startsWith(homeIdentifierNoOrigin)
          )?.[1]
        }
        default:
          expectExhaustive(mon.format, `unrecognized format: ${mon.format}`)
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

  const syncOhpkmIfTracked = useCallback(
    (ohpkmId: OhpkmIdentifier, mon: PKMInterface, save?: SAV) => {
      return $R(tryLoadFromId(ohpkmId)).map((trackedData) => {
        const updates = trackedData.syncWithGameData(mon, save)

        if (updates.length > 0) {
          backend.log('DEBUG', `synced ${mon.nickname} with game data`, {
            ohpkm_id: trackedData.openhomeId,
            event: 'game_data_sync',
            updates,
          })
        }

        return trackedData
      })
    },
    [backend, tryLoadFromId]
  )

  return {
    getById,
    tryLoadFromId,
    tryLoadFromIds,
    byId: ohpkmStore,
    monIsStored,
    insertOrUpdate,
    insertOrUpdateAll,

    updateMonMarkings,
    updateMonNotes,
    updateMonTags,
    updateMonAffixedRibbon,
    updateMonDisplayColor,
    setMonNickname,

    getAllStored,
    updateAndConvertForSave,
    startTrackingNewMon,
    getIdIfTracked,
    loadIfTracked,
    monOrOhpkmIfTracked,
    syncOhpkmIfTracked,

    replaceHeldItem,
  }
}

export type OhpkmStore = ReturnType<typeof useOhpkmStore>
export type IdentifierNotPresentError = { identifier: OhpkmIdentifier }

function IdentifierNotPresent(identifier: OhpkmIdentifier): IdentifierNotPresentError {
  return { identifier }
}
export const OhpkmStoreContext = createContext<
  [OhpkmStoreData, (updated: OhpkmStoreData) => Promise<Errorable<null>>]
>([{}, async () => R.Err('Uninitialized')])
