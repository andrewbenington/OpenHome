import { useCallback, useContext } from 'react'
import { DragMode, DragMonContext, DragPayload, locationsEqual } from '.'
import { MonLocation } from '../saves'

export default function useDragAndDrop() {
  const [dragState, setDragState] = useContext(DragMonContext)

  const startDragging = useCallback(
    (payload: DragPayload) => {
      setDragState((prev) => {
        return { ...prev, payload }
      })
    },
    [setDragState]
  )

  const endDragging = useCallback(() => {
    setDragState((prev) => {
      return { ...prev, payload: undefined }
    })
  }, [setDragState])

  const setMode = useCallback(
    (mode: DragMode) => {
      setDragState((prev) => {
        return { ...prev, mode }
      })
    },
    [setDragState]
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
        const isSelected = prev.selectedLocations.some((loc) => locationsEqual(loc, location))

        if (isSelected) {
          return {
            ...prev,
            selectedLocations: prev.selectedLocations.filter(
              (loc) => !locationsEqual(loc, location)
            ),
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
        const isSelected = prev.selectedLocations.some((loc) => locationsEqual(loc, location))
        if (isSelected === select) return prev

        if (!select) {
          return {
            ...prev,
            selectedLocations: prev.selectedLocations.filter(
              (loc) => !locationsEqual(loc, location)
            ),
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
      return dragState.selectedLocations.some((loc) => locationsEqual(loc, location))
    },
    [dragState.selectedLocations]
  )

  return {
    dragState,
    startDragging,
    endDragging,
    setMode,
    // Multi-select functions
    toggleMultiSelect,
    setMultiSelectEnabled,
    toggleSelection,
    setSelection,
    clearSelections,
    isSelected,
  }
}
