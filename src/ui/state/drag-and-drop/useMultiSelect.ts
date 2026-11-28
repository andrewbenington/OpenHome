import { createContext, Dispatch, SetStateAction, useCallback, useMemo } from 'react'
import { create } from 'zustand'
import { locationKey } from '.'
import { MonLocation } from '../saves'

const useMultiSelect2 = create<MultiSelectState>(defaultMultiSelectState)

export const useToggleMultiselect = () => (value: boolean) =>
  useMultiSelect2.setState((prev) => ({ ...prev, multiSelectEnabled: value }))

export const useSelectLocation = () => (location: MonLocation) => {
  useMultiSelect2.setState((prev) => {
    const key = locationKey(location)
    const isSelected = prev.selectedLocations.some((loc) => locationKey(loc) === key)

    if (isSelected) {
      return {
        ...prev,
        selectedLocations: prev.selectedLocations.filter((loc) => locationKey(loc) !== key),
      }
    } else {
      return {
        ...prev,
        selectedLocations: [...prev.selectedLocations, location],
      }
    }
  })
}

export default function useMultiSelect() {
  const [multiSelectState, setMultiSelectState] = [useMultiSelect2(), useMultiSelect2.setState]
  const selectedLocationKeys = useMemo(
    () => new Set(multiSelectState.selectedLocations.map(locationKey)),
    [multiSelectState.selectedLocations]
  )

  const setMultiSelectEnabled = useCallback(
    (enabled: boolean) => {
      setMultiSelectState((prev) => {
        return {
          ...prev,
          multiSelectEnabled: enabled,
          selectedLocations: enabled ? prev.selectedLocations : [],
        }
      })
    },
    [setMultiSelectState]
  )

  const clearSelections = useCallback(() => {
    setMultiSelectState((prev) => {
      return { ...prev, selectedLocations: [] }
    })
  }, [setMultiSelectState])

  const isSelected = useCallback(
    (location: MonLocation) => {
      return selectedLocationKeys.has(locationKey(location))
    },
    [selectedLocationKeys]
  )

  return {
    ...multiSelectState,
    setMultiSelectEnabled,
    clearSelections,
    isSelected,
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
