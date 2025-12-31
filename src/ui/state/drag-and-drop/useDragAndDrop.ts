import { useCallback, useContext } from 'react'
import { DragMode, DragMonContext, DragPayload } from '.'

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

  return {
    dragState,
    startDragging,
    endDragging,
    setMode,
  }
}
