import { createContext, Dispatch, SetStateAction, useMemo } from 'react'
import { create } from 'zustand'
import { locationKey } from '.'
import { MonLocation } from '../saves'

const useMultiSelectState = create<MultiSelectState>(defaultMultiSelectState)

export const useMultiSelectToggle = () => {
  const setEnabled = (enabled: boolean) =>
    useMultiSelectState.setState({
      multiSelectEnabled: enabled,
      selectedLocations: [],
    })
  const enabled = useMultiSelectState().multiSelectEnabled

  return { enabled, setEnabled }
}

export default function useMultiSelect() {
  const multiSelectState = useMultiSelectState()

  const selectedLocationKeys = useMemo(
    () => new Set(multiSelectState.selectedLocations.map(locationKey)),
    [multiSelectState.selectedLocations]
  )

  const clearSelections = () => {
    useMultiSelectState.setState((prev) => {
      return { ...prev, selectedLocations: [] }
    })
  }

  const isSelected = (location: MonLocation) => selectedLocationKeys.has(locationKey(location))

  const toggleLocationSelected = (location: MonLocation) => {
    useMultiSelectState.setState((prev) => {
      const thisKey = locationKey(location)
      const selectedLocations = isSelected(location)
        ? prev.selectedLocations.filter((other) => locationKey(other) !== thisKey)
        : [...prev.selectedLocations, location]

      return { selectedLocations, multiSelectEnabled: true }
    })
  }

  return {
    ...multiSelectState,
    clearSelections,
    isSelected,
    toggleLocationSelected,
  }
}

export type MultiSelectState = {
  multiSelectEnabled: boolean
  selectedLocations: MonLocation[]
}

export type MultiSelectController = ReturnType<typeof useMultiSelect>

export function defaultMultiSelectState(): MultiSelectState {
  return {
    multiSelectEnabled: false,
    selectedLocations: [],
  }
}

export const MultiSelectContext = createContext<
  [MultiSelectState, Dispatch<SetStateAction<MultiSelectState>>]
>([defaultMultiSelectState(), () => null])
