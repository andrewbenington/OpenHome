import { Item } from '@pkm-rs-resources/pkg'
import { useContext } from 'react'
import { PKMInterface } from '../../types/interfaces'
import { OHPKM } from '../../types/pkm/OHPKM'
import { SAV } from '../../types/SAVTypes/SAV'
import { useOhpkmStore } from '../ohpkm/useOhpkmStore'
import { MonLocation, MonWithLocation, OpenSavesState, SavesContext } from './reducer'

export type SavesAndBanksManager = Required<Omit<OpenSavesState, 'error'>> & {
  allOpenSaves: readonly SAV[]

  switchToBank(bankIndex: number): void
  setCurrentBankName(newName: string | undefined): void
  addBank(name: string | undefined, boxCount: number): void
  setBoxNameCurrentBank(boxIndex: number, newName: string | undefined): void

  removeDupesCurrentHomeBox(): void
  sortCurrentHomeBox(sortType: string): void
  sortAllHomeBoxes(sortType: string): void

  reorderBoxesCurrentBank(idsInNewOrder: string[]): void
  addBoxCurrentBank(): void
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
        box:
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
        box: (loadedHomeData.currentPCBox + 1) % loadedHomeData.boxes.length,
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

  function removeDupesCurrentHomeBox() {
    openSavesDispatch({ type: 'current_home_box_remove_dupes' })
  }

  function sortCurrentHomeBox(sortType: string) {
    openSavesDispatch({
      type: 'sort_current_home_box',
      payload: { sortType, getMonById: ohpkmStore.getById },
    })
  }

  function sortAllHomeBoxes(sortType: string) {
    openSavesDispatch({
      type: 'sort_all_home_boxes',
      payload: { sortType, getMonById: ohpkmStore.getById },
    })
  }

  function addBoxCurrentBank() {
    openSavesDispatch({
      type: 'add_home_box',
      payload: { currentBoxCount: loadedHomeData.boxes.length },
    })
  }

  function saveBoxNavigateLeft(save: SAV) {
    openSavesDispatch({
      type: 'set_save_box',
      payload: {
        boxNum: save.currentPCBox > 0 ? save.currentPCBox - 1 : save.boxes.length - 1,
        save,
      },
    })
  }

  function saveBoxNavigateRight(save: SAV) {
    openSavesDispatch({
      type: 'set_save_box',
      payload: {
        boxNum: (save.currentPCBox + 1) % save.boxes.length,
        save,
      },
    })
  }

  function addSave(save: SAV) {
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

    removeDupesCurrentHomeBox,
    sortCurrentHomeBox,
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
    moveMon,
    releaseMonAtLocation,
  }
}
