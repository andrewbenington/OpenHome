import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import { AddBoxLocation, HomeData } from '@openhome-core/save/HomeData'
import { SAV } from '@openhome-core/save/interfaces'
import { BoxMonIdentifiers, StoredBankData } from '@openhome-core/save/util/storage'
import { Option } from '@openhome-core/util/functional'
import { createContext, Dispatch, Reducer } from 'react'
import { SaveIdentifier, saveToStringIdentifier } from 'src/core/save/interfaces'
import { SAVClass } from '../../../core/save/util'

export type OpenSave = {
  index: number
  save: SAV
}

export type OpenSavesState = {
  monsToRelease: (OhpkmIdentifier | PKMInterface)[]
  openSaves: Record<SaveIdentifier, OpenSave>
  homeData?: HomeData
  error?: string
}

export type HomeMonLocation = {
  box: number
  boxSlot: number
  isHome: true
  bank: number
  save?: undefined
}
export type SaveMonLocation = {
  box: number
  boxSlot: number
  isHome: false
  bank?: undefined
  saveIdentifier: SaveIdentifier
}

export type MonLocation = SaveMonLocation | HomeMonLocation

export function isMonLocation(obj: object | undefined): obj is MonLocation {
  return obj !== undefined && 'box' in obj && 'boxSlot' in obj
}

export type MonWithLocation = MonLocation & {
  mon: PKMInterface
}

export type OpenSavesAction =
  /*
   *  BANKS
   */
  | {
      type: 'load_home_banks'
      payload: { banks: StoredBankData }
    }
  | {
      type: 'add_home_bank'
      payload: {
        name?: string
        boxCount: number
        currentCount: number
        switchToBank: boolean
      }
    }
  | {
      type: 'set_current_home_bank'
      payload: { bank: number }
    }
  | {
      type: 'set_home_bank_name'
      payload: { bank: number; name: string | undefined }
    }
  /*
   *  HOME BOXES
   */
  | {
      type: 'update_home_data'
      payload: { homeData: HomeData }
    }
  | {
      type: 'set_home_box'
      payload: { boxIndex: number }
    }
  // | {
  //     type: 'sort_home_box'
  //     payload: { boxIndex: number; sortType: SortType }
  //   }
  // | {
  //     type: 'sort_all_home_boxes'
  //     payload: { sortType: SortType }
  //   }
  | {
      type: 'home_box_remove_dupes'
      payload: { boxIndex: number }
    }
  | {
      type: 'set_home_box_name'
      payload: { name: string | undefined; index: number }
    }
  | {
      type: 'add_home_box'
      payload: {
        location: AddBoxLocation
        currentBoxCount: number
        boxName?: string
        identifiers?: BoxMonIdentifiers
      }
    }
  | {
      type: 'delete_home_box'
      payload: { index: number; id: string }
    }
  | {
      type: 'reorder_home_boxes'
      payload: { idsInNewOrder: string[] }
    }
  /*
   *  SAVE FILES
   */
  | {
      type: 'add_save'
      payload: SAV
    }
  | {
      type: 'remove_save'
      payload: SAV
    }
  | {
      type: 'set_save_box'
      payload: { save: SAV; boxIndex: number }
    }
  | {
      type: 'close_all_saves'
      payload?: undefined
    }
  /*
   *  POKEMON
   */
  | {
      type: 'add_mon_to_release'
      payload: OhpkmIdentifier | PKMInterface
    }
  | {
      type: 'clear_mons_to_release'
      payload?: undefined
    }
  /*
   *  OTHER
   */
  | {
      type: 'clear_updated_box_slots'
      payload?: undefined
    }
  | {
      type: 'set_error'
      payload: string | undefined
    }
  | {
      type: 'set_home_data'
      payload: HomeData
    }

export const openSavesReducer: Reducer<OpenSavesState, OpenSavesAction> = (
  state: OpenSavesState,
  action: OpenSavesAction
) => {
  const { type, payload } = action

  switch (type) {
    /*
     *  BANKS
     */
    case 'load_home_banks': {
      const { banks } = payload
      const newHomeData = new HomeData(banks)

      return { ...state, homeData: newHomeData }
    }
    case 'add_home_bank': {
      const { name, boxCount, currentCount, switchToBank } = payload

      // handle duplicate event dispatches in strict mode
      if (!state.homeData || state.homeData?.banks.length !== currentCount) {
        return { ...state }
      }

      const updatedHomeData = state.homeData

      const newBank = updatedHomeData.addBank(name, boxCount)

      if (switchToBank) {
        updatedHomeData.setAndLoadBank(newBank.index)
      }
      return { ...state, homeData: updatedHomeData }
    }
    case 'set_current_home_bank': {
      if (!state.homeData) return state
      const { bank } = payload

      state.homeData.setAndLoadBank(bank)
      return { ...state, homeData: state.homeData }
    }
    case 'set_home_bank_name': {
      if (!state.homeData) return state
      const { bank, name } = payload

      state.homeData.setBankName(bank, name)
      return { ...state, homeData: state.homeData }
    }
    /*
     *  HOME BOXES
     */
    case 'update_home_data': {
      const { homeData } = payload
      return { ...state, homeData: homeData.clone() }
    }
    case 'set_home_box': {
      if (!state.homeData) return state
      const { boxIndex: box } = payload

      state.homeData.currentBoxIndex = box
      const newState: OpenSavesState = {
        ...state,
        homeData: state.homeData,
      }

      return newState
    }
    case 'home_box_remove_dupes': {
      if (!state.homeData) return state

      state.homeData.removeDupesFromBox(payload.boxIndex)
      return { ...state }
    }
    case 'set_home_box_name': {
      const newState = { ...state }

      if (!newState.homeData) return { ...state }
      newState.homeData.setBoxNameCurrentBank(payload.index, payload.name)

      return newState
    }
    case 'reorder_home_boxes': {
      const newState = { ...state }

      if (!newState.homeData) return { ...state }

      newState.homeData.reorderBoxesCurrentBank(payload.idsInNewOrder)

      return newState
    }
    case 'add_home_box': {
      const newState = { ...state }

      if (!newState.homeData || newState.homeData.boxes.length !== payload.currentBoxCount) {
        // currentBoxCount check is to prevent adding multiple boxes during rerender/strict mode
        return { ...state }
      }

      newState.homeData.addBoxCurrentBank(payload.location, payload.boxName, payload.identifiers)

      return newState
    }
    case 'delete_home_box': {
      const newState = { ...state }

      if (!newState.homeData) return { ...state }

      newState.homeData.deleteBoxCurrentBank(payload.index, payload.id)

      return newState
    }
    case 'add_save': {
      const saveIdentifier = saveToStringIdentifier(payload)

      return {
        ...state,
        openSaves: {
          ...state.openSaves,
          [saveIdentifier]: {
            save: payload,
            index: Object.values(state.openSaves).length,
            currentPCBdox: payload.currentPCBox,
          },
        },
      }
    }
    case 'remove_save': {
      delete state.openSaves[saveToStringIdentifier(payload)]

      return { ...state, openSaves: { ...state.openSaves } }
    }
    case 'set_error': {
      return {
        ...state,
        error: payload,
      }
    }
    case 'set_save_box': {
      const { save } = payload
      const identifier = saveToStringIdentifier(payload.save)

      save.currentPCBox = payload.boxIndex
      const newState: OpenSavesState = {
        ...state,
        openSaves: {
          ...state.openSaves,
          [identifier]: {
            ...state.openSaves[identifier],
            save,
          },
        },
      }

      return newState
    }
    case 'add_mon_to_release': {
      if (!state.monsToRelease.includes(action.payload)) {
        state.monsToRelease.push(action.payload)
      }
      return { ...state }
    }
    case 'clear_updated_box_slots': {
      if (state.homeData) {
        state.homeData.updatedBoxSlots = []
      }
      for (const data of Object.values(state.openSaves)) {
        data.save.updatedBoxSlots = []
      }
      return { ...state, openSaves: { ...state.openSaves } }
    }
    case 'clear_mons_to_release': {
      return { ...state, monsToRelease: [] }
    }
    case 'close_all_saves': {
      return { ...state, openSaves: {} }
    }
    case 'set_home_data': {
      return { ...state, homeData: payload.clone() }
    }
  }
}

type SavesContextValue = {
  openSavesState: OpenSavesState
  openSavesDispatch: Dispatch<OpenSavesAction>
  allOpenSaves: SAV[]
  promptDisambiguation: (possibleSaveTypes: SAVClass<SAV>[]) => Promise<Option<SAVClass<SAV>>>
}

const initialState: OpenSavesState = {
  monsToRelease: [],
  openSaves: {},
}

export const SavesContext = createContext<SavesContextValue>({
  openSavesState: initialState,
  openSavesDispatch: () => {},
  allOpenSaves: [],
  promptDisambiguation: async () => undefined,
})

export function saveFromIdentifier(state: OpenSavesState, identifier: SaveIdentifier): Option<SAV> {
  return state.openSaves[identifier]?.save
}

export function getMonAtLocation(state: OpenSavesState, location: MonLocation) {
  if (location.isHome) {
    return state.homeData?.boxes[location.box].boxSlots[location.boxSlot]
  }

  if (location.saveIdentifier in state.openSaves) {
    const save = saveFromIdentifier(state, location.saveIdentifier)
    return save?.boxes[location.box].boxSlots[location.boxSlot]
  }
  return undefined
}
