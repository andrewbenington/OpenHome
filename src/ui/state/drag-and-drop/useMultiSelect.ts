import { createContext, Dispatch, SetStateAction, useCallback, useContext, useMemo } from 'react'
import { locationKey } from '.'
import { MonLocation } from '../saves'

export default function useMultiSelect() {
  const [multiSelectState, setMultiSelectState] = useContext(MultiSelectContext)
  const selectedLocationKeys = useMemo(
    () => new Set(multiSelectState.selectedLocations.map(locationKey)),
    [multiSelectState.selectedLocations]
  )

  const toggleMultiSelect = useCallback(() => {
    setMultiSelectState((prev) => {
      return {
        ...prev,
        multiSelectEnabled: !prev.multiSelectEnabled,
        selectedLocations: [],
      }
    })
  }, [setMultiSelectState])

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

  const toggleSelection = useCallback(
    (location: MonLocation) => {
      setMultiSelectState((prev) => {
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
    },
    [setMultiSelectState]
  )

  const setSelection = useCallback(
    (location: MonLocation, select: boolean) => {
      setMultiSelectState((prev) => {
        const key = locationKey(location)
        const isSelected = prev.selectedLocations.some((loc) => locationKey(loc) === key)
        if (isSelected === select) return prev

        if (!select) {
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
    multiSelectState,
    toggleMultiSelect,
    setMultiSelectEnabled,
    toggleSelection,
    setSelection,
    clearSelections,
    isSelected,
  }
}

export type MultiSelectState = {
  multiSelectEnabled: boolean
  selectedLocations: MonLocation[]
}

export function defaultMultiSelectState(): MultiSelectState {
  return {
    multiSelectEnabled: false,
    selectedLocations: [],
  }
}

export const MultiSelectContext = createContext<
  [MultiSelectState, Dispatch<SetStateAction<MultiSelectState>>]
>([defaultMultiSelectState(), () => null])
