import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { AddBoxLocation, HomeData } from '@openhome-core/save/HomeData'
import { Box, SAV } from '@openhome-core/save/interfaces'
import { OpenHomeBox } from '@openhome-core/save/util/storage'
import { Item } from '@pkm-rs/pkg'
import { MarkingsSixShapesWithColor } from '@pokemon-files/util'
import { useCallback, useContext } from 'react'
import { OhpkmIdentifier } from '../../../core/pkm/Lookup'
import { useOhpkmStore } from '../ohpkm/useOhpkmStore'
import { MonLocation, MonWithLocation, OpenSavesState, SavesContext } from './reducer'

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
        payload: { bank: bankIndex, getMonById: ohpkmStore.getById },
      })
    },
    [openSavesDispatch, ohpkmStore.getById]
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
          getMonById: ohpkmStore.getById,
        },
      })
    },
    [loadedHomeData.banks.length, openSavesDispatch, ohpkmStore.getById]
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
        payload: { boxIndex, sortType, getMonById: ohpkmStore.getById },
      })
    },
    [openSavesDispatch, ohpkmStore.getById]
  )

  const sortAllHomeBoxes = useCallback(
    (sortType: string) => {
      openSavesDispatch({
        type: 'sort_all_home_boxes',
        payload: { sortType, getMonById: ohpkmStore.getById },
      })
    },
    [openSavesDispatch, ohpkmStore.getById]
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

  const getMonAtLocation = useCallback(
    (location: MonLocation) => {
      if (location.is_home) {
        return loadedHomeData.boxes[location.box].pokemon[location.box_slot]
      }

      return location.save.boxes[location.box].pokemon[location.box_slot]
    },
    [loadedHomeData]
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

  const moveMon = useCallback(
    (source: MonWithLocation, dest: MonLocation) => {
      openSavesDispatch({ type: 'move_mon', payload: { source, dest } })
    },
    [openSavesDispatch]
  )

  function moveMon2(identifier: OhpkmIdentifier, source: MonLocation, dest: MonLocation) {}

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
  for (const [boxSlot, mon] of box.pokemon.entries()) {
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
