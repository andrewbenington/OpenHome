import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { AddBoxLocation, HomeData } from '@openhome-core/save/HomeData'
import { Box, SAV } from '@openhome-core/save/interfaces'
import { OpenHomeBox } from '@openhome-core/save/util/storage'
import { Item } from '@pkm-rs/pkg'
import { MarkingsSixShapesWithColor } from '@pokemon-files/util'
import { useCallback, useContext } from 'react'
import { OhpkmIdentifier } from '../../../core/pkm/Lookup'
import { Option, R, Result } from '../../../core/util/functional'
import { isTracked, MaybeTracked } from '../../../tracker'
import { IdentifierNotPresentError, useOhpkmStore } from '../ohpkm/useOhpkmStore'
import {
  HomeMonLocation,
  MonLocation,
  MonWithLocation,
  OpenSavesState,
  SaveMonLocation,
  SavesContext,
  saveToStringIdentifier,
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

  const importMonsToLocation = useCallback(
    (mons: PKMInterface[], startingAt: MonLocation) => {
      openSavesDispatch({
        type: 'import_mons',
        payload: {
          mons,
          dest: {
            bank: loadedHomeData.getCurrentBank().index,
            box: startingAt.box,
            box_slot: startingAt.box_slot,
            is_home: true,
          },
        },
      })
    },
    [loadedHomeData, openSavesDispatch]
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
    (boxIndex: number, sortType: string) => {
      openSavesDispatch({
        type: 'sort_home_box',
        payload: { boxIndex, sortType },
      })
    },
    [openSavesDispatch]
  )

  const sortAllHomeBoxes = useCallback(
    (sortType: string) => {
      openSavesDispatch({
        type: 'sort_all_home_boxes',
        payload: { sortType },
      })
    },
    [openSavesDispatch]
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

          ohpkmStore.overwrite(mon)
          const location = findMon(mon.getHomeIdentifier())
          if (location) {
            openSavesDispatch({
              type: 'update_home_mon',
              payload: {
                location,
                updater: (_) => mon,
              },
            })
          }
        }
      }
      openSavesDispatch({ type: 'add_save', payload: save })
    },
    [openSavesDispatch, findMon, ohpkmStore]
  )

  const removeSave = useCallback(
    (save: SAV) => {
      openSavesDispatch({ type: 'remove_save', payload: save })
    },
    [openSavesDispatch]
  )

  const setMonHeldItem = useCallback(
    (item: Item | undefined, location: MonLocation) => {
      openSavesDispatch({
        type: 'set_mon_item',
        payload: { item, dest: location },
      })
    },
    [openSavesDispatch]
  )

  const updateMonNotes = useCallback(
    (monId: string, notes: string | undefined) => {
      if (!homeData) return

      const location: MonLocation | undefined = findMon(monId)
      if (!location) return

      openSavesDispatch({
        type: 'update_home_mon',
        payload: {
          location: location,
          updater: (mon) => {
            mon.notes = notes
            return mon
          },
        },
      })
    },
    [homeData, findMon, openSavesDispatch]
  )

  const updateMonMarkings = useCallback(
    (monId: string, markings: MarkingsSixShapesWithColor) => {
      if (!homeData) return

      const location: MonLocation | undefined = findMon(monId)
      if (!location) return

      openSavesDispatch({
        type: 'update_home_mon',
        payload: {
          location: location,
          updater: (mon) => {
            mon.markings = markings
            return mon
          },
        },
      })
    },
    [homeData, findMon, openSavesDispatch]
  )

  const moveMon1 = useCallback(
    (source: MonWithLocation, dest: MonLocation) => {
      openSavesDispatch({ type: 'move_mon', payload: { source, dest } })
    },
    [openSavesDispatch]
  )

  function moveMon(source: MonLocation, dest: MonLocation) {
    if (source.is_home) {
      const sourceMonId = getMonAtHomeLocation(source)
      if (!sourceMonId) return

      if (dest.is_home) {
        const displacedMonId = moveOhpkmToHome(sourceMonId, dest)
        if (displacedMonId !== undefined) {
          moveOhpkmToHome(displacedMonId, source)
        }
      }
    } else {
      const sourceMon = getMonAtSaveLocation(source)
      if (!sourceMon) return

      if (dest.is_home) {
        const displacedMonId = moveMonToHome(sourceMon, dest)
        if (displacedMonId !== undefined) {
          moveOhpkmToSave(displacedMonId, source)
        }
      } else {
        const result = moveMonToSave(sourceMon, dest)
        if (R.isErr(result)) {
          return result
        }

        const displacedMon = result.value
        if (displacedMon) {
          moveMonToSave(displacedMon, source)
        }
      }
    }

    openSavesDispatch({ type: 'set_home_data', payload: loadedHomeData })
  }

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
      const save = openSavesState.openSaves[saveToStringIdentifier(location.save)].save
      return save.boxes[location.box].boxSlots[location.box_slot]
    },
    [openSavesState.openSaves]
  )

  const getMonAtLocation = useCallback(
    (location: MonLocation) => {
      let identifier: OhpkmIdentifier | undefined
      if (!location.is_home) {
        const maybeTracked = getMonAtSaveLocation(location)
        if (!maybeTracked) return undefined
        if (!isTracked(maybeTracked)) return maybeTracked?.data

        identifier = maybeTracked.identifier
      } else {
        identifier = getMonAtHomeLocation(location)
      }

      if (!identifier) return undefined

      const monResult = ohpkmStore.tryLoadFromId(identifier)
      if (R.isErr(monResult)) {
        console.error(`COULD NOT FIND MON WITH IDENTIFIER: ${monResult.err.identifier}`)
        return undefined
      }

      return monResult.value
    },
    [getMonAtHomeLocation, getMonAtSaveLocation, ohpkmStore]
  )

  function moveMonToSave(
    maybeTracked: MaybeTracked,
    dest: SaveMonLocation
  ): Result<Option<MaybeTracked>, IdentifierNotPresentError> {
    const save = openSavesState.openSaves[saveToStringIdentifier(dest.save)].save

    let ohpkm: OHPKM
    if (isTracked(maybeTracked)) {
      const monResult = ohpkmStore.tryLoadFromId(maybeTracked.identifier)
      if (R.isErr(monResult)) {
        return monResult
      }

      ohpkm = monResult.value
    } else {
      ohpkm = new OHPKM(maybeTracked.data)
    }

    const tracked = ohpkmStore.tracker.wrapWithIdentifier(save.convertOhpkm(ohpkm))
    const displacedMon = save.boxes[dest.box].boxSlots[dest.box_slot]
    save.boxes[dest.box].boxSlots[dest.box_slot] = tracked

    return R.Ok(displacedMon)
  }

  function moveOhpkmToSave(
    identifier: OhpkmIdentifier,
    dest: SaveMonLocation
  ): Result<Option<MaybeTracked>, IdentifierNotPresentError> {
    const save = openSavesState.openSaves[saveToStringIdentifier(dest.save)].save
    const monResult = ohpkmStore.tryLoadFromId(identifier)
    if (R.isErr(monResult)) {
      return monResult
    }

    const mon = monResult.value
    const tracked = ohpkmStore.tracker.wrapWithIdentifier(save.convertOhpkm(mon))
    const displacedMon = save.boxes[dest.box].boxSlots[dest.box_slot]
    save.boxes[dest.box].boxSlots[dest.box_slot] = tracked

    return R.Ok(displacedMon)
  }

  function moveMonToHome<P extends PKMInterface>(
    maybeTracked: MaybeTracked<P>,
    location: HomeMonLocation
  ): Option<OhpkmIdentifier> {
    const displacedMonId = getMonAtHomeLocation(location)

    if (isTracked(maybeTracked)) {
      loadedHomeData.setPokemon(location, maybeTracked.identifier)
    } else {
      const ohpkm = new OHPKM(maybeTracked.data)
      ohpkmStore.overwrite(ohpkm)
      loadedHomeData.setPokemon(location, ohpkm.getHomeIdentifier())
    }

    return displacedMonId
  }

  function moveOhpkmToHome(identifier: OhpkmIdentifier, dest: HomeMonLocation) {
    const displacedMonId = getMonAtHomeLocation(dest)
    loadedHomeData.setPokemon(dest, identifier)
    return displacedMonId
  }

  const releaseMonAtLocation = useCallback(
    (location: MonLocation) => {
      openSavesDispatch({
        type: 'add_mon_to_release',
        payload: location,
      })
    },
    [openSavesDispatch]
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
      return { box: boxIndex, box_slot: boxSlot, is_home: false, save }
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
  for (const [boxSlotStr, identifier] of Object.entries(box.identifiers)) {
    if (identifier === monId)
      return { box: box.index, box_slot: parseInt(boxSlotStr), bank: bankIndex, is_home: true }
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
