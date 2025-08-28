import { createContext, Dispatch, Reducer } from 'react'
import { OHPKM } from 'src/types/pkm/OHPKM'
import { HomeData } from 'src/types/SAVTypes/HomeData'
import { SAV } from 'src/types/SAVTypes/SAV'
import { OpenHomeBank } from 'src/types/storage'
import { getMonFileIdentifier } from 'src/util/Lookup'
import { PKMInterface } from '../types/interfaces'
import { getSortFunctionNullable, SortType } from '../types/pkm/sort'

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
  save: SAV
  box: number
  boxPos: number
}

export type MonWithLocation = MonLocation & {
  mon: PKMInterface
}

export type OpenSavesAction =
  | {
      type: 'set_home_banks'
      payload: {
        banks: OpenHomeBank[]
        homeLookup: Record<string, OHPKM>
      }
    }
  | {
      type: 'add_home_bank'
      payload: {
        name?: string
        box_count?: number
        current_count: number
        switch_to_bank: boolean
        home_lookup: Record<string, OHPKM>
      }
    }
  | {
      type: 'add_save'
      payload: SAV
    }
  | {
      type: 'remove_save'
      payload: SAV
    }
  | {
      type: 'clear_all'
      payload?: undefined
    }
  | {
      type: 'set_save_box'
      payload: {
        save: SAV
        boxNum: number
      }
    }
  | {
      type: 'import_mons'
      payload: {
        mons: PKMInterface[]
        dest: MonLocation
      }
    }
  | {
      type: 'move_mon'
      payload: {
        source: MonWithLocation
        dest: MonLocation
      }
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
      type: 'add_mon_to_release'
      payload: MonLocation
    }
  | {
      type: 'clear_mons_to_release'
      payload?: undefined
    }
  | {
      type: 'close_all_saves'
      payload?: undefined
    }
  | {
      type: 'clear_updated_box_slots'
      payload?: undefined
    }
  | {
      type: 'set_error'
      payload: string | undefined
    }
  | {
      type: 'set_box_name'
      payload: { name: string | undefined; index: number }
    }

const updateMonInSave = (
  state: OpenSavesState,
  mon: PKMInterface | undefined,
  dest: MonLocation
) => {
  let replacedMon
  const { save, box, boxPos } = dest
  const saveID = saveToStringIdentifier(save)

  if (save instanceof HomeData && state.homeData && (mon === undefined || mon instanceof OHPKM)) {
    replacedMon = state.homeData.boxes[box].pokemon[boxPos]
    state.homeData.boxes[box].pokemon[boxPos] = mon as OHPKM
  } else if (saveID in state.openSaves) {
    const tempSaves = { ...state.openSaves }

    replacedMon = tempSaves[saveID].save.boxes[box].pokemon[boxPos]
    tempSaves[saveID].save.boxes[box].pokemon[boxPos] = mon
    tempSaves[saveID].save.updatedBoxSlots.push({ box, index: boxPos })
    state.openSaves = tempSaves
  }
  return replacedMon
}

export const openSavesReducer: Reducer<OpenSavesState, OpenSavesAction> = (
  state: OpenSavesState,
  action: OpenSavesAction
) => {
  const { type, payload } = action

  console.log({ type, payload })

  switch (type) {
    case 'set_home_banks': {
      const { banks, homeLookup } = payload
      const newHomeData = state.homeData ?? new HomeData(banks)

      Object.values(banks[newHomeData.currentBankIndex].boxes).forEach((box) => {
        newHomeData.boxes[box.index].loadMonsFromIdentifiers(box.identifiers, homeLookup)
      })

      return { ...state, homeData: newHomeData }
    }
    case 'add_home_bank': {
      const { name, box_count, current_count, switch_to_bank, home_lookup } = payload

      // handle duplicate event dispatches in strict mode
      if (!state.homeData || state.homeData?.banks.length !== current_count) {
        return { ...state }
      }

      const updatedHomeData = state.homeData

      updatedHomeData.addBank(name, box_count)
      if (switch_to_bank) {
        console.log('')
        updatedHomeData.currentBankIndex = updatedHomeData.banks.length - 1
        Object.values(updatedHomeData.banks[updatedHomeData.currentBankIndex].boxes).forEach(
          (box) => {
            updatedHomeData.boxes[box.index].loadMonsFromIdentifiers(box.identifiers, home_lookup)
          }
        )
      }
      return { ...state, homeData: updatedHomeData }
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
    case 'clear_all': {
      return { ...state, openSaves: {} }
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
      const { source, dest } = payload
      const sourceIdentifier = saveToStringIdentifier(source.save)
      const destIdentifier = saveToStringIdentifier(dest.save)

      const sourceBox = source.save.boxes[source.box]
      const destBox = dest.save.boxes[dest.box]

      let sourceMon = sourceBox.pokemon[source.boxPos]
      let destMon = destBox.pokemon[dest.boxPos]

      if (sourceMon !== source.mon) return state // necessary in strict mode, otherwise the swap will happen twice and revert
      if (sourceIdentifier !== destIdentifier) {
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
    case 'sort_current_home_box': {
      if (!state.homeData) return state

      const boxMons = state.homeData
        .getCurrentBox()
        .pokemon.toSorted(getSortFunctionNullable(payload.sortType))

      state.homeData.boxes[state.homeData.currentPCBox].pokemon = boxMons
      return { ...state }
    }
    case 'sort_all_home_boxes': {
      if (!state.homeData) return state

      const allMons = state.homeData.boxes
        .flatMap((box) => box.pokemon)
        .toSorted(getSortFunctionNullable(payload.sortType))
      const boxSize = state.homeData.boxColumns * state.homeData.boxRows

      for (let i = 0; i < state.homeData.boxes.length; i++) {
        state.homeData.boxes[i].pokemon = allMons.slice(i * boxSize, (i + 1) * boxSize)
      }

      return { ...state }
    }
    case 'import_mons': {
      const addedMons: OHPKM[] = []
      const { dest } = action.payload
      const mons = action.payload.mons.filter(
        (mon) => !((getMonFileIdentifier(new OHPKM(mon)) ?? '') in state.modifiedOHPKMs)
      )

      let nextIndex = dest.boxPos
      const isHome = dest.save instanceof HomeData
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
            boxPos: nextIndex,
          })
          addedMons.push(homeMon)
          nextIndex++
        }
      })

      if (isHome) {
        state.homeData = tempSave as HomeData
      } else {
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
    case 'set_box_name': {
      const newState = { ...state }
      const box = newState.homeData?.boxes[payload.index]

      if (box) {
        box.name = payload.name
      }
      return newState
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
