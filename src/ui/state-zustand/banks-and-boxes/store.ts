import { Option } from '@openhome-core/util/functional'
import { createContext, useContext } from 'react'
import { create, StateCreator, useStore } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { OhpkmIdentifier } from '../../../core/pkm/Lookup'
import { BankBoxCoordinates } from '../../../core/save/HomeData'
import { SimpleOpenHomeBank, StoredBankData } from '../../../core/save/util/storage'

interface BanksAndBoxesState {
  banks: SimpleOpenHomeBank[]
  currentBankIndex: number
  currentBoxIndex: number
  updatedBoxSlots: BankBoxCoordinates[]
  setAtLocation: (boxIndex: number, boxSlot: number, contents: Option<OhpkmIdentifier>) => void
}

export const createBanksAndBoxesStore = (stored: StoredBankData) =>
  create<BanksAndBoxesState>()(
    immer<BanksAndBoxesState>((set) => ({
      banks: stored.banks,
      currentBankIndex: stored.current_bank,
      currentBoxIndex: stored.banks[stored.current_bank].current_box,
      updatedBoxSlots: [],
      setAtLocation: (boxIndex: number, boxSlot: number, contents: Option<OhpkmIdentifier>) =>
        set((state) => {
          const box = state.banks[state.currentBankIndex].boxes[boxIndex]
          if (contents) {
            box.identifiers.set(boxSlot, contents)
          } else {
            box.identifiers.delete(boxSlot)
          }
          state.updatedBoxSlots.push({ bank: state.currentBankIndex, box: boxIndex, boxSlot })
        }),
    })) as StateCreator<BanksAndBoxesState, [], []>
  )

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

  const getAtLocation = (location: BankBoxCoordinates): Option<OhpkmIdentifier> => {
    const bank = banks[location.bank]
    const box = bank?.boxes[location.box]

    return box?.identifiers.get(location.boxSlot)
  }

  return { getAtLocation, banks }
}
