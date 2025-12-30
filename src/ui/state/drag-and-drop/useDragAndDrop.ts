import { DragOverEvent, UniqueIdentifier, useDndMonitor } from '@dnd-kit/core'
import { useCallback, useContext, useMemo } from 'react'
import { DragMode, DragMonContext, DragPayload, Listener } from '.'

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
        // if (prev.mode === mode) return prev
        return { ...prev, mode }
      })
    },
    [setDragState]
  )

  const registerOnEnterListener = useCallback(
    (id: UniqueIdentifier, listener: Listener) => {
      setDragState((prev) => {
        const prevListeners = new Map(prev.onEnterListeners)
        prevListeners.set(id, listener)
        return { ...prev, onEnterListeners: prevListeners }
      })
    },
    [setDragState]
  )

  const unregisterOnEnterListener = useCallback(
    (id: UniqueIdentifier) => {
      setDragState((prev) => {
        const prevListeners = new Map(prev.onEnterListeners)
        prevListeners.delete(id)
        return { ...prev, onEnterListeners: prevListeners }
      })
    },
    [setDragState]
  )

  const registerOnExitListener = useCallback(
    (id: UniqueIdentifier, listener: Listener) => {
      setDragState((prev) => {
        const prevListeners = new Map(prev.onExitListeners)
        prevListeners.set(id, listener)
        return { ...prev, onExitListeners: prevListeners }
      })
    },
    [setDragState]
  )

  const unregisterOnExitListener = useCallback(
    (id: UniqueIdentifier) => {
      setDragState((prev) => {
        const prevListeners = new Map(prev.onExitListeners)
        prevListeners.delete(id)
        return { ...prev, onExitListeners: prevListeners }
      })
    },
    [setDragState]
  )

  const setDragOverId = useCallback(
    (id: UniqueIdentifier | null) => {
      // console.log(`dragOverid: ${id}`)
      setDragState((prev) => {
        if (prev.overId === id) return prev
        // console.log(`setting drag id to ${id} (previously ${prev.overId})`)
        return { ...prev, overId: id }
      })
    },
    [setDragState]
  )

  const dragMode = useMemo(() => dragState.mode, [dragState.mode])
  const dragPayload = useMemo(() => dragState.payload, [dragState.payload])

  return {
    dragState,
    dragMode,
    dragPayload,
    startDragging,
    endDragging,
    setMode,
    registerOnEnterListener,
    unregisterOnEnterListener,
    registerOnExitListener,
    unregisterOnExitListener,
    dragOverId: dragState.overId,
    setDragOverId,
  }
}

export function useDragListeners() {
  const {
    dragState,
    setDragOverId,
    dragOverId,
    // registerOnEnterListener,
    // unregisterOnEnterListener,
    // registerOnExitListener,
    // unregisterOnExitListener,
  } = useDragAndDrop()
  console.log('useDragListeners')
  // const registerOnEnterListenerRef = useRef(registerOnEnterListener)
  // const unregisterOnEnterListenerRef = useRef(unregisterOnEnterListener)
  // const registerOnExitListenerRef = useRef(registerOnExitListener)
  // const unregisterOnExitListenerRef = useRef(unregisterOnExitListener)

  // useEffect(() => {
  //   console.log('registerOnEnterListener changed')
  // }, [registerOnEnterListener])

  const onDragOver = useCallback(
    (e: DragOverEvent) => {
      // console.log('onDragOver')
      // console.log({ newOverId, previousOverId })
      // if (newOverId) {
      //   dragState.onEnterListeners.get(newOverId)?.()
      // }
      // if (previousOverId && previousOverId !== newOverId) {
      //   dragState.onExitListeners.get(previousOverId)?.()
      // }
      setDragOverId(e.over?.id ?? null)
    },
    [setDragOverId]
  )

  useDndMonitor({
    onDragOver: onDragOver,
  })

  return {
    dragOverId,
    // registerOnEnterListener: registerOnEnterListenerRef.current,
    // unregisterOnEnterListener: unregisterOnEnterListenerRef.current,
    // registerOnExitListener: registerOnExitListenerRef.current,
    // unregisterOnExitListener: unregisterOnExitListenerRef.current,
  }
}

function logEvent(e: any) {
  console.log('logging event')
}
