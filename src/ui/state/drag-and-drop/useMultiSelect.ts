import { createContext, Dispatch, SetStateAction, useCallback, useContext, useMemo } from 'react'
import { locationKey } from '.'
import { MonLocation } from '../saves'

export default function useMultiSelect() {
  const [dragState, setDragState] = useContext(DragMonContext)
  const selectedLocationKeys = useMemo(
    () => new Set(dragState.selectedLocations.map(locationKey)),
    [dragState.selectedLocations]
  )

  const toggleMultiSelect = useCallback(() => {
    setDragState((prev) => {
      return {
        ...prev,
        multiSelectEnabled: !prev.multiSelectEnabled,
        selectedLocations: [],
      }
    })
  }, [setDragState])

  const setMultiSelectEnabled = useCallback(
    (enabled: boolean) => {
      setDragState((prev) => {
        return {
          ...prev,
          multiSelectEnabled: enabled,
          selectedLocations: enabled ? prev.selectedLocations : [],
        }
      })
    },
    [setDragState]
  )

  const toggleSelection = useCallback(
    (location: MonLocation) => {
      setDragState((prev) => {
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
    [setDragState]
  )

  const setSelection = useCallback(
    (location: MonLocation, select: boolean) => {
      setDragState((prev) => {
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
    [setDragState]
  )

  const clearSelections = useCallback(() => {
    setDragState((prev) => {
      return { ...prev, selectedLocations: [] }
    })
  }, [setDragState])

  const isSelected = useCallback(
    (location: MonLocation) => {
      return selectedLocationKeys.has(locationKey(location))
    },
    [selectedLocationKeys]
  )

  return {
    dragState,
    // Multi-select functions
    toggleMultiSelect,
    setMultiSelectEnabled,
    toggleSelection,
    setSelection,
    clearSelections,
    isSelected,
  }
}

export type DragMonState = {
  multiSelectEnabled: boolean
  selectedLocations: MonLocation[]
}

export function emptyDragState(): DragMonState {
  return {
    multiSelectEnabled: false,
    selectedLocations: [],
  }
}

export const DragMonContext = createContext<[DragMonState, Dispatch<SetStateAction<DragMonState>>]>(
  [emptyDragState(), () => null]
)
