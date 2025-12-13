import { Item } from '@pkm-rs/pkg'
import { useContext } from 'react'
import { PKMInterface } from 'src/types/interfaces'
import { OHPKM } from 'src/types/pkm/OHPKM'
import { AddBoxLocation, HomeData } from 'src/types/SAVTypes/HomeData'
import { Box, SAV } from 'src/types/SAVTypes/SAV'
import { OpenHomeBox } from 'src/types/storage'
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

  function findMon(monId: string) {
    return (
      findMonInHome(monId, loadedHomeData) ??
      allOpenSaves.reduce<MonLocation | undefined>(
        (foundSaveMon, save) => foundSaveMon ?? findMonInSave(monId, save),
        undefined
      )
    )
  }

  function switchToBank(bankIndex: number) {
    openSavesDispatch({
      type: 'set_current_home_bank',
      payload: { bank: bankIndex, getMonById: ohpkmStore.getById },
    })
  }

  function setCurrentBankName(newName: string | undefined) {
    openSavesDispatch({
      type: 'set_home_bank_name',
      payload: { bank: loadedHomeData.currentBankIndex, name: newName },
    })
  }

  function addBank(name: string | undefined, boxCount: number) {
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
  }

  function importMonsToLocation(mons: PKMInterface[], startingAt: MonLocation) {
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
  }

  function reorderBoxesCurrentBank(idsInNewOrder: string[]) {
    openSavesDispatch({
      type: 'reorder_home_boxes',
      payload: { idsInNewOrder },
    })
  }

  function homeBoxNavigateLeft() {
    openSavesDispatch({
      type: 'set_home_box',
      payload: {
        boxIndex:
          loadedHomeData.currentPCBox > 0
            ? loadedHomeData.currentPCBox - 1
            : loadedHomeData.boxes.length - 1,
      },
    })
  }

  function homeBoxNavigateRight() {
    openSavesDispatch({
      type: 'set_home_box',
      payload: {
        boxIndex: (loadedHomeData.currentPCBox + 1) % loadedHomeData.boxes.length,
      },
    })
  }

  function deleteBoxCurrentBank(boxId: string, boxIndex: number) {
    openSavesDispatch({
      type: 'delete_home_box',
      payload: { index: boxIndex, id: boxId },
    })
  }

  function setBoxNameCurrentBank(boxIndex: number, newName: string | undefined) {
    openSavesDispatch({
      type: 'set_home_box_name',
      payload: { name: newName, index: boxIndex },
    })
  }

  function removeDupesFromHomeBox(boxIndex: number) {
    openSavesDispatch({ type: 'home_box_remove_dupes', payload: { boxIndex } })
  }

  function sortHomeBox(boxIndex: number, sortType: string) {
    openSavesDispatch({
      type: 'sort_home_box',
      payload: { boxIndex, sortType, getMonById: ohpkmStore.getById },
    })
  }

  function sortAllHomeBoxes(sortType: string) {
    openSavesDispatch({
      type: 'sort_all_home_boxes',
      payload: { sortType, getMonById: ohpkmStore.getById },
    })
  }

  function addBoxCurrentBank(location: AddBoxLocation = 'end') {
    openSavesDispatch({
      type: 'add_home_box',
      payload: { location, currentBoxCount: loadedHomeData.boxes.length },
    })
  }

  function saveBoxNavigateLeft(save: SAV) {
    openSavesDispatch({
      type: 'set_save_box',
      payload: {
        boxIndex: save.currentPCBox > 0 ? save.currentPCBox - 1 : save.boxes.length - 1,
        save,
      },
    })
  }

  function saveBoxNavigateRight(save: SAV) {
    openSavesDispatch({
      type: 'set_save_box',
      payload: {
        boxIndex: (save.currentPCBox + 1) % save.boxes.length,
        save,
      },
    })
  }

  function addSave(save: SAV) {
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
  }

  function removeSave(save: SAV) {
    openSavesDispatch({ type: 'remove_save', payload: save })
  }

  function getMonAtLocation(location: MonLocation) {
    if (location.is_home) {
      return loadedHomeData.boxes[location.box].pokemon[location.box_slot]
    }

    return location.save.boxes[location.box].pokemon[location.box_slot]
  }

  function setMonHeldItem(item: Item | undefined, location: MonLocation) {
    openSavesDispatch({
      type: 'set_mon_item',
      payload: { item, dest: location },
    })
  }

  function updateMonNotes(monId: string, notes: string | undefined) {
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
  }

  function moveMon(source: MonWithLocation, dest: MonLocation) {
    openSavesDispatch({ type: 'move_mon', payload: { source, dest } })
  }

  function releaseMonAtLocation(location: MonLocation) {
    openSavesDispatch({
      type: 'add_mon_to_release',
      payload: location,
    })
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

    homeBoxNavigateLeft,
    homeBoxNavigateRight,

    addSave,
    removeSave,
    saveBoxNavigateLeft,
    saveBoxNavigateRight,

    getMonAtLocation,
    setMonHeldItem,
    updateMonNotes,
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
