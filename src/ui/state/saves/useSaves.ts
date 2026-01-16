import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { AddBoxLocation, HomeData } from '@openhome-core/save/HomeData'
import { Box, SAV } from '@openhome-core/save/interfaces'
import { OpenHomeBox } from '@openhome-core/save/util/storage'
import { Item } from '@pkm-rs/pkg'
import { MarkingsSixShapesWithColor } from '@pokemon-files/util'
import { useCallback, useContext } from 'react'
import { OhpkmIdentifier } from '../../../core/pkm/Lookup'
import { getSortFunctionNullable } from '../../../core/pkm/sort'
import { Option, partitionResults, R, range, Result } from '../../../core/util/functional'
import { filterUndefined } from '../../../core/util/sort'
import { IdentifierNotPresentError, useOhpkmStore } from '../ohpkm/useOhpkmStore'
import {
  HomeMonLocation,
  MonLocation,
  MonWithLocation,
  OpenSavesState,
  SaveIdentifier,
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
  addBoxCurrentBank(position: AddBoxLocation): void
  deleteBoxCurrentBank(boxId: string, boxIndex: number): void

  homeBoxNavigateLeft(): void
  homeBoxNavigateRight(): void

  importMonsToLocation(mons: PKMInterface[], startingAt: MonLocation): void

  addSave(save: SAV): void
  removeSave(save: SAV): void
  saveBoxNavigateLeft(save: SAV): void
  saveBoxNavigateRight(save: SAV): void
  saveFromIdentifier: (identifier: SaveIdentifier) => SAV

  getMonAtLocation(location: MonLocation): PKMInterface | OHPKM | undefined
  setMonHeldItem(item: Item | undefined, location: MonLocation): void
  updateMonNotes(monId: string, notes: string | undefined): void
  updateMonMarkings(monId: string, markings: MarkingsSixShapesWithColor): void
  moveMon(source: MonWithLocation, dest: MonLocation): void
  releaseMonAtLocation(location: MonLocation): void
}

export function useSaves(): SavesAndBanksManager {
  const ohpkmStore = useOhpkmStore()
  const [openSavesState, openSavesDispatch, allOpenSaves] = useContext(SavesContext)

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

  const findMon = useCallback(
    (monId: string) => {
      return (
        findMonInHome(monId, loadedHomeData) ??
        allOpenSaves.reduce<MonLocation | undefined>(
          (foundSaveMon, save) => foundSaveMon ?? findMonInSave(monId, save),
          undefined
        )
      )
    },
    [loadedHomeData, allOpenSaves]
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
      return loadedHomeData.banks[location.bank].boxes[location.box].identifiers.get(
        location.box_slot
      )
    },
    [loadedHomeData.banks]
  )

  const getMonAtSaveLocation = useCallback(
    (location: SaveMonLocation) => {
      const save = openSavesState.openSaves[location.saveIdentifier].save
      return save.boxes[location.box].boxSlots[location.box_slot]
    },
    [openSavesState.openSaves]
  )

  const getMonAtLocation = useCallback(
    (location: MonLocation) => {
      let identifier: OhpkmIdentifier | undefined
      if (!location.is_home) {
        const mon = getMonAtSaveLocation(location)
        if (!mon) return undefined
        return ohpkmStore.tracker.loadIfTracked(mon) ?? mon
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
        ohpkm = ohpkmStore.tracker.loadIfTracked(mon) ?? ohpkmStore.startTracking(mon, sourceSave)
      }

      const destSaveMon = ohpkm ? ohpkmStore.trackAndConvertForSave(ohpkm, destSave) : undefined
      const displacedMon = destSave.boxes[dest.box].boxSlots[dest.box_slot]
      destSave.boxes[dest.box].boxSlots[dest.box_slot] = destSaveMon
      destSave.updatedBoxSlots.push({ box: dest.box, index: dest.box_slot })

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
        const displacedMon = save.boxes[dest.box].boxSlots[dest.box_slot]
        save.boxes[dest.box].boxSlots[dest.box_slot] = undefined
        save.updatedBoxSlots.push({ box: dest.box, index: dest.box_slot })
        return R.Ok(displacedMon)
      }

      const monResult = ohpkmStore.tryLoadFromId(identifier)
      if (R.isErr(monResult)) {
        return monResult
      }

      const mon = monResult.value
      const tracked = ohpkmStore.trackAndConvertForSave(mon, save)
      const displacedMon = save.boxes[dest.box].boxSlots[dest.box_slot]
      save.boxes[dest.box].boxSlots[dest.box_slot] = tracked
      save.updatedBoxSlots.push({ box: dest.box, index: dest.box_slot })

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
        ohpkm = ohpkmStore.tracker.loadIfTracked(mon) ?? ohpkmStore.startTracking(mon, sourceSave)
      }

      if (!mon) {
        loadedHomeData.setPokemon(location, undefined)
      } else if (ohpkm) {
        loadedHomeData.setPokemon(location, ohpkm.getHomeIdentifier())
      }

      return displacedMonId
    },
    [getMonAtHomeLocation, loadedHomeData, ohpkmStore, saveFromIdentifier]
  )

  const moveOhpkmToHome = useCallback(
    (identifier: OhpkmIdentifier | undefined, dest: HomeMonLocation) => {
      const displacedMonId = getMonAtHomeLocation(dest)
      loadedHomeData.setPokemon(dest, identifier)
      return displacedMonId
    },
    [getMonAtHomeLocation, loadedHomeData]
  )

  const importMonsToLocation = useCallback(
    (mons: PKMInterface[], startingAt: MonLocation) => {
      const addedMons: OHPKM[] = []
      const dest = startingAt

      if (dest.is_home) {
        let nextSlot = dest

        mons.forEach((mon) => {
          while (
            !loadedHomeData.slotIsEmpty(nextSlot) &&
            nextSlot.box < loadedHomeData.getCurrentBank().boxes.length
          ) {
            nextSlot.box_slot++
            if (nextSlot.box_slot >= HomeData.BOX_COLUMNS * HomeData.BOX_ROWS) {
              nextSlot.box_slot = 0
              nextSlot.box++
            }
          }

          if (nextSlot.box < loadedHomeData.getCurrentBank().boxes.length) {
            const homeMon = mon instanceof OHPKM ? mon : new OHPKM(mon)
            ohpkmStore.insertOrUpdate(homeMon)

            moveOhpkmToHome(homeMon.getHomeIdentifier(), nextSlot)
            addedMons.push(homeMon)
            nextSlot.box_slot++
            if (nextSlot.box_slot >= HomeData.BOX_COLUMNS * HomeData.BOX_ROWS) {
              nextSlot.box_slot = 0
              nextSlot.box++
            }
          }
        })
      } else {
        let nextIndex = dest.box_slot
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
    openSavesDispatch({
      type: 'set_home_box',
      payload: {
        boxIndex:
          loadedHomeData.currentPCBox > 0
            ? loadedHomeData.currentPCBox - 1
            : loadedHomeData.boxes.length - 1,
      },
    })
  }, [loadedHomeData.currentPCBox, loadedHomeData.boxes.length, openSavesDispatch])

  const homeBoxNavigateRight = useCallback(() => {
    openSavesDispatch({
      type: 'set_home_box',
      payload: {
        boxIndex: (loadedHomeData.currentPCBox + 1) % loadedHomeData.boxes.length,
      },
    })
  }, [loadedHomeData.currentPCBox, loadedHomeData.boxes.length, openSavesDispatch])

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
        loadedHomeData.boxes[boxIndex].boxSlots.filter(filterUndefined)
      )
      const { successes: mons, failures } = partitionResults(loadResults)
      if (failures.length) {
        return R.Err(failures)
      }

      const sorted = mons.toSorted(getSortFunctionNullable(sortType))
      for (const i of range(loadedHomeData.boxes[boxIndex].boxSlots.length)) {
        if (i < sorted.length) {
          loadedHomeData.boxes[boxIndex].boxSlots[i] = sorted[i].getHomeIdentifier()
        } else {
          loadedHomeData.boxes[boxIndex].boxSlots[i] = undefined
        }
      }

      loadedHomeData.syncBankToBoxes()
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
        loadedHomeData.boxes.flatMap((box) => box.boxSlots).filter(filterUndefined)
      )
      const { successes: allMons, failures } = partitionResults(loadResults)
      if (failures.length) {
        return R.Err(failures)
      }

      const sorted = allMons.toSorted(getSortFunctionNullable(sortType))
      const boxSize = HomeData.BOX_COLUMNS * HomeData.BOX_ROWS

      for (const box of range(loadedHomeData.boxes.length)) {
        for (const slot of range(boxSize)) {
          const monIndex = box * boxSize + slot
          if (monIndex < sorted.length) {
            loadedHomeData.boxes[box].boxSlots[slot] = sorted[monIndex].getHomeIdentifier()
          } else {
            loadedHomeData.boxes[box].boxSlots[slot] = undefined
          }
        }
      }

      loadedHomeData.syncBankToBoxes()
      openSavesDispatch({
        type: 'update_home_data',
        payload: { homeData: loadedHomeData },
      })

      return R.Ok(null)
    },
    [loadedHomeData, ohpkmStore, openSavesDispatch]
  )

  const addBoxCurrentBank = useCallback(
    (location: AddBoxLocation = 'end') => {
      openSavesDispatch({
        type: 'add_home_box',
        payload: { location, currentBoxCount: loadedHomeData.boxes.length },
      })
    },
    [openSavesDispatch, loadedHomeData.boxes.length]
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
        const trackedData = ohpkmStore.tracker.loadIfTracked(mon)
        if (trackedData) {
          trackedData.syncWithGameData(mon, save)
        }
      }
      openSavesDispatch({ type: 'add_save', payload: save })
    },
    [openSavesDispatch, ohpkmStore]
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
      if (location.is_home) {
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
        ohpkm = ohpkmStore.tracker.loadIfTracked(mon) ?? ohpkmStore.startTracking(mon, save)

        save.boxes[location.box].boxSlots[location.box_slot] = save.convertOhpkm(ohpkm)
        save.updatedBoxSlots.push({ box: location.box, index: location.box_slot })
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

      const location: MonLocation | undefined = findMon(monId)
      if (!location) return

      const result = ohpkmStore.tryLoadFromId(monId)
      if (R.isErr(result)) return result

      const mon = result.value
      mon.notes = notes

      ohpkmStore.insertOrUpdate(mon)
    },
    [homeData, findMon, ohpkmStore]
  )

  const updateMonMarkings = useCallback(
    (monId: string, markings: MarkingsSixShapesWithColor) => {
      if (!homeData) return

      const location: MonLocation | undefined = findMon(monId)
      if (!location) return

      const result = ohpkmStore.tryLoadFromId(monId)
      if (R.isErr(result)) return result

      const mon = result.value
      mon.markings = markings

      ohpkmStore.insertOrUpdate(mon)
    },
    [homeData, findMon, ohpkmStore]
  )

  // const moveMon1 = useCallback(
  //   (source: MonWithLocation, dest: MonLocation) => {
  //     openSavesDispatch({ type: 'move_mon', payload: { source, dest } })
  //   },
  //   [openSavesDispatch]
  // )

  function moveMon(source: MonLocation, dest: MonLocation) {
    if (source.is_home) {
      const sourceMonId = getMonAtHomeLocation(source)
      if (!sourceMonId) return

      if (dest.is_home) {
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
    } else if (!dest.is_home && source.saveIdentifier === dest.saveIdentifier) {
      moveMonWithinSave(saveFromIdentifier(source.saveIdentifier), source, dest)
    } else {
      const sourceMon = getMonAtSaveLocation(source)
      if (!sourceMon) return

      if (dest.is_home) {
        const displacedMonId = moveMonToHome(source.saveIdentifier, sourceMon, dest)
        moveOhpkmToSave(displacedMonId, source)
      } else {
        const displacedMon = moveMonBetweenSaves(source.saveIdentifier, sourceMon, dest)
        moveMonBetweenSaves(dest.saveIdentifier, displacedMon, source)
      }
    }

    openSavesDispatch({ type: 'set_home_data', payload: loadedHomeData })
  }

  const releaseMonAtLocation = useCallback(
    (location: MonLocation) => {
      if (location.is_home) {
        const identifier = moveOhpkmToHome(undefined, location)
        if (!identifier) return // slot is empty

        openSavesDispatch({
          type: 'add_mon_to_release',
          payload: identifier,
        })
      } else {
        const releasedMon = moveMonBetweenSaves(undefined, undefined, location)
        if (!releasedMon) return

        openSavesDispatch({
          type: 'add_mon_to_release',
          payload: ohpkmStore.getIdIfTracked(releasedMon) ?? releasedMon,
        })
      }
    },
    [moveMonBetweenSaves, moveOhpkmToHome, ohpkmStore, openSavesDispatch]
  )

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

    homeBoxNavigateLeft,
    homeBoxNavigateRight,

    addSave,
    removeSave,
    saveBoxNavigateLeft,
    saveBoxNavigateRight,
    saveFromIdentifier,

    getMonAtLocation,
    setMonHeldItem,
    updateMonNotes,
    updateMonMarkings,
    moveMon,
    releaseMonAtLocation,
  }
}

function findMonInBox(
  box: Box<PKMInterface>,
  boxIndex: number,
  monId: string,
  save: SAV
): MonLocation | undefined {
  for (const [boxSlot, mon] of box.boxSlots.entries()) {
    if (mon instanceof OHPKM && mon.getHomeIdentifier() === monId) {
      return {
        box: boxIndex,
        box_slot: boxSlot,
        is_home: false,
        saveIdentifier: save.identifier,
      }
    }
  }
}

function findMonInSave(monId: string, save: SAV): MonLocation | undefined {
  for (const [boxIndex, box] of save.boxes.entries()) {
    return findMonInBox(box, boxIndex, monId, save)
  }
}

function findMonInHomeBox(
  box: OpenHomeBox,
  monId: string,
  bankIndex: number
): MonLocation | undefined {
  for (const [boxSlot, identifier] of box.identifiers.entries()) {
    if (identifier === monId)
      return { box: box.index, box_slot: boxSlot, bank: bankIndex, is_home: true }
  }
}

function findMonInHome(monId: string, homeData: HomeData): MonLocation | undefined {
  for (const [bankIndex, bank] of homeData.banks.entries()) {
    for (const box of bank.boxes) {
      const found = findMonInHomeBox(box, monId, bankIndex)
      if (found) return found
    }
  }
}

function moveMonWithinSave(save: SAV, source: SaveMonLocation, dest: SaveMonLocation) {
  const sourceMon = save.boxes[source.box].boxSlots[source.box_slot]
  const displacedMon = save.boxes[dest.box].boxSlots[dest.box_slot]
  save.boxes[dest.box].boxSlots[dest.box_slot] = sourceMon
  save.updatedBoxSlots.push({ box: dest.box, index: dest.box_slot })
  save.boxes[source.box].boxSlots[source.box_slot] = displacedMon
  save.updatedBoxSlots.push({ box: source.box, index: source.box_slot })
}
