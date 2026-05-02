import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import { SAV } from '@openhome-core/save/interfaces'
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
      type: 'release_mon_by_id'
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

export const openSavesReducer: Reducer<OpenSavesState, OpenSavesAction> = (
  state: OpenSavesState,
  action: OpenSavesAction
) => {
  const { type, payload } = action

  switch (type) {
    /*
     *  BANKS
     */
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
    case 'release_mon_by_id': {
      if (!state.monsToRelease.includes(action.payload)) {
        state.monsToRelease.push(action.payload)
      }
      return { ...state }
    }
    case 'clear_updated_box_slots': {
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
