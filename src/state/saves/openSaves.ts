import { Item } from '@pkm-rs-resources/pkg'
import { createContext, Dispatch, Reducer } from 'react'
import { OHPKM } from 'src/types/pkm/OHPKM'
import { HomeData } from 'src/types/SAVTypes/HomeData'
import { SAV } from 'src/types/SAVTypes/SAV'
import { StoredBankData } from 'src/types/storage'
import { getMonFileIdentifier } from 'src/util/Lookup'
import { PKMInterface } from '../../types/interfaces'
import { getSortFunctionNullable, SortType } from '../../types/pkm/sort'
import { PersistedPkmData } from '../persistedPkmData'

export type OpenSave = {
  index: number
  save: SAV
}

function saveToStringIdentifier(save: SAV): string {
  return `${save.origin}$${save.tid}$${save.sid ?? 0}`
}

export type OpenSavesState = {
  modifiedOHPKMs: { [key: string]: OHPKM }
  monsToRelease: PKMInterface[]
  openSaves: Record<string, OpenSave>
  homeData?: HomeData
  error?: string
}

export type MonLocation = {
  box: number
  box_slot: number
} & (
  | { is_home: false; bank?: undefined; save: SAV }
  | { is_home: true; bank: number; save?: undefined }
)

export type MonWithLocation = MonLocation & {
  mon: PKMInterface
}

export type OpenSavesAction =
  /*
   *  BANKS
   */
  | {
      type: 'load_home_banks'
      payload: { banks: StoredBankData; monLookup: PersistedPkmData }
    }
  | {
      type: 'add_home_bank'
      payload: {
        name?: string
        box_count: number
        current_count: number
        switch_to_bank: boolean
        home_lookup: Record<string, OHPKM>
      }
    }
  | {
      type: 'set_current_home_bank'
      payload: { bank: number; monLookup: PersistedPkmData }
    }
  | {
      type: 'set_home_bank_name'
      payload: { bank: number; name: string | undefined }
    }
  /*
   *  HOME BOXES
   */
  | {
      type: 'set_home_box'
      payload: { box: number }
    }
  | {
      type: 'sort_current_home_box'
      payload: { sortType: SortType }
    }
  | {
      type: 'sort_all_home_boxes'
      payload: { sortType: SortType }
    }
  | {
      type: 'current_home_box_remove_dupes'
      payload?: undefined
    }
  | {
      type: 'set_home_box_name'
      payload: { name: string | undefined; index: number }
    }
  | {
      type: 'add_home_box'
      payload: { currentBoxCount: number }
    }
  | {
      type: 'delete_home_box'
      payload: { index: number; id: string }
    }
  | {
      type: 'reorder_home_boxes'
      payload: { ids_in_new_order: string[] }
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
      payload: { save: SAV; boxNum: number }
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
      payload: MonLocation
    }
  | {
      type: 'clear_mons_to_release'
      payload?: undefined
    }
  | {
      type: 'import_mons'
      payload: { mons: PKMInterface[]; dest: MonLocation }
    }
  | {
      type: 'move_mon'
      payload: { source: MonWithLocation; dest: MonLocation }
    }
  | {
      type: 'set_mon_item'
      payload: { item: Item | undefined; dest: MonLocation }
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

const updateMonInSave = (
  state: OpenSavesState,
  mon: PKMInterface | undefined,
  dest: MonLocation
) => {
  let replacedMon

  if (dest.is_home) {
    if (state.homeData && (mon === undefined || mon instanceof OHPKM)) {
      replacedMon = state.homeData.boxes[dest.box].pokemon[dest.box_slot]
      state.homeData.setPokemon(dest, mon)
    }
    return replacedMon
  }

  const saveID = saveToStringIdentifier(dest.save)

  if (saveID in state.openSaves) {
    const tempSaves = { ...state.openSaves }

    replacedMon = tempSaves[saveID].save.boxes[dest.box].pokemon[dest.box_slot]
    tempSaves[saveID].save.boxes[dest.box].pokemon[dest.box_slot] = mon
    tempSaves[saveID].save.updatedBoxSlots.push({ box: dest.box, index: dest.box_slot })
    state.openSaves = tempSaves
  }
  return replacedMon
}

export const openSavesReducer: Reducer<OpenSavesState, OpenSavesAction> = (
  state: OpenSavesState,
  action: OpenSavesAction
) => {
  const { type, payload } = action

  // console.log({ type, payload })

  switch (type) {
    /*
     *  BANKS
     */
    case 'load_home_banks': {
      const { banks, monLookup } = payload
      const newHomeData = new HomeData(banks, monLookup)

      return { ...state, homeData: newHomeData }
    }
    case 'add_home_bank': {
      const { name, box_count, current_count, switch_to_bank, home_lookup } = payload

      // handle duplicate event dispatches in strict mode
      if (!state.homeData || state.homeData?.banks.length !== current_count) {
        return { ...state }
      }

      const updatedHomeData = state.homeData

      const newBank = updatedHomeData.addBank(name, box_count)

      if (switch_to_bank) {
        updatedHomeData.setAndLoadBank(newBank.index, home_lookup)
      }
      return { ...state, homeData: updatedHomeData }
    }
    case 'set_current_home_bank': {
      if (!state.homeData) return state
      const { bank, monLookup } = payload

      state.homeData.setAndLoadBank(bank, monLookup)
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
    case 'set_home_box': {
      if (!state.homeData) return state
      const { box } = payload

      state.homeData.currentBoxIndex = box
      const newState: OpenSavesState = {
        ...state,
        homeData: state.homeData,
      }

      return newState
    }
    case 'sort_current_home_box': {
      if (!state.homeData) return state

      const boxMons = state.homeData
        .getCurrentBox()
        .pokemon.toSorted(getSortFunctionNullable(payload.sortType))

      state.homeData.boxes[state.homeData.currentPCBox].pokemon = boxMons
      state.homeData.syncBankToBoxes()
      state.homeData = state.homeData.clone()
      return { ...state }
    }
    case 'sort_all_home_boxes': {
      if (!state.homeData) return { ...state }

      const allMons = state.homeData.boxes
        .flatMap((box) => box.pokemon)
        .toSorted(getSortFunctionNullable(payload.sortType))
      const boxSize = HomeData.BOX_COLUMNS * HomeData.BOX_ROWS

      for (let i = 0; i < state.homeData.boxes.length; i++) {
        state.homeData.boxes[i].pokemon = allMons.slice(i * boxSize, (i + 1) * boxSize)
      }

      state.homeData.syncBankToBoxes()
      state.homeData = state.homeData.clone()

      return { ...state }
    }
    case 'current_home_box_remove_dupes': {
      if (!state.homeData) return state

      state.homeData.currentBoxRemoveDupes()
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

      newState.homeData.reorderBoxesCurrentBank(payload.ids_in_new_order)

      return newState
    }
    case 'add_home_box': {
      const newState = { ...state }

      if (!newState.homeData || newState.homeData.boxes.length !== payload.currentBoxCount) {
        // currentBoxCount check is to prevent adding multiple boxes during rerender/strict mode
        return { ...state }
      }

      newState.homeData.addBoxCurrentBank()

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

      save.currentPCBox = payload.boxNum
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
    case 'move_mon': {
      if (!state.homeData) return state

      const { source, dest } = payload
      const sourceSave = source.is_home ? state.homeData : source.save
      const destSave = dest.is_home ? state.homeData : dest.save

      const sourceBox = source.is_home
        ? state.homeData.boxes[source.box]
        : source.save.boxes[source.box]
      const destBox = dest.is_home ? state.homeData.boxes[dest.box] : dest.save.boxes[dest.box]

      let sourceMon = sourceBox.pokemon[source.box_slot]
      let destMon = destBox.pokemon[dest.box_slot]

      if (sourceMon !== source.mon) return state // necessary in strict mode, otherwise the swap will happen twice and revert
      if (sourceSave !== destSave) {
        if (sourceMon) {
          if (!(sourceMon instanceof OHPKM)) {
            sourceMon = new OHPKM(sourceMon)
          }
          const identifier = getMonFileIdentifier(sourceMon)

          if (identifier) {
            state.modifiedOHPKMs[identifier] = sourceMon as OHPKM
          }
        }
        if (destMon) {
          if (!(destMon instanceof OHPKM)) {
            destMon = new OHPKM(destMon)
          }
          const identifier = getMonFileIdentifier(destMon)

          if (identifier) {
            state.modifiedOHPKMs[identifier] = destMon as OHPKM
          }
        }
      }

      updateMonInSave(state, destMon, source)
      updateMonInSave(state, sourceMon, dest)

      return { ...state }
    }

    case 'set_mon_item': {
      const { item, dest } = payload

      const targetMon = getMonAtLocation(state, dest)

      if (!targetMon) {
        return { ...state }
      }

      if (targetMon.heldItemIndex === item?.index) {
        return { ...state }
      }

      let updatedMon: OHPKM

      if (targetMon instanceof OHPKM) {
        updatedMon = targetMon
      } else {
        updatedMon = new OHPKM(targetMon)
      }

      updatedMon.heldItemIndex = item?.index ?? 0

      updateMonInSave(state, updatedMon, dest)

      const identifier = getMonFileIdentifier(updatedMon)

      if (identifier) {
        state.modifiedOHPKMs[identifier] = updatedMon
      }

      return { ...state }
    }

    case 'import_mons': {
      const addedMons: OHPKM[] = []
      const { dest } = action.payload
      const mons = action.payload.mons.filter(
        (mon) => !((getMonFileIdentifier(new OHPKM(mon)) ?? '') in state.modifiedOHPKMs)
      )

      if (dest.is_home) {
        let nextSlot = dest

        mons.forEach((mon) => {
          const homeMon = mon instanceof OHPKM ? mon : new OHPKM(mon)

          if (!state.homeData) {
            throw Error('Home Data not loaded')
          }

          while (
            !state.homeData.slotIsEmpty(nextSlot) &&
            nextSlot.box < state.homeData.getCurrentBank().boxes.length
          ) {
            nextSlot.box_slot++
            if (nextSlot.box_slot >= HomeData.BOX_COLUMNS * HomeData.BOX_ROWS) {
              nextSlot.box_slot = 0
              nextSlot.box++
            }
          }

          if (nextSlot.box < state.homeData.getCurrentBank().boxes.length) {
            state.homeData.setPokemon(nextSlot, homeMon)
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
        const tempSave = dest.save

        mons.forEach((mon) => {
          const homeMon = mon instanceof OHPKM ? mon : new OHPKM(mon)

          while (
            tempSave.boxes[dest.box].pokemon[nextIndex] &&
            nextIndex < tempSave.boxRows * tempSave.boxColumns
          ) {
            nextIndex++
          }
          if (nextIndex < tempSave.boxRows * tempSave.boxColumns) {
            updateMonInSave(state, homeMon, {
              ...dest,
              box_slot: nextIndex,
            })
            addedMons.push(homeMon)
            nextIndex++
          }
        })

        state.openSaves[saveToStringIdentifier(tempSave)].save = tempSave
      }

      addedMons.forEach((mon) => (state.modifiedOHPKMs[getMonFileIdentifier(mon) ?? ''] = mon))
      return { ...state }
    }
    case 'add_mon_to_release': {
      const replacedMon = updateMonInSave(state, undefined, action.payload)

      if (!replacedMon) return { ...state }

      if (replacedMon instanceof OHPKM) {
        const identifier = getMonFileIdentifier(replacedMon)

        if (identifier) {
          delete state.modifiedOHPKMs[identifier]
        }
      }
      state.monsToRelease.push(replacedMon)
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
  }
}

const initialState: OpenSavesState = {
  modifiedOHPKMs: {},
  monsToRelease: [],
  openSaves: {},
}

export const OpenSavesContext = createContext<[OpenSavesState, Dispatch<OpenSavesAction>, SAV[]]>([
  initialState,
  () => {},
  [],
])

export function getMonAtLocation(state: OpenSavesState, location: MonLocation) {
  if (location.is_home) {
    return state.homeData?.boxes[location.box].pokemon[location.box_slot]
  }

  const saveID = saveToStringIdentifier(location.save)

  if (saveID in state.openSaves) {
    return state.openSaves[saveID].save.boxes[location.box].pokemon[location.box_slot]
  }
  return undefined
}
