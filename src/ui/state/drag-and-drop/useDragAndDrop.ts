import { useContext } from 'react'
import { DragMode, DragMonContext, DragPayload } from '.'

export default function useDragAndDrop() {
  const [dragState, setDragState] = useContext(DragMonContext)

  function startDragging(payload: DragPayload) {
    setDragState({ ...dragState, payload })
  }

  function endDragging() {
    setDragState({ ...dragState, payload: undefined })
  }

  function setMode(mode: DragMode) {
    setDragState({ ...dragState, mode })
  }

  return { dragState, startDragging, endDragging, setMode }
}
