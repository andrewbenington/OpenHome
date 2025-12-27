import { useDroppable } from '@dnd-kit/core'
import { MonLocation } from '@openhome-ui/state/saves'
import { CSSProperties, ReactNode, useEffect, useRef } from 'react'

const getBackgroundDetails = (disabled?: boolean) => {
  if (disabled) {
    return {
      backgroundBlendMode: 'multiply',
      backgroundColor: '#555',
    }
  }
  return {
    backgroundColor: '#0000',
  }
}

export interface DroppableSpaceProps {
  className?: string
  dropID?: string
  dropData?: MonLocation
  disabled?: boolean
  onOver?: () => void
  onNotOver?: () => void
  children?: ReactNode
  style?: CSSProperties
}

const DroppableSpace = ({
  className,
  dropID,
  dropData,
  disabled,
  onOver,
  onNotOver,
  children,
  style,
}: DroppableSpaceProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id: dropID ?? '',
    data: dropData,
    disabled: disabled || !dropID,
  })
  const onOverRef = useRef(onOver)
  const onNotOverRef = useRef(onNotOver)

  useEffect(() => {
    onOverRef.current = onOver
  }, [onOver])

  useEffect(() => {
    onNotOverRef.current = onNotOver
  }, [onNotOver])

  useEffect(() => {
    if (isOver) {
      onOverRef.current?.()
    } else {
      onNotOverRef.current?.()
    }
  }, [isOver])

  return (
    <div
      className={className}
      style={{
        ...getBackgroundDetails(disabled),
        outlineStyle: 'solid',
        outlineWidth: 2,
        outlineColor: isOver ? 'var(--accent-8)' : 'transparent',
        borderRadius: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        ...style,
      }}
      ref={setNodeRef}
    >
      {children}
    </div>
  )
}

export default DroppableSpace
