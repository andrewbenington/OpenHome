import { closestCenter } from '@dnd-kit/collision'
import { useDroppable } from '@dnd-kit/react'
import { CSSProperties, ReactNode, useEffect, useRef } from 'react'
import { MonLocation } from 'src/state/saves/reducer'

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
  const { isDropTarget, ref } = useDroppable({
    id: dropID ?? '',
    data: dropData,
    disabled: !dropID,
    collisionDetector: closestCenter,
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
    if (isDropTarget) {
      onOverRef.current?.()
    } else {
      onNotOverRef.current?.()
    }
  }, [isDropTarget])

  return (
    <div
      className={className}
      style={{
        ...getBackgroundDetails(disabled),
        outlineStyle: 'solid',
        outlineWidth: 2,
        outlineColor: isDropTarget ? 'var(--accent-8)' : 'transparent',
        borderRadius: 3,
        display: 'grid',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        ...style,
      }}
      ref={ref}
    >
      {children}
    </div>
  )
}

export default DroppableSpace
