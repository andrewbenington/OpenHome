import useBackend from '@openhome-core/backend/useBackend'
import { getMoveMaxPP } from '@openhome-core/pkm'
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
import { FourMoves } from '@openhome-core/util/types'
import { Lookup, MarkingsSixShapesColors, ModernRibbon, OriginGames } from '@pkm-rs/pkg/pkm_rs'
import dayjs from 'dayjs'
import { createContext, useCallback } from 'react'
import { OhpkmStoreData } from '.'
import { useConvertStrategies } from '../convert-strategies'
import { useLookups } from '../lookups'

export const FORCE_MISSED_LOOKUP = false

export type MoveSlotIndex = 0 | 1 | 2 | 3

export type OhpkmLookupResult = Result<OHPKM, IdentifierNotPresentError>
export type OhpkmBatchLookupResults = Map<OhpkmIdentifier, OhpkmLookupResult>

export function useOhpkmStore() {
  const { defaultConvertStrategy } = useConvertStrategies()
  const { lookups, updateLookups } = useLookups()
  const { gen12: gen12Lookup, gen345: gen345Lookup } = lookups
  const backend = useBackend()
  const { addToOhpkmStore } = useBackend()

  const updateStore = addToOhpkmStore

  const getById = useCallback(
    (id: string): Promise<Option<OHPKM>> => {
      return backend.lookupOhpkmById(id).then(R.ok)
    },
    [backend]
  )

  async function tryLoadFromId(id: string): Promise<OhpkmLookupResult> {
    return backend
      .lookupOhpkmById(id)
      .then(R.mapErr(() => IdentifierNotPresent(id)))
      .then(R.flatMap((ohpkm) => (ohpkm ? R.Ok(ohpkm) : R.Err(IdentifierNotPresent(id)))))
  }

  async function tryLoadBatch(ids: OhpkmIdentifier[]): Promise<OhpkmBatchLookupResults> {
    const batchResults: OhpkmBatchLookupResults = new Map()

    for (const identifier of ids) {
      batchResults.set(identifier, await tryLoadFromId(identifier))
    }

    return batchResults
  }

  async function monIsStored(id: string): Promise<boolean> {
    return getById(id) !== undefined
  }

  async function insertOrUpdate(mon: OHPKM) {
    updateStore({ [mon.openhomeId]: mon.clone() })
  }

  async function insertOrUpdateAll(mons: OhpkmStoreData) {
    return updateStore(mons)
  }

  async function replaceHeldItem(mon: OHPKM) {
    const replacedItem = mon.heldItemIndex
    mon.heldItemIndex = 0
    insertOrUpdate(mon)
    return replacedItem
  }

  async function getAllStored() {
    return backend.loadOhpkmStore().then(R.ok)
  }

  async function getAllStoredIds() {
    const allStored = await getAllStored()

    return allStored ? Object.keys(allStored) : undefined
  }

  async function handleLookupsUpdate(ohpkm: OHPKM, save: SAV) {
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
  }

  async function updateAndConvertForSave<P extends PKMInterface>(ohpkm: OHPKM, save: SAV<P>) {
    handleLookupsUpdate(ohpkm, save)
    insertOrUpdate(ohpkm)
    handleLookupsUpdate(ohpkm, save)

    return save.convertOhpkm(ohpkm, defaultConvertStrategy)
  }

  async function updateMonMarkings(monId: string, markings: MarkingsSixShapesColors) {
    const result = await tryLoadFromId(monId)
    if (R.isErr(result)) return result

    const mon = result.data
    mon.markings = { ...markings }

    insertOrUpdate(mon)
    return R.Ok(mon)
  }

  async function updateMonNotes(monId: string, notes: string | undefined) {
    const result = await tryLoadFromId(monId)
    if (R.isErr(result)) return result

    const mon = result.data
    mon.notes = notes

    insertOrUpdate(mon)
    return R.Ok(mon)
  }

  async function updateMonTags(
    monId: string,
    tags: { label: string; color: string; icon?: string }[] | undefined
  ) {
    const result = await tryLoadFromId(monId)
    if (R.isErr(result)) return result

    const mon = result.data
    mon.setTags(tags ?? [])

    insertOrUpdate(mon)
    return R.Ok(mon)
  }

  async function updateMonDisplayColor(monId: string, color: string | undefined) {
    const result = await tryLoadFromId(monId)
    if (R.isErr(result)) return result

    const mon = result.data
    mon.displayColor = color

    insertOrUpdate(mon)
    return R.Ok(mon)
  }

  async function updateMonAffixedRibbon(monId: string, affixedRibbon: Option<ModernRibbon>) {
    const result = await tryLoadFromId(monId)
    if (R.isErr(result)) return result

    const mon = result.data
    mon.affixedRibbon = affixedRibbon

    insertOrUpdate(mon)
    return R.Ok(mon)
  }

  async function setMonMove(monId: string, moveId: Option<number>, slot: MoveSlotIndex) {
    const result = await tryLoadFromId(monId)
    if (R.isErr(result)) return result

    const mon = result.data
    const newMoves: FourMoves = [...mon.moves]

    newMoves[slot] = moveId ?? 0

    mon.moves = fixMoveSlots(newMoves, newMoves)

    mon.movePP = [
      getMoveMaxPP(mon.moves[0], 'OHPKM', mon.movePPUps[0]) ?? 0,
      getMoveMaxPP(mon.moves[1], 'OHPKM', mon.movePPUps[1]) ?? 0,
      getMoveMaxPP(mon.moves[2], 'OHPKM', mon.movePPUps[2]) ?? 0,
      getMoveMaxPP(mon.moves[3], 'OHPKM', mon.movePPUps[3]) ?? 0,
    ]

    insertOrUpdate(mon)
    return R.Ok(mon)
  }

  async function setMonNickname(monId: string, nickname: Option<string>) {
    const result = await tryLoadFromId(monId)
    if (R.isErr(result)) return result

    const mon = result.data
    mon.nickname = nickname || Lookup.speciesName(mon.nationalDex, mon.language)

    insertOrUpdate(mon)
    return R.Ok(mon)
  }

  async function startTrackingNewMon<P extends PKMInterface>(
    mon: P,
    sourceSave: Option<SAV<P>>,
    destSave: Option<SAV>
  ) {
    const ohpkm = sourceSave ? OHPKM.fromMonInSave(mon, sourceSave) : OHPKM.fromMonUnknownSave(mon)
    ohpkm.startedTrackingTimestamp = dayjs()
    if (destSave) {
      handleLookupsUpdate(ohpkm, destSave)
    }

    insertOrUpdate(ohpkm)

    return ohpkm
  }

  // if PK6+, calculates openhome ID based on pokemon's attributes. otherwise uses lookup map to find openhome ID.
  // PK6+ mons will always return an ID, but that doesn't mean they are tracked
  function calculateOrLookupOhpkmId(mon: PKMInterface): Option<OhpkmIdentifier> {
    if (FORCE_MISSED_LOOKUP) return undefined
    switch (mon.format) {
      case 'OHPKM':
        if (!(mon instanceof OHPKM)) throw Error('Non-OHPKM has OHPKM format')
        return mon.openhomeId
      case 'PK1':
      case 'PK2': {
        const gen12Identifier = getMonGen12Identifier(mon)
        if (!gen12Identifier) {
          throw Error(`unable to calculate gen 1/2 identifier for ${mon.nickname} (${mon.format})`)
        }

        return gen12Lookup[gen12Identifier]
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

        return gen345Lookup[gen345Identifier]
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
        return getMonFileIdentifier(mon)
      }
      default:
        expectExhaustive(mon.format, `unrecognized format: ${mon.format}`)
    }
  }

  async function loadIfTracked(mon: PKMInterface): Promise<Option<OHPKM>> {
    const openhomeId = calculateOrLookupOhpkmId(mon)
    return openhomeId ? getById(openhomeId) : undefined
  }

  async function loadOrStartTracking(
    mon: PKMInterface,
    sourceSave: Option<SAV>,
    destSave: Option<SAV>
  ) {
    return (await loadIfTracked(mon)) ?? (await startTrackingNewMon(mon, sourceSave, destSave))
  }

  async function monOrOhpkmIfTracked<P extends PKMInterface>(mon: P): Promise<OHPKM | P> {
    return (await loadIfTracked(mon)) ?? mon
  }

  async function monOrOhpkmIfTrackedAll<P extends PKMInterface>(
    mons: readonly P[]
  ): Promise<(OHPKM | P)[]> {
    return Promise.all(mons.map(async (mon) => (await loadIfTracked(mon)) ?? mon))
  }

  async function getIdIfTracked(mon: PKMInterface): Promise<Option<OhpkmIdentifier>> {
    return loadIfTracked(mon).then((ohpkm) => ohpkm?.openhomeId)
  }

  async function syncOhpkmIfTracked(ohpkmId: OhpkmIdentifier, mon: PKMInterface, save?: SAV) {
    return $R(await tryLoadFromId(ohpkmId)).map((trackedData) => {
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
  }

  return {
    getById,
    tryLoadFromId,
    tryLoadBatch,
    monIsStored,
    insertOrUpdate,
    insertOrUpdateAll,

    updateMonMarkings,
    updateMonNotes,
    updateMonTags,
    updateMonAffixedRibbon,
    updateMonDisplayColor,
    setMonNickname,
    setMonMove,

    getAllStored,
    getAllStoredIds,
    updateAndConvertForSave,
    startTrackingNewMon,
    getIdIfTracked,
    loadIfTracked,
    loadOrStartTracking,
    getPotentialOhpkmId: calculateOrLookupOhpkmId,
    monOrOhpkmIfTracked,
    monOrOhpkmIfTrackedAll,
    syncOhpkmIfTracked,

    replaceHeldItem,
  }
}

function fixMoveSlots(slots: FourMoves, moves: FourMoves): FourMoves {
  const dedupedMoves = Array.from(new Set(moves))

  const presentSlots = [0, 1, 2, 3]
    .filter((index) => Boolean(dedupedMoves.at(index)))
    .map((index) => slots[index])

  return [
    presentSlots.at(0) ?? 0,
    presentSlots.at(1) ?? 0,
    presentSlots.at(2) ?? 0,
    presentSlots.at(3) ?? 0,
  ]
}

export type OhpkmStore = ReturnType<typeof useOhpkmStore>
export type IdentifierNotPresentError = { identifier: OhpkmIdentifier }

function IdentifierNotPresent(identifier: OhpkmIdentifier): IdentifierNotPresentError {
  return { identifier }
}
export const OhpkmStoreContext = createContext<
  [OhpkmStoreData, (updated: OhpkmStoreData) => Promise<Errorable<null>>]
>([{}, async () => R.Err('Uninitialized')])
