import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { getSortFunctionNullable } from '@openhome-core/pkm/sort'
import { getSaveRef, SAV, SaveIdentifier } from '@openhome-core/save/interfaces'
import { SAVClass } from '@openhome-core/save/util'
import { buildSaveFile, getPossibleSaveTypes } from '@openhome-core/save/util/load'
import { PathData } from '@openhome-core/save/util/path'
import { BoxMonIdentifiers } from '@openhome-core/save/util/storage'
import { Option, partitionResults, R, range, Result } from '@openhome-core/util/functional'
import { filterUndefined } from '@openhome-core/util/sort'
import { Item } from '@pkm-rs/pkg'
import { MarkingsSixShapesWithColor } from '@pokemon-files/util'
import { useCallback, useContext, useRef } from 'react'
import { AddBoxLocation, BankBoxCoordinates, OpenHomeBanks } from 'src/core/save/HomeData'
import { displayIndexAdder, isBattleFormeItem } from '../../../core/pkm/util'
import { BackendContext } from '../../backend/backendContext'
import { PokedexUpdate } from '../../util/pokedex'
import { AppInfoContext } from '../appInfo'
import { IdentifierNotPresentError, useOhpkmStore } from '../ohpkm/useOhpkmStore'
import {
  HomeMonLocation,
  MonLocation,
  MonWithLocation,
  OpenSavesState,
  SaveMonLocation,
  SavesContext,
} from './reducer'

export type SavesAndBanksManager = Required<Omit<OpenSavesState, 'error'>> & {
  allOpenSaves: readonly SAV[]

  switchToBank(bankIndex: number): void
  setCurrentBankName(newName: string | undefined): void
  addBank(name: string | undefined, boxCount: number): void
  setBoxNameCurrentBank(boxIndex: number, newName: string | undefined): void

  removeDupesFromHomeBox(boxIndex: number): void
  sortHomeBox(boxIndex: number, sortType: string): void
  sortAllHomeBoxes(sortType: string): void

  reorderBoxesCurrentBank(idsInNewOrder: string[]): void
  addBoxCurrentBank(position: AddBoxLocation, identifiers?: BoxMonIdentifiers): void
  deleteBoxCurrentBank(boxId: string, boxIndex: number): void
  newBoxesWithIds(ids: OhpkmIdentifier[], boxName?: string): Option<number>

  homeBoxNavigateLeft(): void
  homeBoxNavigateRight(): void
  homeBoxSetCurrent(index: number): void

  importMonsToLocation(mons: PKMInterface[], startingAt: MonLocation): void

  addSave(save: SAV): void
  buildAndOpenSave: (filePath?: PathData | undefined) => Promise<Result<Option<SAV>, SaveError>>
  removeSave(save: SAV): void
  saveBoxNavigateLeft(save: SAV): void
  saveBoxNavigateRight(save: SAV): void
  saveFromIdentifier: (identifier: SaveIdentifier) => SAV

  getMonAtLocation(location: MonLocation): PKMInterface | OHPKM | undefined
  setMonHeldItem(item: Item | undefined, location: MonLocation): void
  updateMonNotes(monId: string, notes: string | undefined): void
  updateMonMarkings(monId: string, markings: MarkingsSixShapesWithColor): void
  moveMon(source: MonWithLocation, dest: MonLocation): void
  recoverMonToBox(id: OhpkmIdentifier, bankIndex: number): void

  releaseMonAtLocation(location: MonLocation): void
  releaseMonsById(...ids: OhpkmIdentifier[]): void
  trackedMonsToRelease: OhpkmIdentifier[]
}

export function useSaves(): SavesAndBanksManager {
  const ohpkmStore = useOhpkmStore()
  const backend = useContext(BackendContext)
  const [, , getEnabledSaveTypes] = useContext(AppInfoContext)
  const { openSavesState, openSavesDispatch, allOpenSaves, promptDisambiguation } =
    useContext(SavesContext)
  const filePickerOpen = useRef(false)

  if (openSavesState.error) {
    throw new Error(`Error loading saves state: ${openSavesState.error}`)
  }

  const homeData = openSavesState.homeData
  if (!homeData) {
    throw new Error(
      `Home Data not present. useSaves() must not be called in a component that is not descended from a SavesProvider.`
    )
  }

  const loadedHomeData = homeData

  const saveFromIdentifier = useCallback(
    (identifier: SaveIdentifier) => openSavesState.openSaves[identifier].save,
    [openSavesState.openSaves]
  )

  const switchToBank = useCallback(
    (bankIndex: number) => {
      openSavesDispatch({
        type: 'set_current_home_bank',
        payload: { bank: bankIndex },
      })
    },
    [openSavesDispatch]
  )

  const setCurrentBankName = useCallback(
    (newName: string | undefined) => {
      openSavesDispatch({
        type: 'set_home_bank_name',
        payload: { bank: loadedHomeData.currentBankIndex, name: newName },
      })
    },
    [loadedHomeData.currentBankIndex, openSavesDispatch]
  )

  const addBank = useCallback(
    (name: string | undefined, boxCount: number) => {
      openSavesDispatch({
        type: 'add_home_bank',
        payload: {
          name,
          boxCount: boxCount,
          currentCount: loadedHomeData.banks.length ?? 0,
          switchToBank: true,
        },
      })
    },
    [loadedHomeData.banks.length, openSavesDispatch]
  )

  const getMonAtHomeLocation = useCallback(
    (location: HomeMonLocation) => {
      return loadedHomeData.getAtLocation(location)
    },
    [loadedHomeData]
  )

  const getMonAtSaveLocation = useCallback(
    (location: SaveMonLocation) => {
      const save = openSavesState.openSaves[location.saveIdentifier].save
      return save.boxes[location.box].boxSlots[location.boxSlot]
    },
    [openSavesState.openSaves]
  )

  const getMonAtLocation = useCallback(
    (location: MonLocation) => {
      let identifier: OhpkmIdentifier | undefined
      if (!location.isHome) {
        const mon = getMonAtSaveLocation(location)
        if (!mon) return undefined
        return ohpkmStore.loadIfTracked(mon) ?? mon
      } else {
        identifier = getMonAtHomeLocation(location)
        if (!identifier) return undefined
        const monResult = ohpkmStore.tryLoadFromId(identifier)
        if (R.isErr(monResult)) {
          console.error('COULD NOT FIND MON WITH IDENTIFIER: ' + monResult.err.identifier)
          return undefined
        }

        return monResult.value
      }
    },
    [getMonAtHomeLocation, getMonAtSaveLocation, ohpkmStore]
  )

  const moveMonBetweenSaves = useCallback(
    (
      sourceSaveIdentifier: Option<SaveIdentifier>,
      mon: PKMInterface | undefined,
      dest: SaveMonLocation
    ): Option<PKMInterface> => {
      const sourceSave = sourceSaveIdentifier ? saveFromIdentifier(sourceSaveIdentifier) : undefined
      const destSave = openSavesState.openSaves[dest.saveIdentifier].save

      let ohpkm: Option<OHPKM>
      if (mon) {
        ohpkm = ohpkmStore.loadIfTracked(mon) ?? ohpkmStore.startTracking(mon, sourceSave)
      }

      const destSaveMon = ohpkm ? ohpkmStore.trackAndConvertForSave(ohpkm, destSave) : undefined
      const displacedMon = destSave.boxes[dest.box].boxSlots[dest.boxSlot]
      destSave.boxes[dest.box].boxSlots[dest.boxSlot] = destSaveMon
      destSave.updatedBoxSlots.push({ box: dest.box, boxSlot: dest.boxSlot })

      return displacedMon
    },
    [ohpkmStore, openSavesState.openSaves, saveFromIdentifier]
  )

  const moveOhpkmToSave = useCallback(
    (
      identifier: Option<OhpkmIdentifier>,
      dest: SaveMonLocation
    ): Result<Option<PKMInterface>, IdentifierNotPresentError> => {
      const save = openSavesState.openSaves[dest.saveIdentifier].save

      if (!identifier) {
        const displacedMon = save.boxes[dest.box].boxSlots[dest.boxSlot]
        save.boxes[dest.box].boxSlots[dest.boxSlot] = undefined
        save.updatedBoxSlots.push({ box: dest.box, boxSlot: dest.boxSlot })
        return R.Ok(displacedMon)
      }

      const monResult = ohpkmStore.tryLoadFromId(identifier)
      if (R.isErr(monResult)) {
        return monResult
      }

      const mon = monResult.value
      const tracked = ohpkmStore.trackAndConvertForSave(mon, save)
      const displacedMon = save.boxes[dest.box].boxSlots[dest.boxSlot]
      save.boxes[dest.box].boxSlots[dest.boxSlot] = tracked
      save.updatedBoxSlots.push({ box: dest.box, boxSlot: dest.boxSlot })

      return R.Ok(displacedMon)
    },
    [ohpkmStore, openSavesState.openSaves]
  )

  const moveMonToHome = useCallback(
    <P extends PKMInterface>(
      sourceSaveIdentifier: Option<SaveIdentifier>,
      mon: Option<P>,
      location: HomeMonLocation
    ): Option<OhpkmIdentifier> => {
      const sourceSave = sourceSaveIdentifier ? saveFromIdentifier(sourceSaveIdentifier) : undefined
      const displacedMonId = getMonAtHomeLocation(location)

      let ohpkm: Option<OHPKM>
      if (mon) {
        ohpkm = ohpkmStore.loadIfTracked(mon) ?? ohpkmStore.startTracking(mon, sourceSave)
      }

      if (!mon) {
        loadedHomeData.setAtLocation(location, undefined)
      } else if (ohpkm) {
        loadedHomeData.setAtLocation(location, ohpkm.openhomeId)
      }

      return displacedMonId
    },
    [getMonAtHomeLocation, loadedHomeData, ohpkmStore, saveFromIdentifier]
  )

  const moveOhpkmToHome = useCallback(
    (
      identifier: OhpkmIdentifier | undefined,
      dest: HomeMonLocation,
      skipIfPresent: boolean = false
    ) => {
      // this is a bandaid fix for the issue of onDrop() being triggered multiple times for BoxCell. For
      // some reason it only affects the OpenHome boxes.
      if (skipIfPresent && identifier && loadedHomeData.findIfPresent(identifier)) {
        return undefined
      }

      const displacedMonId = getMonAtHomeLocation(dest)
      loadedHomeData.setAtLocation(dest, identifier)
      return displacedMonId
    },
    [getMonAtHomeLocation, loadedHomeData]
  )

  const importMonsToLocation = useCallback(
    (mons: PKMInterface[], startingAt: MonLocation) => {
      const addedMons: OHPKM[] = []
      const dest = startingAt

      if (dest.isHome) {
        let nextSlot = dest

        const currentBankBoxCount = loadedHomeData.getCurrentBankBoxes().length
        mons.forEach((mon) => {
          while (!loadedHomeData.slotIsEmpty(nextSlot) && nextSlot.box < currentBankBoxCount) {
            nextSlot.boxSlot++
            if (nextSlot.boxSlot >= OpenHomeBanks.BOX_COLUMNS * OpenHomeBanks.BOX_ROWS) {
              nextSlot.boxSlot = 0
              nextSlot.box++
            }
          }

          if (nextSlot.box < currentBankBoxCount) {
            const homeMon = mon instanceof OHPKM ? mon : new OHPKM(mon)
            ohpkmStore.insertOrUpdate(homeMon)

            moveOhpkmToHome(homeMon.openhomeId, nextSlot, true)
            addedMons.push(homeMon)
            nextSlot.boxSlot++
            if (nextSlot.boxSlot >= OpenHomeBanks.BOX_COLUMNS * OpenHomeBanks.BOX_ROWS) {
              nextSlot.boxSlot = 0
              nextSlot.box++
            }
          }
        })
      } else {
        let nextIndex = dest.boxSlot
        const tempSave = saveFromIdentifier(dest.saveIdentifier)

        mons.forEach((mon) => {
          while (
            tempSave.boxes[dest.box].boxSlots[nextIndex] &&
            nextIndex < tempSave.boxRows * tempSave.boxColumns
          ) {
            nextIndex++
          }
          if (nextIndex < tempSave.boxRows * tempSave.boxColumns) {
            const homeMon = mon instanceof OHPKM ? mon : new OHPKM(mon)

            moveMonBetweenSaves(
              undefined,
              ohpkmStore.trackAndConvertForSave(homeMon, tempSave),
              dest
            )
            addedMons.push(homeMon)
            nextIndex++
          }
        })

        openSavesState.openSaves[dest.saveIdentifier].save = tempSave
      }

      return { ...openSavesState, openSaves: { ...openSavesState.openSaves } }
    },
    [
      loadedHomeData,
      moveMonBetweenSaves,
      moveOhpkmToHome,
      ohpkmStore,
      openSavesState,
      saveFromIdentifier,
    ]
  )

  const reorderBoxesCurrentBank = useCallback(
    (idsInNewOrder: string[]) => {
      openSavesDispatch({
        type: 'reorder_home_boxes',
        payload: { idsInNewOrder },
      })
    },
    [openSavesDispatch]
  )

  const homeBoxNavigateLeft = useCallback(() => {
    const currentBankBoxCount = loadedHomeData.getCurrentBankBoxes().length
    openSavesDispatch({
      type: 'set_home_box',
      payload: {
        boxIndex:
          loadedHomeData.currentPCBox > 0
            ? loadedHomeData.currentPCBox - 1
            : currentBankBoxCount - 1,
      },
    })
  }, [loadedHomeData, openSavesDispatch])

  const homeBoxNavigateRight = useCallback(() => {
    const currentBankBoxCount = loadedHomeData.getCurrentBankBoxes().length
    openSavesDispatch({
      type: 'set_home_box',
      payload: {
        boxIndex: (loadedHomeData.currentPCBox + 1) % currentBankBoxCount,
      },
    })
  }, [loadedHomeData, openSavesDispatch])

  const homeBoxSetCurrent = useCallback(
    (index: number) => {
      openSavesDispatch({
        type: 'set_home_box',
        payload: { boxIndex: index },
      })
    },
    [openSavesDispatch]
  )

  const deleteBoxCurrentBank = useCallback(
    (boxId: string, boxIndex: number) => {
      openSavesDispatch({
        type: 'delete_home_box',
        payload: { index: boxIndex, id: boxId },
      })
    },
    [openSavesDispatch]
  )

  const setBoxNameCurrentBank = useCallback(
    (boxIndex: number, newName: string | undefined) => {
      openSavesDispatch({
        type: 'set_home_box_name',
        payload: { name: newName, index: boxIndex },
      })
    },
    [openSavesDispatch]
  )

  const removeDupesFromHomeBox = useCallback(
    (boxIndex: number) => {
      openSavesDispatch({ type: 'home_box_remove_dupes', payload: { boxIndex } })
    },
    [openSavesDispatch]
  )

  const sortHomeBox = useCallback(
    (boxIndex: number, sortType: string): Result<null, IdentifierNotPresentError[]> => {
      const loadResults = ohpkmStore.tryLoadFromIds(
        loadedHomeData.getCurrentBox().allContainedMons()
      )
      const { successes: mons, failures } = partitionResults(loadResults)
      if (failures.length) {
        return R.Err(failures)
      }

      const sorted = mons.toSorted(getSortFunctionNullable(sortType))
      const box = loadedHomeData.getCurrentBankBoxes()[boxIndex]

      for (const i of range(box.slotCount())) {
        const location: BankBoxCoordinates = {
          bank: loadedHomeData.currentBankIndex,
          box: boxIndex,
          boxSlot: i,
        }
        if (i < sorted.length) {
          loadedHomeData.setAtLocation(location, sorted[i].openhomeId)
        } else {
          loadedHomeData.clearAtLocation(location)
        }
      }

      openSavesDispatch({
        type: 'update_home_data',
        payload: { homeData: loadedHomeData },
      })

      return R.Ok(null)
    },
    [loadedHomeData, ohpkmStore, openSavesDispatch]
  )

  const sortAllHomeBoxes = useCallback(
    (sortType: string): Result<null, IdentifierNotPresentError[]> => {
      const loadResults = ohpkmStore.tryLoadFromIds(
        loadedHomeData.getCurrentBank().allContainedMons()
      )
      const { successes: allMons, failures } = partitionResults(loadResults)
      if (failures.length) {
        return R.Err(failures)
      }

      const sorted = allMons.toSorted(getSortFunctionNullable(sortType))
      const boxSize = OpenHomeBanks.BOX_COLUMNS * OpenHomeBanks.BOX_ROWS

      const currentBankIndex = loadedHomeData.currentBankIndex
      const currentBankBoxCount = loadedHomeData.getCurrentBankBoxes().length

      for (const box of range(currentBankBoxCount)) {
        for (const slot of range(boxSize)) {
          const location = {
            bank: currentBankIndex,
            box,
            boxSlot: slot,
          }
          const monIndex = box * boxSize + slot
          if (monIndex < sorted.length) {
            loadedHomeData.setAtLocation(location, sorted[monIndex].openhomeId)
          } else {
            loadedHomeData.clearAtLocation(location)
          }
        }
      }

      openSavesDispatch({
        type: 'update_home_data',
        payload: { homeData: loadedHomeData },
      })

      return R.Ok(null)
    },
    [loadedHomeData, ohpkmStore, openSavesDispatch]
  )

  const addBoxCurrentBank = useCallback(
    (location: AddBoxLocation = 'end', identifiers: BoxMonIdentifiers) => {
      openSavesDispatch({
        type: 'add_home_box',
        payload: {
          location,
          currentBoxCount: loadedHomeData.getCurrentBankBoxes().length,
          identifiers,
        },
      })
    },
    [openSavesDispatch, loadedHomeData]
  )

  const saveBoxNavigateLeft = useCallback(
    (save: SAV) => {
      openSavesDispatch({
        type: 'set_save_box',
        payload: {
          boxIndex: save.currentPCBox > 0 ? save.currentPCBox - 1 : save.boxes.length - 1,
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
          boxIndex: (save.currentPCBox + 1) % save.boxes.length,
          save,
        },
      })
    },
    [openSavesDispatch]
  )

  const addSave = useCallback(
    (save: SAV) => {
      backend.addRecentSave(getSaveRef(save))
      backend.registerInPokedex(pokedexSeenFromSave(save))
      if (save.trainerGender !== undefined) {
        const allOhpkms = ohpkmStore.getAllStored()
        for (const mon of allOhpkms) {
          if (!save.supportsMon(mon.dexNum, mon.formeNum)) continue

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
      for (const mon of save.boxes.flatMap((b) => b.boxSlots).filter(filterUndefined)) {
        const trackedData = ohpkmStore.loadIfTracked(mon)
        if (trackedData) {
          trackedData.syncWithGameData(mon, save)
        }
      }
      openSavesDispatch({ type: 'add_save', payload: save })
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
          return R.Err({ type: 'SELECT_FILE', cause: result.err })
        }
        if (!result.value) return R.Ok(undefined)
        filePath = result.value
      }

      if (allOpenSaves.some((other) => other.filePath.raw === filePath.raw)) {
        return R.Err({ type: 'ALREADY_OPEN' })
      }

      const bytesResult = await backend.loadSaveFile(filePath)
      if (R.isErr(bytesResult)) {
        return R.Err({ type: 'READ_FILE', cause: bytesResult.err })
      }

      const fileBytes = bytesResult.value.fileBytes

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
          cause: result.err,
        })
      }
      const saveFile = result.value

      if (!saveFile) {
        return R.Err({ type: 'UNRECOGNIZED' })
      } else {
        addSave(saveFile)
        return R.Ok(saveFile)
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
    (item: Item | undefined, location: MonLocation) => {
      const itemIndex = item?.index ?? 0
      let ohpkm: OHPKM
      if (location.isHome) {
        const identifier = getMonAtHomeLocation(location)
        if (!identifier) return

        const result = ohpkmStore.tryLoadFromId(identifier)
        if (R.isErr(result)) {
          return result
        }

        ohpkm = result.value
      } else {
        const mon = getMonAtSaveLocation(location)
        if (!mon) return

        const save = saveFromIdentifier(location.saveIdentifier)
        ohpkm = ohpkmStore.loadIfTracked(mon) ?? ohpkmStore.startTracking(mon, save)

        save.boxes[location.box].boxSlots[location.boxSlot] = save.convertOhpkm(ohpkm)
        save.updatedBoxSlots.push({ box: location.box, boxSlot: location.boxSlot })
      }

      ohpkm.heldItemIndex = itemIndex
      ohpkmStore.insertOrUpdate(ohpkm)

      return R.Ok(null)
    },
    [getMonAtHomeLocation, getMonAtSaveLocation, ohpkmStore, saveFromIdentifier]
  )

  const updateMonNotes = useCallback(
    (monId: string, notes: string | undefined) => {
      if (!homeData) return

      const result = ohpkmStore.tryLoadFromId(monId)
      if (R.isErr(result)) return result

      const mon = result.value
      mon.notes = notes

      ohpkmStore.insertOrUpdate(mon)
    },
    [homeData, ohpkmStore]
  )

  const updateMonMarkings = useCallback(
    (monId: string, markings: MarkingsSixShapesWithColor) => {
      if (!homeData) return

      const result = ohpkmStore.tryLoadFromId(monId)
      if (R.isErr(result)) return result

      const mon = result.value
      mon.markings = markings

      ohpkmStore.insertOrUpdate(mon)
    },
    [homeData, ohpkmStore]
  )

  function moveMon(source: MonLocation, dest: MonLocation) {
    if (source.isHome) {
      const sourceMonId = getMonAtHomeLocation(source)
      if (!sourceMonId) return

      if (dest.isHome) {
        const displacedMonId = moveOhpkmToHome(sourceMonId, dest)
        moveOhpkmToHome(displacedMonId, source)
      } else {
        const result = moveOhpkmToSave(sourceMonId, dest)
        if (R.isErr(result)) {
          return result
        }

        const displacedMon = result.value
        moveMonToHome(dest.saveIdentifier, displacedMon, source)
      }
    } else if (!dest.isHome && source.saveIdentifier === dest.saveIdentifier) {
      moveMonWithinSave(saveFromIdentifier(source.saveIdentifier), source, dest)
    } else {
      const sourceMon = getMonAtSaveLocation(source)
      if (!sourceMon) return

      if (dest.isHome) {
        const displacedMonId = moveMonToHome(source.saveIdentifier, sourceMon, dest)
        moveOhpkmToSave(displacedMonId, source)
      } else {
        const displacedMon = moveMonBetweenSaves(source.saveIdentifier, sourceMon, dest)
        moveMonBetweenSaves(dest.saveIdentifier, displacedMon, source)
      }
    }

    openSavesDispatch({ type: 'set_home_data', payload: loadedHomeData })
  }

  const releaseMonById = useCallback(
    (id: OhpkmIdentifier) => {
      openSavesDispatch({ type: 'release_mon_by_id', payload: id })
      const location = loadedHomeData.findIfPresent(id)
      if (location) {
        loadedHomeData.setAtLocation(location, undefined)
        openSavesDispatch({ type: 'set_home_data', payload: loadedHomeData.clone() })
      }
    },
    [loadedHomeData, openSavesDispatch]
  )

  const releaseMonAtLocation = useCallback(
    (location: MonLocation) => {
      if (location.isHome) {
        const identifier = moveOhpkmToHome(undefined, location)
        if (!identifier) return // slot is empty

        openSavesDispatch({
          type: 'release_mon_by_id',
          payload: identifier,
        })
      } else {
        const releasedMon = moveMonBetweenSaves(undefined, undefined, location)
        if (!releasedMon) return

        openSavesDispatch({
          type: 'release_mon_by_id',
          payload: ohpkmStore.getIdIfTracked(releasedMon) ?? releasedMon,
        })
      }
    },
    [moveMonBetweenSaves, moveOhpkmToHome, ohpkmStore, openSavesDispatch]
  )

  const releaseMonsById = useCallback(
    (...ids: OhpkmIdentifier[]) => {
      ids.forEach(releaseMonById)
    },
    [releaseMonById]
  )

  const recoverMonToBox = useCallback(
    (id: OhpkmIdentifier, boxIndex: number) => {
      const box = loadedHomeData.getCurrentBank().getBox(boxIndex)
      if (!box) {
        console.error(`box does not exist (index ${boxIndex})`)
        return
      }

      const firstEmptyIndex = box.firstEmptyIndex()
      if (firstEmptyIndex === undefined) {
        console.error(`box at index ${boxIndex} is full`)
        return
      }

      const updatedHomeData = loadedHomeData.clone()
      updatedHomeData.setAtLocation(
        { bank: updatedHomeData.currentBankIndex, box: boxIndex, boxSlot: firstEmptyIndex },
        id
      )

      openSavesDispatch({ type: 'update_home_data', payload: { homeData: updatedHomeData } })
    },
    [loadedHomeData, openSavesDispatch]
  )

  function newBoxesWithIds(ids: OhpkmIdentifier[], boxName?: string): Option<number> {
    if (ids.length === 0) return undefined

    const updatedHomeData = loadedHomeData.clone()
    const firstNewBoxIndex = updatedHomeData.getCurrentBankBoxes().length

    for (let i = 0; i < ids.length; i += OpenHomeBanks.SLOTS_PER_BOX) {
      const identifiers: BoxMonIdentifiers = new Map()
      for (let slot = 0; slot < OpenHomeBanks.SLOTS_PER_BOX; slot++) {
        identifiers.set(slot, ids[i + slot])
      }
      updatedHomeData.addBoxCurrentBank('end', boxName, identifiers)
    }

    openSavesDispatch({ type: 'update_home_data', payload: { homeData: updatedHomeData } })

    return firstNewBoxIndex
  }

  return {
    ...openSavesState,
    allOpenSaves,
    homeData: loadedHomeData,

    switchToBank,
    setCurrentBankName,
    addBank,
    setBoxNameCurrentBank,
    reorderBoxesCurrentBank,

    removeDupesFromHomeBox,
    sortHomeBox,
    sortAllHomeBoxes,

    addBoxCurrentBank,
    deleteBoxCurrentBank,
    importMonsToLocation,
    newBoxesWithIds,

    homeBoxNavigateLeft,
    homeBoxNavigateRight,
    homeBoxSetCurrent,

    addSave,
    buildAndOpenSave,
    removeSave,
    saveBoxNavigateLeft,
    saveBoxNavigateRight,
    saveFromIdentifier,

    getMonAtLocation,
    setMonHeldItem,
    updateMonNotes,
    updateMonMarkings,
    moveMon,
    recoverMonToBox,

    releaseMonAtLocation,
    releaseMonsById,
    trackedMonsToRelease: openSavesState.monsToRelease.filter(
      (toRelease) => typeof toRelease === 'string'
    ),
  }
}

function moveMonWithinSave(save: SAV, source: SaveMonLocation, dest: SaveMonLocation) {
  const sourceMon = save.boxes[source.box].boxSlots[source.boxSlot]
  const displacedMon = save.boxes[dest.box].boxSlots[dest.boxSlot]
  save.boxes[dest.box].boxSlots[dest.boxSlot] = sourceMon
  save.updatedBoxSlots.push({ box: dest.box, boxSlot: dest.boxSlot })
  save.boxes[source.box].boxSlots[source.boxSlot] = displacedMon
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

export type SaveErrorType = SaveError['type']

export function pokedexSeenFromSave(saveFile: SAV) {
  const pokedexUpdates: PokedexUpdate[] = []

  for (const mon of saveFile.boxes.flatMap((box) => box.boxSlots).filter(filterUndefined)) {
    pokedexUpdates.push({
      dexNumber: mon.dexNum,
      formeNumber: mon.formeNum,
      status: 'Seen',
    })

    if (isBattleFormeItem(mon.dexNum, mon.heldItemIndex)) {
      pokedexUpdates.push({
        dexNumber: mon.dexNum,
        formeNumber: displayIndexAdder(mon.heldItemIndex)(mon.formeNum),
        status: 'Seen',
      })
    }
  }

  return pokedexUpdates
}
