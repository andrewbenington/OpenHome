import { useDroppable } from '@dnd-kit/core'
import { MonLocation } from '@openhome-ui/state/saves'
import { cssClass } from '@openhome-ui/util/style'
import { CSSProperties, ReactNode, useEffect, useEffectEvent } from 'react'
import './DroppableSpace.css'

const getBackgroundDetails = (disabled?: boolean): CSSProperties => {
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
  const onOverEvent = useEffectEvent(() => onOver?.())
  const onNotOverEvent = useEffectEvent(() => onNotOver?.())

  useEffect(() => {
    if (isOver) {
      onOverEvent()
    } else {
      onNotOverEvent()
    }
  }, [isOver])

  return (
    <div
      className={cssClass('droppable-space').with(className).build()}
      style={{
        ...getBackgroundDetails(disabled),
        outlineColor: isOver ? 'var(--accent-8)' : 'transparent',
        ...style,
      }}
      ref={setNodeRef}
    >
      {children}
    </div>
  )
}

export default DroppableSpace
