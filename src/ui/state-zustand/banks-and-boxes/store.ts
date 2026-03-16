import { Option, partitionResults, R, range, Result } from '@openhome-core/util/functional'
import { createContext, useCallback, useContext, useEffect } from 'react'
import { v4 as UuidV4 } from 'uuid'
import { create, StateCreator, StoreApi, UseBoundStore } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { OhpkmIdentifier } from '../../../core/pkm/Lookup'
import { getSortFunctionNullable } from '../../../core/pkm/sort'
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

export interface BankBoxCoordinates {
  bank: number
  box: number
  boxSlot: number
}

export function bankBoxCoordinates(bank: number, box: number, boxSlot: number): BankBoxCoordinates {
  return { bank, box, boxSlot }
}

export type AddBoxLocation = 'start' | 'end' | ['before', number] | ['after', number]

type ReverseLookup = Map<OhpkmIdentifier, BankBoxCoordinates>

export interface BanksAndBoxesState {
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
  overwriteBoxSlotsCurrentBank: (boxIndex: number, boxSlots: BoxMonIdentifiers) => void
  overwriteAllBoxSlotsCurrentBank: (boxSlotsByBoxIndex: Map<number, BoxMonIdentifiers>) => void
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
    immer<BanksAndBoxesState>((set, readonlyState) => {
      const requireBank = <T extends BanksAndBoxesState>(
        state: T,
        bankIndex: number
      ): T['banks'][number] => {
        const bank = state.banks[bankIndex]
        if (!bank) {
          throw new Error(`no bank with index ${bankIndex}`)
        }
        return bank
      }

      const requireBox = <T extends BanksAndBoxesState>(
        state: T,
        location: Omit<BankBoxCoordinates, 'boxSlot'>
      ) => {
        const box = state.banks[location.bank].boxes.get(location.box)
        if (!box) {
          throw new Error(`no box with index ${location.bank}`)
        }
        return box
      }

      const requireBoxCurrentBank = <T extends BanksAndBoxesState>(state: T, boxIndex: number) => {
        return requireBox(state, { bank: state.currentBankIndex, box: boxIndex })
      }

      return {
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
        overwriteBoxSlotsCurrentBank: (boxIndex: number, boxSlots: BoxMonIdentifiers) =>
          set((state) => {
            requireBoxCurrentBank(state, boxIndex).identifiers = boxSlots
          }),
        overwriteAllBoxSlotsCurrentBank: (boxSlotsByBoxIndex: Map<number, BoxMonIdentifiers>) =>
          set((state) => {
            for (const box of requireBank(state, state.currentBankIndex).boxes.values()) {
              // if an identifiers map is present for this box, overwrite the current with that.
              // otherwise clear the box
              box.identifiers = boxSlotsByBoxIndex.get(box.index) ?? new Map()
            }
          }),
        getBankName: (bankIndex: number): string => {
          return bankNameOrDefault(readonlyState().banks[bankIndex])
        },
        getCurrentBox: (): SimpleOpenHomeBox => {
          const state = readonlyState()
          return requireBoxCurrentBank(state, state.currentBoxIndex)
        },
        setCurrentBox: (boxIndex: number) =>
          set((state) => {
            state.currentBoxIndex = boxIndex
            currentBankMutable(state).current_box = boxIndex
          }),
        getBoxName: (bank: number, box: number): string => {
          return boxNameOrDefault(requireBox(readonlyState(), { bank, box }))
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
          return requireBox(readonlyState(), location).identifiers.get(location.boxSlot)
        },
        locationIsEmpty: (location: BankBoxCoordinates): boolean => {
          return readonlyState().getAtLocation(location) === undefined
        },
        setAtLocation: (location: BankBoxCoordinates, identifier: OhpkmIdentifier) =>
          set((state) => {
            requireBox(state, location).identifiers.set(location.boxSlot, identifier)
            state.reverseLookup.set(identifier, location)
            state.updatedBoxSlots.push(location)
          }),
        clearAtLocation: (location: BankBoxCoordinates) =>
          set((state) => {
            const box = requireBox(state, location)
            const clearedIdentifier = box.identifiers.get(location.boxSlot)
            box.identifiers.delete(location.boxSlot)

            if (clearedIdentifier) {
              state.reverseLookup.delete(clearedIdentifier)
            }
            state.updatedBoxSlots.push(location)
          }),
        setBoxNameCurrentBank: (boxIndex: number, boxName: Option<string>) =>
          set((state) => {
            requireBoxCurrentBank(state, boxIndex).name = boxName ?? null
          }),
        deleteBoxCurrentBank: (boxId: string) =>
          set((state) => {
            const currentBank = requireBank(state, state.currentBankIndex)
            const boxWithId = Array.from(currentBank.boxes.values()).find((b) => b.id === boxId)
            if (!boxWithId) {
              throw new Error(`no box with id ${boxId}`)
            }
            currentBank.boxes.delete(boxWithId.index)
            currentBank.boxes = rebuildBoxMapUsingIndices(currentBank.boxes)
          }),
        addBoxCurrentBank: (
          location: AddBoxLocation,
          boxName?: string,
          identifiers?: BoxMonIdentifiers
        ) =>
          set((state) => {
            const currentBank = currentBankMutable(state)
            let newBox = buildNewBox(currentBank, boxName, identifiers)
            currentBank.boxes = rebuildMapWithNewBox(currentBank.boxes, newBox, location)
          }),
        reorderBoxesCurrentBank: (idsInNewOrder: string[]) =>
          set((state) => {
            const currentBank = requireBank(state, state.currentBankIndex)
            currentBank.boxes.forEach((box) => {
              box.index = idsInNewOrder.indexOf(box.id)
            })
            currentBank.boxes = rebuildBoxMapUsingIndices(currentBank.boxes)

            const remappedBoxIndices = new Map(
              Array.from(currentBank.boxes.values()).map(
                (box, index) => [index, { ...box, index }] as const
              )
            )

            // reverse lookup now has outdated box indexes, so they need to be updated
            Array.from(state.reverseLookup).forEach(([, location]) => {
              location.box = remappedBoxIndices.get(location.box)?.index ?? location.box
            })
          }),
        firstEmptySlotInBox: (boxIndex: number): Option<number> => {
          return firstEmptyBoxSlot(requireBoxCurrentBank(readonlyState(), boxIndex))
        },
        removeDupesFromBox: (boxIndex: number) =>
          set((state) => {
            removeDupes(requireBoxCurrentBank(state, boxIndex))
          }),
        allMonsCurrentBank: (): OhpkmIdentifier[] => {
          return Array.from(readonlyState().getCurrentBank().boxes.values()).flatMap((box) =>
            Array.from(box.identifiers.values())
          )
        },
        allMonsInBoxCurrentBank: (boxIndex: number): OhpkmIdentifier[] => {
          const box = readonlyState().getCurrentBank().boxes.get(boxIndex)
          if (!box) {
            throw new Error(`no box with index ${boxIndex}`)
          }
          return Array.from(box.identifiers.values())
        },
        findHomeLocation: (identifier: OhpkmIdentifier): Option<BankBoxCoordinates> => {
          return readonlyState().reverseLookup.get(identifier)
        },
        indexOfBoxId: (id: string): Option<number> => {
          return Array.from(readonlyState().getCurrentBank().boxes).find(
            ([, box]) => box.id === id
          )?.[0]
        },
      }
    }) as StateCreator<BanksAndBoxesState, [], []>
  )

// when called using a mutable state (via immer), mutations to the returned value
// will be preserved by immer
function currentBankMutable<T extends BanksAndBoxesState>(state: T): T['banks'][number] {
  return state.banks[state.currentBankIndex]
}

export type BoxMap = Map<number, SimpleOpenHomeBox>

function rebuildMapWithNewBox(
  existingBoxes: BoxMap,
  newBox: SimpleOpenHomeBox,
  insertLocation: AddBoxLocation
): BoxMap {
  const boxesInOrder = Array.from(existingBoxes.values()).toSorted(numericSorter((b) => b.index))
  const pivot =
    insertLocation === 'start'
      ? 0
      : insertLocation === 'end'
        ? boxesInOrder.length
        : insertLocation[0] === 'before'
          ? insertLocation[1]
          : insertLocation[1] + 1
  const boxesInNewOrder = [...boxesInOrder.slice(0, pivot), newBox, ...boxesInOrder.slice(pivot)]

  return boxMapFromOrdered(boxesInNewOrder)
}

function rebuildBoxMapUsingIndices(boxes: BoxMap): BoxMap {
  return new Map(
    Array.from(boxes.values())
      .sort(numericSorter((box) => box.index))
      .map((box, index) => [index, { ...box, index }] as const)
  )
}

export function boxMapFromOrdered(boxesInOrder: SimpleOpenHomeBox[]): BoxMap {
  return new Map(boxesInOrder.map((box, index) => [index, { ...box, index }] as const))
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
    boxes: boxMapFromOrdered(
      range(boxCount).map((_, index) => ({
        id: UuidV4(),
        name: null,
        index,
        identifiers: new Map(),
      }))
    ),
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
    index: bank.boxes.size,
    identifiers: identifiers ?? new Map(),
  }
}

function firstEmptyBoxSlot(box: SimpleOpenHomeBox): Option<number> {
  let firstEmptyIndex: Option<number> = undefined
  for (const [index, contents] of box.identifiers) {
    if (!contents && (firstEmptyIndex === undefined || firstEmptyIndex > index)) {
      firstEmptyIndex = index
    }
  }

  return firstEmptyIndex
}

function buildReverseLookup(stored: StoredBankData): ReverseLookup {
  const reverseLookup: ReverseLookup = new Map()
  for (const bank of stored.banks) {
    for (const [boxIndex, box] of bank.boxes) {
      for (const [boxSlot, identifier] of box.identifiers) {
        reverseLookup.set(identifier, { bank: bank.index, box: boxIndex, boxSlot })
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

  for (let slot = 0; slot < OPENHOME_BOX_SLOTS; slot++) {
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
  const overwriteBoxSlotsCurrentBank = withSelectors.use.overwriteBoxSlotsCurrentBank()
  const overwriteAllBoxSlotsCurrentBank = withSelectors.use.overwriteAllBoxSlotsCurrentBank()

  const getMonAtHomeLocation = withSelectors.use.getAtLocation()
  const homeLocationIsEmpty = withSelectors.use.locationIsEmpty()
  const clearAtHomeLocation = withSelectors.use.clearAtLocation()
  const setAtHomeLocation = withSelectors.use.setAtLocation()
  const findHomeLocation = withSelectors.use.findHomeLocation()

  const allMonsInCurrentBank = withSelectors.use.allMonsCurrentBank()
  const allMonsInHomeBoxCurrentBank = withSelectors.use.allMonsInBoxCurrentBank()
  const firstHomeBoxEmptySlot = withSelectors.use.firstEmptySlotInBox()

  function switchToPreviousBox() {
    const currentBankBoxCount = getCurrentBank().boxes.size
    switchBoxCurrentBank(
      getCurrentBank().current_box > 0 ? getCurrentBank().current_box - 1 : currentBankBoxCount - 1
    )
  }

  function switchToNextBox() {
    const currentBankBoxCount = getCurrentBank().boxes.size
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
    const box = getCurrentBank().boxes.get(boxIndex)
    if (!box) {
      return R.Ok(null)
    }

    const newSlots: BoxMonIdentifiers = new Map()

    for (const slot of range(box.identifiers.size)) {
      if (slot < sorted.length) {
        newSlots.set(slot, sorted[slot].openhomeId)
      }
    }

    overwriteBoxSlotsCurrentBank(boxIndex, newSlots)

    return R.Ok(null)
  }

  function sortAllHomeBoxes(sortType: string): Result<null, IdentifierNotPresentError[]> {
    const loadResults = ohpkmStore.tryLoadFromIds(allMonsInCurrentBank())
    const { successes: allMons, failures } = partitionResults(loadResults)
    if (failures.length) {
      return R.Err(failures)
    }

    const sorted = allMons.toSorted(getSortFunctionNullable(sortType))

    const currentBankBoxCount = getCurrentBank().boxes.size

    const newBoxSlotsByIndex: Map<number, BoxMonIdentifiers> = new Map()

    for (const box of range(currentBankBoxCount)) {
      const newSlots: BoxMonIdentifiers = new Map()
      for (const slot of range(OPENHOME_BOX_SLOTS)) {
        const monIndex = box * OPENHOME_BOX_SLOTS + slot
        if (monIndex < sorted.length) {
          newSlots.set(slot, sorted[monIndex].openhomeId)
        }
      }
      if (newSlots.size) {
        newBoxSlotsByIndex.set(box, newSlots)
      }
    }

    overwriteAllBoxSlotsCurrentBank(newBoxSlotsByIndex)

    return R.Ok(null)
  }

  // adds the necessary boxes to contain the given ids, and returns the index of the first created box
  function addBoxesWithIds(ids: OhpkmIdentifier[], boxName?: string): Option<number> {
    if (ids.length === 0) return undefined

    const firstNewBoxIndex = getCurrentBank().boxes.size

    for (let i = 0; i < ids.length; i += OPENHOME_BOX_SLOTS) {
      const identifiers: BoxMonIdentifiers = new Map()
      for (let slot = 0; slot < OPENHOME_BOX_SLOTS; slot++) {
        identifiers.set(slot, ids[i + slot])
      }
      addBoxCurrentBank('end', boxName, identifiers)
    }

    return firstNewBoxIndex
  }

  const saveChanges = useCallback(async () => {
    await backend.writeHomeBanks({
      banks,
      current_bank: getCurrentBank().index,
    })
    await reloadBankStore()
  }, [backend, banks, getCurrentBank, reloadBankStore])

  useEffect(() => {
    // returns a function to stop listening
    const stopListening = backend.registerListeners({
      onSave: saveChanges,
    })

    // the "stop listening" function should be called when the effect returns,
    // otherwise duplicate listeners will exist
    return () => {
      stopListening()
    }
  }, [backend, saveChanges, reloadBankStore])

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
