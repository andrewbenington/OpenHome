import { Option, partitionResults, R, range, Result } from '@openhome-core/util/functional'
import { createContext, useContext } from 'react'
import { v4 as UuidV4 } from 'uuid'
import { create, StateCreator, StoreApi, UseBoundStore } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { OhpkmIdentifier } from '../../../core/pkm/Lookup'
import { getSortFunctionNullable } from '../../../core/pkm/sort'
import { AddBoxLocation, BankBoxCoordinates, OpenHomeBanks } from '../../../core/save/HomeData'
import {
  BoxMonIdentifiers,
  SimpleOpenHomeBank,
  SimpleOpenHomeBox,
  StoredBankData,
} from '../../../core/save/util/storage'
import { numericSorter } from '../../../core/util/sort'
import { BackendContext } from '../../backend/backendContext'
import { IdentifierNotPresentError, useOhpkmStore } from '../../state/ohpkm'

export const OPENHOME_BOX_ROWS = 10
export const OPENHOME_BOX_COLUMNS = 12
export const OPENHOME_BOX_SLOTS = OPENHOME_BOX_COLUMNS * OPENHOME_BOX_ROWS

type ReverseLookup = Map<OhpkmIdentifier, BankBoxCoordinates>

interface BanksAndBoxesState {
  reloadStore: () => Promise<void>

  banks: SimpleOpenHomeBank[]
  currentBankIndex: number
  currentBoxIndex: number
  updatedBoxSlots: BankBoxCoordinates[]
  reverseLookup: ReverseLookup

  getCurrentBank: () => SimpleOpenHomeBank
  getCurrentBankName: () => string
  getBankName: (bankIndex: number) => string
  setCurrentBankName: (name: Option<string>) => void
  getCurrentBox: () => SimpleOpenHomeBox
  setCurrentBox: (boxIndex: number) => void
  getBoxName: (bankIndex: number, boxIndex: number) => string
  addBank: (name: Option<string>, boxCount: number) => void
  switchToBank: (bankIndex: number) => void
  getAtLocation: (location: BankBoxCoordinates) => Option<OhpkmIdentifier>
  locationIsEmpty: (location: BankBoxCoordinates) => boolean
  setAtLocation: (location: BankBoxCoordinates, contents: OhpkmIdentifier) => void
  clearAtLocation: (location: BankBoxCoordinates) => void
  setBoxNameCurrentBank: (boxIndex: number, boxName: Option<string>) => void
  deleteBoxCurrentBank: (boxId: string) => void
  addBoxCurrentBank: (
    location: AddBoxLocation,
    boxName?: string,
    identifiers?: BoxMonIdentifiers
  ) => void
  reorderBoxesCurrentBank: (idsInNewOrder: string[]) => void
  firstEmptySlotInBox: (boxIndex: number) => Option<number>
  removeDupesFromBox: (boxIndex: number) => void
  allMonsCurrentBank: () => OhpkmIdentifier[]
  allMonsInBoxCurrentBank: (boxIndex: number) => OhpkmIdentifier[]
  findHomeLocation: (identifier: OhpkmIdentifier) => Option<BankBoxCoordinates>
  indexOfBoxId: (id: string) => Option<number>
}

export const createBanksAndBoxesStore = (
  stored: StoredBankData,
  reloadStored: () => Promise<void>
) =>
  create<BanksAndBoxesState>()(
    immer<BanksAndBoxesState>((set, readonlyState) => ({
      reloadStore: reloadStored,
      banks: stored.banks,
      currentBankIndex: stored.current_bank,
      currentBoxIndex: stored.banks[stored.current_bank].current_box,
      updatedBoxSlots: [],
      reverseLookup: buildReverseLookup(stored),
      getCurrentBank: (): SimpleOpenHomeBank => {
        const state = readonlyState()
        return state.banks[state.currentBankIndex]
      },
      getCurrentBankName: (): string => {
        return bankNameOrDefault(readonlyState().getCurrentBank())
      },
      setCurrentBankName: (name: Option<string>) =>
        set((state) => {
          currentBankMutable(state).name = name
        }),
      getBankName: (bankIndex: number): string => {
        return bankNameOrDefault(readonlyState().banks[bankIndex])
      },
      getCurrentBox: (): SimpleOpenHomeBox => {
        const state = readonlyState()
        return state.getCurrentBank().boxes[state.currentBoxIndex]
      },
      setCurrentBox: (boxIndex: number) =>
        set((state) => {
          state.currentBoxIndex = boxIndex
          currentBankMutable(state).current_box = boxIndex
        }),
      getBoxName: (bankIndex: number, boxIndex: number): string => {
        return boxNameOrDefault(readonlyState().banks[bankIndex].boxes[boxIndex])
      },
      addBank: (name: Option<string>, boxCount: number) =>
        set((state) => {
          state.banks.push(buildNewBank(state, name, boxCount))
        }),
      switchToBank: (bankIndex: number) =>
        set((state) => {
          state.currentBankIndex = bankIndex
          state.currentBoxIndex = state.banks[bankIndex].current_box
          state.banks = [...state.banks] // force immer to recognize the update
        }),
      getAtLocation: (location: BankBoxCoordinates): Option<OhpkmIdentifier> => {
        return boxAtLocationMutable(readonlyState(), location).identifiers.get(location.boxSlot)
      },
      locationIsEmpty: (location: BankBoxCoordinates): boolean => {
        return readonlyState().getAtLocation(location) === undefined
      },
      setAtLocation: (location: BankBoxCoordinates, identifier: OhpkmIdentifier) =>
        set((state) => {
          boxAtLocationMutable(state, location).identifiers.set(location.boxSlot, identifier)
          state.reverseLookup.set(identifier, location)
          state.updatedBoxSlots.push(location)
        }),
      clearAtLocation: (location: BankBoxCoordinates) =>
        set((state) => {
          const box = boxAtLocationMutable(state, location)
          const clearedIdentifier = box.identifiers.get(location.boxSlot)
          box.identifiers.delete(location.boxSlot)

          if (clearedIdentifier) {
            state.reverseLookup.delete(clearedIdentifier)
          }
          state.updatedBoxSlots.push(location)
        }),
      setBoxNameCurrentBank: (boxIndex: number, boxName: Option<string>) =>
        set((state) => {
          currentBankMutable(state).boxes[boxIndex].name = boxName ?? null
        }),
      deleteBoxCurrentBank: (boxId: string) =>
        set((state) => {
          const currentBank = currentBankMutable(state)
          currentBank.boxes = currentBank.boxes.filter((box) => box.id !== boxId)
        }),
      addBoxCurrentBank: (
        location: AddBoxLocation,
        boxName?: string,
        identifiers?: BoxMonIdentifiers
      ) =>
        set((state) => {
          const currentBank = currentBankMutable(state)
          const newBox = buildNewBox(currentBank, boxName, identifiers)

          if (location === 'start') {
            currentBank.boxes = [newBox, ...currentBank.boxes]
          } else if (location === 'end') {
            currentBank.boxes.push(newBox)
          } else {
            const index = location[1]
            const boxCount = currentBank.boxes.length
            if (index >= boxCount) {
              return R.Err(`index ${index} is greater than box count (${boxCount})`)
            }
            const pivot = location[0] === 'before' ? index : index + 1
            currentBank.boxes = [
              ...currentBank.boxes.slice(0, pivot),
              newBox,
              ...currentBank.boxes.slice(pivot),
            ]
          }

          resetBoxIndices(currentBank)

          return R.Ok(null)
        }),
      reorderBoxesCurrentBank: (idsInNewOrder: string[]) =>
        set((state) => {
          const currentBank = currentBankMutable(state)
          currentBank.boxes = currentBank.boxes.toSorted(
            numericSorter((box) => idsInNewOrder.indexOf(box.id))
          )

          const remappedBoxIndices: Map<number, number> = new Map()
          currentBank.boxes.forEach((box, newIndex) => {
            remappedBoxIndices.set(box.index, newIndex)
            box.index = newIndex
          })

          // reverse lookup now has outdated box indexes, so they need to be updated
          state.reverseLookup.entries().forEach(([, location]) => {
            location.box = remappedBoxIndices.get(location.box) ?? location.box
          })
        }),
      firstEmptySlotInBox: (boxIndex: number): Option<number> => {
        return firstEmptyBoxSlot(readonlyState().getCurrentBank().boxes[boxIndex])
      },
      removeDupesFromBox: (boxIndex: number) =>
        set((state) => removeDupes(currentBankMutable(state).boxes[boxIndex])),
      allMonsCurrentBank: (): OhpkmIdentifier[] => {
        return readonlyState()
          .getCurrentBank()
          .boxes.flatMap((box) => Array.from(box.identifiers.values()))
      },
      allMonsInBoxCurrentBank: (boxIndex: number): OhpkmIdentifier[] => {
        return Array.from(readonlyState().getCurrentBank().boxes[boxIndex].identifiers.values())
      },
      findHomeLocation: (identifier: OhpkmIdentifier): Option<BankBoxCoordinates> => {
        return readonlyState().reverseLookup.get(identifier)
      },
      indexOfBoxId: (id: string): Option<number> => {
        return readonlyState()
          .getCurrentBank()
          .boxes.findIndex((box) => box.id === id)
      },
    })) as StateCreator<BanksAndBoxesState, [], []>
  )

// when called using a mutable state (via immer), mutations to the returned value
// will be preserved by immer
function currentBankMutable<T extends BanksAndBoxesState>(state: T): T['banks'][number] {
  return state.banks[state.currentBankIndex]
}

function boxAtLocationMutable<T extends BanksAndBoxesState>(
  state: T,
  location: BankBoxCoordinates
): T['banks'][number]['boxes'][number] {
  return state.banks[location.bank].boxes[location.box]
}

function buildNewBank(
  state: BanksAndBoxesState,
  name: Option<string>,
  boxCount: number
): SimpleOpenHomeBank {
  return {
    id: UuidV4(),
    name,
    index: state.banks.length,
    boxes: range(boxCount).map((_, index) => ({
      id: UuidV4(),
      name: null,
      index,
      identifiers: new Map(),
    })),
    current_box: 0,
  }
}

function buildNewBox(
  bank: SimpleOpenHomeBank,
  boxName: Option<string>,
  identifiers: Option<BoxMonIdentifiers>
): SimpleOpenHomeBox {
  return {
    id: UuidV4(),
    name: boxName ?? null,
    index: bank.boxes.length,
    identifiers: identifiers ?? new Map(),
  }
}

function resetBoxIndices(bank: SimpleOpenHomeBank) {
  bank.boxes.forEach((box, newIndex) => (box.index = newIndex))
}

function firstEmptyBoxSlot(box: SimpleOpenHomeBox): Option<number> {
  let firstEmptyIndex: Option<number> = undefined
  for (const [index, contents] of box.identifiers.entries()) {
    if (!contents && (firstEmptyIndex === undefined || firstEmptyIndex > index)) {
      firstEmptyIndex = index
    }
  }

  return firstEmptyIndex
}

function buildReverseLookup(stored: StoredBankData): ReverseLookup {
  const reverseLookup: ReverseLookup = new Map()
  for (const bank of stored.banks) {
    for (const box of bank.boxes) {
      for (const [boxSlot, identifier] of box.identifiers.entries()) {
        reverseLookup.set(identifier, { bank: bank.index, box: box.index, boxSlot })
      }
    }
  }
  return reverseLookup
}

export function bankNameOrDefault(item: SimpleOpenHomeBank) {
  return item.name ?? `Bank ${item.index + 1}`
}

export function boxNameOrDefault(box: SimpleOpenHomeBox) {
  return box.name ?? `Box ${box.index + 1}`
}

// when called using a mutable state (via immer), mutations to the returned value
// will be preserved by immer
function removeDupes<T extends SimpleOpenHomeBox>(box: T) {
  const alreadyPresent: Set<string> = new Set()

  for (let slot = 0; slot < OpenHomeBanks.BOX_COLUMNS * OpenHomeBanks.BOX_ROWS; slot++) {
    const identifier = box.identifiers.get(slot)

    if (!identifier) continue
    if (alreadyPresent.has(identifier)) {
      box.identifiers.delete(slot)
    } else {
      alreadyPresent.add(identifier)
    }
  }
}

type BanksAndBoxesStore = ReturnType<typeof createBanksAndBoxesStore>

export const BanksAndBoxesStoreContext = createContext<BanksAndBoxesStore | null>(null)

type WithSelectors<S> = S extends { getState: () => infer T }
  ? S & { use: { [K in keyof T]: () => T[K] } }
  : never

const createSelectors = <S extends UseBoundStore<StoreApi<object>>>(_store: S) => {
  const store = _store as WithSelectors<typeof _store>
  store.use = {}
  for (const k of Object.keys(store.getState())) {
    ;(store.use as any)[k] = () => store((s) => s[k as keyof typeof s])
  }

  return store
}

export function useBanksAndBoxes() {
  const store = useContext(BanksAndBoxesStoreContext)
  const backend = useContext(BackendContext)
  const ohpkmStore = useOhpkmStore()

  if (!store) {
    throw new Error(
      `useBanksAndBoxes() must be called in a component that is descended from a BanksAndBoxesStoreProvider.`
    )
  }

  const withSelectors = createSelectors(store)

  const reloadBankStore = withSelectors.use.reloadStore()

  const banks = withSelectors.use.banks()
  const addBank = withSelectors.use.addBank()
  const getCurrentBank = withSelectors.use.getCurrentBank()
  const getBankName = withSelectors.use.getBankName()
  const getCurrentBankName = withSelectors.use.getCurrentBankName()
  const setCurrentBankName = withSelectors.use.setCurrentBankName()
  const addBoxCurrentBank = withSelectors.use.addBoxCurrentBank()
  const deleteBoxCurrentBank = withSelectors.use.deleteBoxCurrentBank()
  const indexOfBoxIdCurrentBank = withSelectors.use.indexOfBoxId()
  const reorderBoxesCurrentBank = withSelectors.use.reorderBoxesCurrentBank()
  const switchToBank = withSelectors.use.switchToBank()

  const getBoxName = withSelectors.use.getBoxName()
  const setBoxNameCurrentBank = withSelectors.use.setBoxNameCurrentBank()
  const getCurrentBox = withSelectors.use.getCurrentBox()
  const switchBoxCurrentBank = withSelectors.use.setCurrentBox()
  const removeDupesFromHomeBox = withSelectors.use.removeDupesFromBox()

  const getMonAtHomeLocation = withSelectors.use.getAtLocation()
  const homeLocationIsEmpty = withSelectors.use.locationIsEmpty()
  const clearAtHomeLocation = withSelectors.use.clearAtLocation()
  const setAtHomeLocation = withSelectors.use.setAtLocation()
  const findHomeLocation = withSelectors.use.findHomeLocation()

  const allMonsInCurrentBank = withSelectors.use.allMonsCurrentBank()
  const allMonsInHomeBoxCurrentBank = withSelectors.use.allMonsInBoxCurrentBank()
  const firstHomeBoxEmptySlot = withSelectors.use.firstEmptySlotInBox()

  function switchToPreviousBox() {
    const currentBankBoxCount = getCurrentBank().boxes.length
    switchBoxCurrentBank(
      getCurrentBank().current_box > 0 ? getCurrentBank().current_box - 1 : currentBankBoxCount - 1
    )
  }

  function switchToNextBox() {
    const currentBankBoxCount = getCurrentBank().boxes.length
    switchBoxCurrentBank((getCurrentBank().current_box + 1) % currentBankBoxCount)
  }

  function sortHomeBox(
    boxIndex: number,
    sortType: string
  ): Result<null, IdentifierNotPresentError[]> {
    const loadResults = ohpkmStore.tryLoadFromIds(allMonsInHomeBoxCurrentBank(boxIndex))
    const { successes: mons, failures } = partitionResults(loadResults)
    if (failures.length) {
      return R.Err(failures)
    }

    const sorted = mons.toSorted(getSortFunctionNullable(sortType))
    const box = getCurrentBank().boxes[boxIndex]

    for (const i of range(box.identifiers.size)) {
      const location: BankBoxCoordinates = {
        bank: getCurrentBank().index,
        box: boxIndex,
        boxSlot: i,
      }
      if (i < sorted.length) {
        setAtHomeLocation(location, sorted[i].openhomeId)
      } else {
        clearAtHomeLocation(location)
      }
    }

    return R.Ok(null)
  }

  function sortAllHomeBoxes(sortType: string): Result<null, IdentifierNotPresentError[]> {
    const loadResults = ohpkmStore.tryLoadFromIds(allMonsInCurrentBank())
    const { successes: allMons, failures } = partitionResults(loadResults)
    if (failures.length) {
      return R.Err(failures)
    }

    const sorted = allMons.toSorted(getSortFunctionNullable(sortType))
    const boxSize = OpenHomeBanks.BOX_COLUMNS * OpenHomeBanks.BOX_ROWS

    const currentBankIndex = getCurrentBank().index
    const currentBankBoxCount = getCurrentBank().boxes.length

    for (const box of range(currentBankBoxCount)) {
      for (const slot of range(boxSize)) {
        const location = {
          bank: currentBankIndex,
          box,
          boxSlot: slot,
        }
        const monIndex = box * boxSize + slot
        if (monIndex < sorted.length) {
          setAtHomeLocation(location, sorted[monIndex].openhomeId)
        } else {
          clearAtHomeLocation(location)
        }
      }
    }

    return R.Ok(null)
  }

  // adds the necessary boxes to contain the given ids, and returns the index of the first created box
  function addBoxesWithIds(ids: OhpkmIdentifier[], boxName?: string): Option<number> {
    if (ids.length === 0) return undefined

    const firstNewBoxIndex = getCurrentBank().boxes.length

    for (let i = 0; i < ids.length; i += OpenHomeBanks.SLOTS_PER_BOX) {
      const identifiers: BoxMonIdentifiers = new Map()
      for (let slot = 0; slot < OpenHomeBanks.SLOTS_PER_BOX; slot++) {
        identifiers.set(slot, ids[i + slot])
      }
      addBoxCurrentBank('end', boxName, identifiers)
    }

    return firstNewBoxIndex
  }

  async function saveChanges() {
    await backend.writeHomeBanks({
      banks,
      current_bank: getCurrentBank().index,
    })
    await reloadBankStore()
  }

  return {
    saveChanges,
    reloadBankStore,

    banks,
    addBank,
    getCurrentBank,
    getBankName,
    getCurrentBankName,
    setCurrentBankName,
    addBoxCurrentBank,
    addBoxesWithIds,
    deleteBoxCurrentBank,
    indexOfBoxIdCurrentBank,
    reorderBoxesCurrentBank,
    switchToBank,

    getBoxName,
    setBoxNameCurrentBank,
    getCurrentBox,
    sortHomeBox,
    sortAllHomeBoxes,
    removeDupesFromHomeBox,

    switchBoxCurrentBank,
    switchToPreviousBox,
    switchToNextBox,

    getMonAtHomeLocation,
    homeLocationIsEmpty,
    clearAtHomeLocation,
    setAtHomeLocation,
    findHomeLocation,

    allMonsInCurrentBank,
    allMonsInHomeBoxCurrentBank,
    firstHomeBoxEmptySlot,
  }
}

export type BanksAndBoxesConroller = ReturnType<typeof useBanksAndBoxes>
