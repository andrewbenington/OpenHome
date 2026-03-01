import { Option, R, range } from '@openhome-core/util/functional'
import { createContext, useContext } from 'react'
import { v4 as UuidV4 } from 'uuid'
import { create, StateCreator, useStore } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { OhpkmIdentifier } from '../../../core/pkm/Lookup'
import { AddBoxLocation, BankBoxCoordinates, OpenHomeBanks } from '../../../core/save/HomeData'
import {
  BoxMonIdentifiers,
  SimpleOpenHomeBank,
  SimpleOpenHomeBox,
  StoredBankData,
} from '../../../core/save/util/storage'
import { numericSorter } from '../../../core/util/sort'

type ReverseLookup = Map<OhpkmIdentifier, BankBoxCoordinates>

interface BanksAndBoxesState {
  banks: SimpleOpenHomeBank[]
  currentBankIndex: number
  currentBoxIndex: number
  updatedBoxSlots: BankBoxCoordinates[]
  reverseLookup: ReverseLookup

  getCurrentBank: () => SimpleOpenHomeBank
  getCurrentBankName: () => string
  getCurrentBox: () => SimpleOpenHomeBox
  addBank: (name: Option<string>, boxCount: number) => void
  switchBank: (bankIndex: number) => void
  getAtLocation: (boxIndex: number, boxSlot: number) => Option<OhpkmIdentifier>
  setAtLocation: (boxIndex: number, boxSlot: number, contents: OhpkmIdentifier) => void
  clearAtLocation: (boxIndex: number, boxSlot: number) => void
  setBoxNameCurrentBank: (boxIndex: number, boxName: Option<string>) => void
  deleteBoxCurrentBank: (boxId: string) => void
  addBoxCurrentBank: (
    location: AddBoxLocation,
    boxName?: string,
    identifiers?: BoxMonIdentifiers
  ) => void
  reorderBoxes: (idsInNewOrder: string[]) => void
  firstEmptySlotInBox: (boxIndex: number) => Option<number>
  removeDupesFromBox: (boxIndex: number) => void
  allMonsCurrentBank: () => OhpkmIdentifier[]
  findIfPresent: (identifier: OhpkmIdentifier) => Option<BankBoxCoordinates>
  indexOfBoxId: (id: string) => Option<number>
}

export const createBanksAndBoxesStore = (stored: StoredBankData) =>
  create<BanksAndBoxesState>()(
    immer<BanksAndBoxesState>((set, getReadonlyState) => ({
      banks: stored.banks,
      currentBankIndex: stored.current_bank,
      currentBoxIndex: stored.banks[stored.current_bank].current_box,
      updatedBoxSlots: [],
      reverseLookup: buildReverseLookup(stored),
      getCurrentBank: (): SimpleOpenHomeBank => {
        const state = getReadonlyState()
        return state.banks[state.currentBankIndex]
      },
      getCurrentBankName: (): string => {
        return nameOrDefault(getReadonlyState().getCurrentBank())
      },
      getCurrentBox: (): SimpleOpenHomeBox => {
        const state = getReadonlyState()
        return state.getCurrentBank().boxes[state.currentBoxIndex]
      },
      addBank: (name: Option<string>, boxCount: number) =>
        set((state) => {
          state.banks.push(buildNewBank(state, name, boxCount))
        }),
      switchBank: (bankIndex: number) =>
        set((state) => {
          state.currentBankIndex = bankIndex
          state.currentBoxIndex = state.banks[bankIndex].current_box
        }),
      getAtLocation: (boxIndex: number, boxSlot: number): Option<OhpkmIdentifier> => {
        return getReadonlyState().getCurrentBank().boxes[boxIndex].identifiers.get(boxSlot)
      },
      setAtLocation: (boxIndex: number, boxSlot: number, identifier: OhpkmIdentifier) =>
        set((state) => {
          currentBoxMutable(state).identifiers.set(boxSlot, identifier)
          const location: BankBoxCoordinates = {
            bank: state.currentBankIndex,
            box: boxIndex,
            boxSlot,
          }
          state.reverseLookup.set(identifier, location)
          state.updatedBoxSlots.push(location)
        }),
      clearAtLocation: (boxIndex: number, boxSlot: number) =>
        set((state) => {
          const box = currentBankMutable(state).boxes[boxIndex]
          const clearedIdentifier = box.identifiers.get(boxSlot)
          box.identifiers.delete(boxSlot)

          const location: BankBoxCoordinates = {
            bank: state.currentBankIndex,
            box: boxIndex,
            boxSlot,
          }
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
      reorderBoxes: (idsInNewOrder: string[]) =>
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
        return firstEmptyBoxSlot(getReadonlyState().getCurrentBank().boxes[boxIndex])
      },
      removeDupesFromBox: (boxIndex: number) =>
        set((state) => removeDupes(currentBankMutable(state).boxes[boxIndex])),
      allMonsCurrentBank: (): OhpkmIdentifier[] => {
        return getReadonlyState()
          .getCurrentBank()
          .boxes.flatMap((box) => Array.from(box.identifiers.values()))
      },
      findIfPresent: (identifier: OhpkmIdentifier): Option<BankBoxCoordinates> => {
        return getReadonlyState().reverseLookup.get(identifier)
      },
      indexOfBoxId: (id: string): Option<number> => {
        return getReadonlyState()
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

// when called using a mutable state (via immer), mutations to the returned value
// will be preserved by immer
function currentBoxMutable<T extends BanksAndBoxesState>(
  state: T
): T['banks'][number]['boxes'][number] {
  return currentBankMutable(state).boxes[state.currentBoxIndex]
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

function nameOrDefault(item: SimpleOpenHomeBox | SimpleOpenHomeBank) {
  return item.name ?? `Bank ${item.index + 1}`
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

export function useBanksAndBoxes() {
  const store = useContext(BanksAndBoxesStoreContext)

  if (!store) {
    throw new Error(
      `useBanksAndBoxes() must be called in a component that is descended from a BanksAndBoxesStoreProvider.`
    )
  }

  const banks = useStore(store, (s) => s.banks)

  return { ...store, banks }
}
