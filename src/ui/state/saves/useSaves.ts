import useBackend from '@openhome-core/backend/useBackend'
import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { displayIndexAdder, isBattleFormeItem } from '@openhome-core/pkm/util'
import { getSaveRef, SAV, SaveIdentifier } from '@openhome-core/save/interfaces'
import { monSupportedBySave, SAVClass } from '@openhome-core/save/util'
import { buildSaveFile, getPossibleSaveTypes } from '@openhome-core/save/util/load'
import { PathData } from '@openhome-core/save/util/path'
import { Errorable, Option, R, Result } from '@openhome-core/util/functional'
import { $O } from '@openhome-core/util/option'
import {
  OPENHOME_BOX_SLOTS,
  useBanksAndBoxes,
} from '@openhome-ui/state-zustand/banks-and-boxes/store'
import { AppInfoContext } from '@openhome-ui/state/appInfo'
import { useConvertStrategies } from '@openhome-ui/state/convert-strategies'
import { useItemBag } from '@openhome-ui/state/items'
import { OhpkmStoreData } from '@openhome-ui/state/ohpkm'
import { IdentifierNotPresentError, useOhpkmStore } from '@openhome-ui/state/ohpkm/useOhpkmStore'
import { PokedexUpdate } from '@openhome-ui/util/pokedex'
import { Item } from '@pkm-rs/pkg'
import { useCallback, useContext, useRef } from 'react'
import {
  HomeMonLocation,
  MonLocation,
  MonWithLocation,
  OpenSavesState,
  SaveMonLocation,
  SavesContext,
} from './reducer'

export type SavesAndBanksManager = Required<Omit<OpenSavesState, 'error' | 'homeData'>> & {
  allOpenSaves: readonly SAV[]

  importMonsToLocation(mons: PKMInterface[], startingAt: MonLocation): Promise<OpenSavesState>

  addSave(save: SAV): Promise<Result<SAV, SaveError>>
  buildAndOpenSave: (filePath?: PathData | undefined) => Promise<Result<Option<SAV>, SaveError>>
  removeSave(save: SAV): void
  saveBoxNavigateLeft(save: SAV): void
  saveBoxNavigateRight(save: SAV): void
  saveFromIdentifier: (identifier: SaveIdentifier) => SAV

  getMonAtLocation(location: MonLocation): Promise<Option<PKMInterface>>
  overwriteMonAtLocation(location: MonLocation, mon: Option<OhpkmIdentifier>): Promise<void>
  setMonHeldItem(item: Item | undefined, location: MonLocation): Promise<Errorable<null>>
  moveMon(source: MonWithLocation, dest: MonLocation): Promise<Errorable<null>>
  recoverMonToBox(id: OhpkmIdentifier, bankIndex: number): void

  releaseMonAtLocation(location: MonLocation): void
  releaseMonsById(...ids: OhpkmIdentifier[]): void
  trackedMonsToRelease: OhpkmIdentifier[]

  // Bulk operations
  moveBoxToBank(save: SAV): Promise<MovedPokemonCount>
  moveSaveToBank(save: SAV): Promise<MovedPokemonCount>

  // OHPKM modification
  moveMonItemToBag: (monLocation: MonLocation) => Promise<void>
  giveItemToMon: (monLocation: MonLocation, item: Item) => Promise<void>
  revertMonAbility: (monId: OhpkmIdentifier) => Promise<Result<null, IdentifierNotPresentError>>

  allMonsInCurrentBank: () => OhpkmIdentifier[]
}

const SCAN_FULL_STORE_AND_FIX_HANDLERS = false // warning - this can cause slowdown when opening a save if many OHPKMs are tracked

function MissingOhpkmData(identifier: string) {
  return R.Err(`Missing OHPKM data for identifier ${identifier}`)
}

export type OhpkmSaveImportResult = Result<Option<PKMInterface>, IdentifierNotPresentError>
export type DisplacedMonOpenHomeId = Option<OhpkmIdentifier>
type MovedPokemonCount = number

export function useSaves(): SavesAndBanksManager {
  const ohpkmStore = useOhpkmStore()
  const backend = useBackend()
  const [, , getEnabledSaveTypes] = useContext(AppInfoContext)
  const { openSavesState, openSavesDispatch, allOpenSaves, promptDisambiguation } =
    useContext(SavesContext)
  const filePickerOpen = useRef(false)
  const banksAndBoxes = useBanksAndBoxes()
  const { defaultConvertStrategy } = useConvertStrategies()
  const ItemBag = useItemBag()

  if (openSavesState.error) {
    throw new Error(`Error loading saves state: ${openSavesState.error}`)
  }
  const {
    getCurrentBank,

    getMonAtHomeLocation,
    homeLocationIsEmpty,
    clearAtHomeLocation,
    setAtHomeLocation,
    findHomeLocation,

    allMonsInCurrentBank,
    firstHomeBoxEmptySlot,
  } = banksAndBoxes

  const saveFromIdentifier = useCallback(
    (identifier: SaveIdentifier) => openSavesState.openSaves[identifier].save,
    [openSavesState.openSaves]
  )

  const getMonAtSaveLocation = useCallback(
    (location: SaveMonLocation) => {
      const save = openSavesState.openSaves[location.saveIdentifier].save
      return save.getMonAt(location.box, location.boxSlot)
    },
    [openSavesState.openSaves]
  )

  const getMonAtLocation = useCallback(
    async (location: MonLocation): Promise<Option<PKMInterface>> => {
      let identifier: OhpkmIdentifier | undefined
      if (!location.isHome) {
        const mon = getMonAtSaveLocation(location)
        if (!mon) return Promise.resolve(undefined)

        return ohpkmStore.loadIfTracked(mon) ?? Promise.resolve(mon)
      } else {
        identifier = getMonAtHomeLocation(location)
        if (!identifier) return Promise.resolve(undefined)

        // TODO: should this function return an error if the lookup fails? for now the error is replaced with undefined (via R.ok())
        return ohpkmStore.tryLoadFromId(identifier).then(R.ok())
      }
    },
    [getMonAtHomeLocation, getMonAtSaveLocation, ohpkmStore]
  )

  const moveMonBetweenSaves = useCallback(
    async (
      sourceSaveIdentifier: Option<SaveIdentifier>,
      mon: Option<PKMInterface>,
      dest: SaveMonLocation
    ): Promise<Errorable<Option<PKMInterface>>> => {
      const sourceSave = sourceSaveIdentifier ? saveFromIdentifier(sourceSaveIdentifier) : undefined
      const destSave = openSavesState.openSaves[dest.saveIdentifier].save

      let ohpkm: Option<OHPKM> = await $O(mon)
        .map(
          async (mon) =>
            (await ohpkmStore.loadIfTracked(mon)) ??
            (await ohpkmStore.startTrackingNewMon(mon, sourceSave, destSave))
        )
        .getPromise()

      return (
        (await $O(ohpkm)
          .map((ohpkm) =>
            ohpkmStore.updateAndConvertForSave(ohpkm, destSave).then(
              R.map((mon) => {
                const displacedMon = destSave.getMonAt(dest.box, dest.boxSlot)
                destSave.setMonAt(dest.box, dest.boxSlot, mon)
                destSave.updatedBoxSlots.push({ box: dest.box, boxSlot: dest.boxSlot })
                return displacedMon
              })
            )
          )
          .getPromise()) ?? R.Ok(undefined)
      )
    },
    [ohpkmStore, openSavesState.openSaves, saveFromIdentifier]
  )

  const moveOhpkmToSave = useCallback(
    async (
      identifier: Option<OhpkmIdentifier>,
      dest: SaveMonLocation
    ): Promise<OhpkmSaveImportResult> => {
      const save = openSavesState.openSaves[dest.saveIdentifier].save

      if (!identifier) {
        const displacedMon = save.getMonAt(dest.box, dest.boxSlot)
        save.setMonAt(dest.box, dest.boxSlot, undefined)
        save.updatedBoxSlots.push({ box: dest.box, boxSlot: dest.boxSlot })
        return R.Ok(displacedMon)
      }

      const monResult = await ohpkmStore.tryLoadFromId(identifier)
      if (R.isErr(monResult)) {
        return monResult
      }

      const ohpkm = monResult.data
      const converted = await ohpkmStore.updateAndConvertForSave(ohpkm, save)
      if (R.isErr(converted)) {
        return R.Ok(undefined)
      }

      const displacedMon = save.getMonAt(dest.box, dest.boxSlot)
      save.setMonAt(dest.box, dest.boxSlot, converted.data)
      save.updatedBoxSlots.push({ box: dest.box, boxSlot: dest.boxSlot })

      return R.Ok(displacedMon)
    },
    [ohpkmStore, openSavesState.openSaves]
  )

  const clearMonAtSaveLocation = useCallback(
    (location: SaveMonLocation): Result<Option<PKMInterface>, IdentifierNotPresentError> => {
      const save = openSavesState.openSaves[location.saveIdentifier].save

      const displacedMon = save.getMonAt(location.box, location.boxSlot)
      save.setMonAt(location.box, location.boxSlot, undefined)
      save.updatedBoxSlots.push({ box: location.box, boxSlot: location.boxSlot })
      return R.Ok(displacedMon)
    },
    [openSavesState.openSaves]
  )

  const moveMonToHome = useCallback(
    async <P extends PKMInterface>(
      sourceSaveIdentifier: Option<SaveIdentifier>,
      mon: Option<P>,
      location: HomeMonLocation
    ): Promise<DisplacedMonOpenHomeId> => {
      const sourceSave = sourceSaveIdentifier ? saveFromIdentifier(sourceSaveIdentifier) : undefined
      const displacedMonId = getMonAtHomeLocation(location)

      let ohpkm: Option<OHPKM>
      if (mon) {
        ohpkm =
          (await ohpkmStore.loadIfTracked(mon)) ??
          (await ohpkmStore.startTrackingNewMon(mon, sourceSave, undefined))
      }

      if (!mon) {
        clearAtHomeLocation(location)
      } else if (ohpkm) {
        setAtHomeLocation(location, ohpkm.openhomeId)
      }

      return displacedMonId
    },
    [clearAtHomeLocation, getMonAtHomeLocation, ohpkmStore, saveFromIdentifier, setAtHomeLocation]
  )

  const moveOhpkmToHome = useCallback(
    (
      identifier: OhpkmIdentifier | undefined,
      dest: HomeMonLocation,
      skipIfPresent: boolean = false
    ) => {
      // this is a bandaid fix for the issue of onDrop() being triggered multiple times for BoxCell. For
      // some reason it only affects the OpenHome boxes.
      if (skipIfPresent && identifier && findHomeLocation(identifier)) {
        return undefined
      }

      const displacedMonId = getMonAtHomeLocation(dest)
      if (identifier) {
        setAtHomeLocation(dest, identifier)
      } else {
        clearAtHomeLocation(dest)
      }
      return displacedMonId
    },
    [clearAtHomeLocation, findHomeLocation, getMonAtHomeLocation, setAtHomeLocation]
  )

  const overwriteMonAtLocation = useCallback(
    async (location: MonLocation, ohpkmId: Option<OhpkmIdentifier>) => {
      if (!location.isHome) {
        await moveOhpkmToSave(ohpkmId, location)
      } else {
        moveOhpkmToHome(ohpkmId, location)
      }
    },
    [moveOhpkmToSave, moveOhpkmToHome]
  )

  const importMonsToLocation = useCallback(
    async (mons: PKMInterface[], startingAt: MonLocation): Promise<OpenSavesState> => {
      const addedMons: OHPKM[] = []
      const dest = startingAt

      if (dest.isHome) {
        let nextSlot = dest

        const currentBankBoxCount = getCurrentBank().boxes.size
        mons.forEach((mon) => {
          while (!homeLocationIsEmpty(nextSlot) && nextSlot.box < currentBankBoxCount) {
            nextSlot.boxSlot++
            if (nextSlot.boxSlot >= OPENHOME_BOX_SLOTS) {
              nextSlot.boxSlot = 0
              nextSlot.box++
            }
          }

          if (nextSlot.box < currentBankBoxCount) {
            const homeMon = mon instanceof OHPKM ? mon : OHPKM.fromMonUnknownSave(mon)
            ohpkmStore.insertOrUpdate(homeMon)

            moveOhpkmToHome(homeMon.openhomeId, nextSlot, true)
            addedMons.push(homeMon)
            nextSlot.boxSlot++
            if (nextSlot.boxSlot >= OPENHOME_BOX_SLOTS) {
              nextSlot.boxSlot = 0
              nextSlot.box++
            }
          }
        })
      } else {
        let nextIndex = dest.boxSlot
        const tempSave = saveFromIdentifier(dest.saveIdentifier)

        mons.forEach(async (mon) => {
          while (
            tempSave.getMonAt(dest.box, nextIndex) &&
            nextIndex < tempSave.boxRows * tempSave.boxColumns
          ) {
            nextIndex++
          }
          if (nextIndex < tempSave.boxRows * tempSave.boxColumns) {
            const homeMon = mon instanceof OHPKM ? mon : OHPKM.fromMonInSave(mon, tempSave)

            const converted = await ohpkmStore.updateAndConvertForSave(homeMon, tempSave)
            if (R.isErr(converted)) {
              return R.Ok(null)
            }

            moveMonBetweenSaves(undefined, converted.data, dest)
            addedMons.push(homeMon)
            nextIndex++
          }
        })

        openSavesState.openSaves[dest.saveIdentifier].save = tempSave
      }

      return { ...openSavesState, openSaves: { ...openSavesState.openSaves } }
    },
    [
      getCurrentBank,
      homeLocationIsEmpty,
      moveMonBetweenSaves,
      moveOhpkmToHome,
      ohpkmStore,
      openSavesState,
      saveFromIdentifier,
    ]
  )

  const saveBoxNavigateLeft = useCallback(
    (save: SAV) => {
      openSavesDispatch({
        type: 'set_save_box',
        payload: {
          boxIndex: save.currentPCBox > 0 ? save.currentPCBox - 1 : save.getBoxCount() - 1,
          save,
        },
      })
    },
    [openSavesDispatch]
  )

  const saveBoxNavigateRight = useCallback(
    (save: SAV) => {
      openSavesDispatch({
        type: 'set_save_box',
        payload: {
          boxIndex: (save.currentPCBox + 1) % save.getBoxCount(),
          save,
        },
      })
    },
    [openSavesDispatch]
  )

  const addSave = useCallback(
    async (save: SAV): Promise<Result<SAV, SaveError>> => {
      try {
        await backend.addRecentSave(getSaveRef(save))
        const result = await backend.registerInPokedex(pokedexSeenFromSave(save))
        if (R.isErr(result)) {
          console.error('Error registering pokedex entries from save:', result.error)
        }

        // TODO - PERFORMACE:
        // this currently looks for tracked Pokémon that have a handler name/gender but no other data for that handler,
        // checks to see if the save file matches the handler data, and fills out the other handler data from the save
        // file if so. This was for fixing mons from before visited save data was fully tracked.
        //
        // In the interest of performance, all "full scans" of the OHPKM data store should be eliminated aside from
        // when manually triggered by a user willing to wait. This handler fixing functionality should be made a manual
        // task so the app doesn't freeze every time a save is opened.
        if (SCAN_FULL_STORE_AND_FIX_HANDLERS) {
          const allOhpkms = await ohpkmStore.getAllStored()
          for (const mon of allOhpkms) {
            if (!monSupportedBySave(save, mon)) continue

            const matchingHandler = mon.matchingUnknownHandler(save.name, save.trainerGender)
            if (!matchingHandler) continue

            mon.updateTrainerData(
              save,
              matchingHandler.friendship,
              matchingHandler.affection,
              matchingHandler.memory
            )

            ohpkmStore.insertOrUpdate(mon)
          }
        }

        const toUpdate: OhpkmStoreData = {}
        for (const mon of save.getAllMons()) {
          const trackedData = await ohpkmStore.loadIfTracked(mon)
          if (trackedData) {
            const updates = trackedData.syncWithGameData(mon, save)

            if (updates.length > 0) {
              backend.log('DEBUG', `synced ${mon.nickname} with game data`, {
                ohpkm_id: trackedData.openhomeId,
                event: 'game_data_sync',
                updates,
              })
            }

            for (const update of updates) {
              backend.log(
                'INFO',
                `${mon.nickname}: ${update.message ?? `Updated ${update.field} from ${JSON.stringify(update.prevValue)} to ${JSON.stringify(update.newValue)}`}`,
                {
                  ohpkm_id: trackedData.openhomeId,
                  event: 'game_data_sync',
                  updates,
                }
              )
            }

            toUpdate[trackedData.openhomeId] = trackedData
          }
        }

        ohpkmStore.insertOrUpdateAll(toUpdate)
        openSavesDispatch({ type: 'add_save', payload: save })
        return R.Ok(save)
      } catch (e) {
        console.error(e)
        return R.Err({ type: 'OTHER', cause: String(e) })
      }
    },
    [backend, openSavesDispatch, ohpkmStore]
  )

  const buildAndOpenSave = useCallback(
    async (filePath?: PathData): Promise<Result<Option<SAV>, SaveError>> => {
      if (!filePath) {
        filePickerOpen.current = true
        const result = await backend.pickFile()
        filePickerOpen.current = false

        if (R.isErr(result)) {
          return R.Err({ type: 'SELECT_FILE', cause: result.error })
        }
        if (!result.data) return R.Ok(undefined)
        filePath = result.data
      }

      if (allOpenSaves.some((other) => other.filePath.raw === filePath.raw)) {
        return R.Err({ type: 'ALREADY_OPEN' })
      }

      const bytesResult = await backend.loadSaveFile(filePath)
      if (R.isErr(bytesResult)) {
        return R.Err({ type: 'READ_FILE', cause: bytesResult.error })
      }

      const fileBytes = bytesResult.data.fileBytes

      let saveTypes = getPossibleSaveTypes(fileBytes, getEnabledSaveTypes())

      let saveType: Option<SAVClass>
      switch (saveTypes.length) {
        case 0:
          return R.Err({ type: 'UNRECOGNIZED' })
        case 1:
          saveType = saveTypes[0]
          break
        default:
          saveType = await promptDisambiguation(saveTypes)
      }

      if (!saveType) {
        return R.Ok(undefined)
      }

      const result = buildSaveFile(filePath, fileBytes, saveType)

      if (R.isErr(result)) {
        return R.Err({
          type: 'BUILD_SAVE',
          cause: result.error,
        })
      }
      const saveFile = result.data

      if (!saveFile) {
        return R.Err({ type: 'UNRECOGNIZED' })
      } else {
        return addSave(saveFile)
      }
    },
    [addSave, allOpenSaves, backend, getEnabledSaveTypes, promptDisambiguation]
  )

  const removeSave = useCallback(
    (save: SAV) => {
      openSavesDispatch({ type: 'remove_save', payload: save })
    },
    [openSavesDispatch]
  )

  const setMonHeldItem = useCallback(
    async (item: Item | undefined, location: MonLocation): Promise<Errorable<null>> => {
      const itemIndex = item?.index ?? 0
      let ohpkm: OHPKM
      if (location.isHome) {
        const identifier = getMonAtHomeLocation(location)
        if (!identifier) return R.Ok(null)

        const result = await ohpkmStore.tryLoadFromId(identifier)
        if (R.isErr(result)) {
          return MissingOhpkmData(identifier)
        }

        ohpkm = result.data
      } else {
        const mon = getMonAtSaveLocation(location)
        if (!mon) return R.Ok(null)

        const save = saveFromIdentifier(location.saveIdentifier)
        ohpkm =
          (await ohpkmStore.loadIfTracked(mon)) ??
          (await ohpkmStore.startTrackingNewMon(mon, save, save))

        const converted = save.convertOhpkm(ohpkm, defaultConvertStrategy)
        if (R.isErr(converted)) {
          return R.Ok(null)
        }

        save.setMonAt(location.box, location.boxSlot, converted.data)
        save.updatedBoxSlots.push({ box: location.box, boxSlot: location.boxSlot })
      }

      ohpkm.heldItemIndex = itemIndex
      ohpkmStore.insertOrUpdate(ohpkm)

      return R.Ok(null)
    },
    [
      getMonAtHomeLocation,
      getMonAtSaveLocation,
      ohpkmStore,
      saveFromIdentifier,
      defaultConvertStrategy,
    ]
  )

  const revertMonAbility = useCallback(
    async (identifier: OhpkmIdentifier): Promise<Result<null, IdentifierNotPresentError>> => {
      const result = await ohpkmStore.tryLoadFromId(identifier)
      if (R.isErr(result)) return result

      const mon = result.data
      mon.revertAbilityByNum()

      await ohpkmStore.insertOrUpdate(mon)
      return R.Ok(null)
    },
    [ohpkmStore]
  )

  async function moveMon(source: MonLocation, dest: MonLocation): Promise<Errorable<null>> {
    if (source.isHome) {
      const sourceMonId = getMonAtHomeLocation(source)
      if (!sourceMonId) return R.Ok(null)

      if (dest.isHome) {
        const displacedMonId = moveOhpkmToHome(sourceMonId, dest)
        moveOhpkmToHome(displacedMonId, source)
      } else {
        const result = await moveOhpkmToSave(sourceMonId, dest)
        if (R.isErr(result)) {
          return MissingOhpkmData(sourceMonId)
        }

        const displacedMon = result.data
        moveMonToHome(dest.saveIdentifier, displacedMon, source)
      }
    } else if (!dest.isHome && source.saveIdentifier === dest.saveIdentifier) {
      moveMonWithinSave(saveFromIdentifier(source.saveIdentifier), source, dest)
    } else {
      const sourceMon = getMonAtSaveLocation(source)
      if (!sourceMon) return R.Ok(null)

      if (dest.isHome) {
        const displacedMonId = await moveMonToHome(source.saveIdentifier, sourceMon, dest)
        moveOhpkmToSave(displacedMonId, source)
      } else {
        const swappedMonResult = await moveMonBetweenSaves(source.saveIdentifier, sourceMon, dest)
        if (R.isErr(swappedMonResult)) {
          return swappedMonResult
        }
        moveMonBetweenSaves(dest.saveIdentifier, swappedMonResult.data, source)
      }
    }

    return R.Ok(null)
  }

  const releaseMonById = useCallback(
    (id: OhpkmIdentifier) => {
      openSavesDispatch({ type: 'release_mon_by_id', payload: id })
      const location = findHomeLocation(id)
      if (location) {
        clearAtHomeLocation(location)
      }
    },
    [clearAtHomeLocation, findHomeLocation, openSavesDispatch]
  )

  const releaseMonAtLocation = useCallback(
    (location: MonLocation) => {
      if (location.isHome) {
        const displacedMonIdentifier = getMonAtHomeLocation(location)
        clearAtHomeLocation(location)
        if (!displacedMonIdentifier) return // slot is empty

        openSavesDispatch({
          type: 'release_mon_by_id',
          payload: displacedMonIdentifier,
        })
      } else {
        const releasedMon = clearMonAtSaveLocation(location)
        if (!releasedMon) return
      }
    },
    [clearAtHomeLocation, clearMonAtSaveLocation, getMonAtHomeLocation, openSavesDispatch]
  )

  const releaseMonsById = useCallback(
    (...ids: OhpkmIdentifier[]) => {
      ids.forEach(releaseMonById)
    },
    [releaseMonById]
  )

  const recoverMonToBox = useCallback(
    (id: OhpkmIdentifier, boxIndex: number) => {
      const box = getCurrentBank().boxes.get(boxIndex)
      if (!box) {
        console.error(`box does not exist (index ${boxIndex})`)
        return
      }

      const firstEmptyIndex = firstHomeBoxEmptySlot(boxIndex)
      if (firstEmptyIndex === undefined) {
        console.error(`box at index ${boxIndex} is full`)
        return
      }

      setAtHomeLocation(
        { bank: getCurrentBank().index, box: boxIndex, boxSlot: firstEmptyIndex },
        id
      )
    },
    [firstHomeBoxEmptySlot, getCurrentBank, setAtHomeLocation]
  )

  const moveBoxToBank = useCallback(
    async (save: SAV): Promise<MovedPokemonCount> => {
      let movedCount = 0
      const boxSize = OPENHOME_BOX_SLOTS
      let currentBankBox = banksAndBoxes.getCurrentBox().index
      let currentSlot = 0

      while (currentBankBox < banksAndBoxes.getCurrentBank().boxes.size) {
        const emptyIndex = banksAndBoxes.firstHomeBoxEmptySlot(currentBankBox)
        if (emptyIndex !== undefined) {
          currentSlot = emptyIndex
          break
        }
        currentBankBox++
      }

      for (let boxSlot = 0; boxSlot < save.boxSlotCount; boxSlot++) {
        const mon = save.getMonAt(save.currentPCBox, boxSlot)
        if (!mon) continue

        while (currentBankBox < banksAndBoxes.getCurrentBank().boxes.size) {
          if (currentSlot < boxSize) {
            const bankSlotEmpty = banksAndBoxes.homeLocationIsEmpty({
              bank: banksAndBoxes.getCurrentBank().index,
              box: currentBankBox,
              boxSlot: currentSlot,
            })
            if (bankSlotEmpty) break
            currentSlot++
          } else {
            currentSlot = 0
            currentBankBox++
          }
        }

        if (currentBankBox >= banksAndBoxes.getCurrentBank().boxes.size) {
          banksAndBoxes.addBoxCurrentBank('end')
        }

        const ohpkm =
          (await ohpkmStore.loadIfTracked(mon)) ??
          (await ohpkmStore.startTrackingNewMon(mon, save, undefined))

        banksAndBoxes.setAtHomeLocation(
          {
            bank: banksAndBoxes.getCurrentBank().index,
            box: currentBankBox,
            boxSlot: currentSlot,
          },
          ohpkm.openhomeId
        )

        save.setMonAt(save.currentPCBox, boxSlot, undefined)
        save.updatedBoxSlots.push({ box: save.currentPCBox, boxSlot: boxSlot })

        movedCount++
        currentSlot++
      }

      return movedCount
    },
    [banksAndBoxes, ohpkmStore]
  )

  const moveSaveToBank = useCallback(
    async (save: SAV): Promise<MovedPokemonCount> => {
      let totalMoved = 0
      let currentBankBox = banksAndBoxes.getCurrentBox().index
      let currentSlot = 0

      while (currentBankBox < banksAndBoxes.getCurrentBank().boxes.size) {
        const emptyIndex = banksAndBoxes.firstHomeBoxEmptySlot(currentBankBox)
        if (emptyIndex !== undefined) {
          currentSlot = emptyIndex
          break
        }
        currentBankBox++
      }

      for (let boxIdx = 0; boxIdx < save.getBoxCount(); boxIdx++) {
        for (let slotIdx = 0; slotIdx < save.boxSlotCount; slotIdx++) {
          const mon = save.getMonAt(boxIdx, slotIdx)
          if (!mon) continue

          while (currentBankBox < banksAndBoxes.getCurrentBank().boxes.size) {
            if (currentSlot < OPENHOME_BOX_SLOTS) {
              const bankSlotEmpty = banksAndBoxes.homeLocationIsEmpty({
                bank: banksAndBoxes.getCurrentBank().index,
                box: currentBankBox,
                boxSlot: currentSlot,
              })
              if (bankSlotEmpty) break
              currentSlot++
            } else {
              currentSlot = 0
              currentBankBox++
            }
          }

          if (currentBankBox >= banksAndBoxes.getCurrentBank().boxes.size) {
            banksAndBoxes.addBoxCurrentBank('end')
          }

          const ohpkm =
            (await ohpkmStore.loadIfTracked(mon)) ??
            (await ohpkmStore.startTrackingNewMon(mon, save, undefined))

          banksAndBoxes.setAtHomeLocation(
            {
              bank: banksAndBoxes.getCurrentBank().index,
              box: currentBankBox,
              boxSlot: currentSlot,
            },
            ohpkm.openhomeId
          )

          save.setMonAt(boxIdx, slotIdx, undefined)
          save.updatedBoxSlots.push({ box: boxIdx, boxSlot: slotIdx })

          totalMoved++
          currentSlot++
        }
      }

      return totalMoved
    },
    [banksAndBoxes, ohpkmStore]
  )

  const moveMonItemToBag = useCallback(
    async (monLocation: MonLocation) => {
      const destMon = await getMonAtLocation(monLocation)
      if (!destMon?.heldItemIndex) return
      ItemBag.addItem(destMon.heldItemIndex, 1)
      await setMonHeldItem(undefined, monLocation)
    },
    [getMonAtLocation, ItemBag, setMonHeldItem]
  )

  const giveItemToMon = useCallback(
    async (monLocation: MonLocation, item: Item) => {
      const destMon = await getMonAtLocation(monLocation)
      if (!destMon) return

      ItemBag.removeItem(item.index, 1)

      // If already holding an item, move it to the bag
      if (destMon?.heldItemIndex !== undefined) {
        ItemBag.addItem(destMon.heldItemIndex, 1)
      }
      setMonHeldItem(item, monLocation)
    },
    [setMonHeldItem, getMonAtLocation, ItemBag]
  )

  return {
    ...openSavesState,
    allOpenSaves,
    importMonsToLocation,

    addSave,
    buildAndOpenSave,
    removeSave,
    saveBoxNavigateLeft,
    saveBoxNavigateRight,
    saveFromIdentifier,

    getMonAtLocation,
    overwriteMonAtLocation,
    setMonHeldItem,
    moveMon,
    recoverMonToBox,

    releaseMonAtLocation,
    releaseMonsById,
    trackedMonsToRelease: openSavesState.monsToRelease.filter(
      (toRelease) => typeof toRelease === 'string'
    ),

    // Bulk operations
    moveBoxToBank,
    moveSaveToBank,
    moveMonItemToBag,
    giveItemToMon,
    revertMonAbility,

    allMonsInCurrentBank,
  }
}

function moveMonWithinSave(save: SAV, source: SaveMonLocation, dest: SaveMonLocation) {
  const sourceMon = save.getMonAt(source.box, source.boxSlot)
  const displacedMon = save.getMonAt(dest.box, dest.boxSlot)
  save.setMonAt(dest.box, dest.boxSlot, sourceMon)
  save.updatedBoxSlots.push({ box: dest.box, boxSlot: dest.boxSlot })
  save.setMonAt(source.box, source.boxSlot, displacedMon)
  save.updatedBoxSlots.push({ box: source.box, boxSlot: source.boxSlot })
}

export type SaveError =
  | {
      type: 'ALREADY_OPEN'
    }
  | {
      type: 'SELECT_FILE'
      cause: string
    }
  | {
      type: 'READ_FILE'
      cause: string
    }
  | {
      type: 'UNRECOGNIZED'
    }
  | {
      type: 'BUILD_SAVE'
      cause: string
    }
  | {
      type: 'OTHER'
      cause: string
    }

export type SaveErrorType = SaveError['type']

export function saveErrorTitle(errorType: SaveErrorType): string {
  switch (errorType) {
    case 'SELECT_FILE':
      return 'Error Selecting File'
    case 'READ_FILE':
      return 'Error Reading File'
    case 'UNRECOGNIZED':
      return 'Error Detecting Save'
    case 'BUILD_SAVE':
      return 'Save File Invalid'
    case 'ALREADY_OPEN':
      return 'Already Open'
    case 'OTHER':
      return 'Error Opening Save'
  }
}

export function saveErrorMessage(error: SaveError): string {
  switch (error.type) {
    case 'SELECT_FILE':
    case 'READ_FILE':
    case 'BUILD_SAVE':
    case 'OTHER':
      return error.cause
    case 'UNRECOGNIZED':
      return 'The selected file was not recognized as a supported save file.'
    case 'ALREADY_OPEN':
      return 'The selected save file is already open'
  }
}

function pokedexSeenFromSave(saveFile: SAV) {
  const pokedexUpdates: PokedexUpdate[] = []

  for (const mon of saveFile.getAllMons()) {
    pokedexUpdates.push({
      nationalDex: mon.nationalDex,
      formIndex: mon.formIndex,
      status: 'Seen',
    })

    if (isBattleFormeItem(mon.nationalDex, mon.heldItemIndex)) {
      pokedexUpdates.push({
        nationalDex: mon.nationalDex,
        formIndex: displayIndexAdder(mon.heldItemIndex)(mon.formIndex),
        status: 'Seen',
      })
    }
  }

  return pokedexUpdates
}
