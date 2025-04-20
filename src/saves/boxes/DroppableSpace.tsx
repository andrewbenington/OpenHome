import { closestCenter } from '@dnd-kit/collision'
import { useDroppable } from '@dnd-kit/react'
import { ReactNode, useContext, useEffect } from 'react'
import { DragMonContext } from '../../state/dragMon'
import { MonLocation } from '../../state/openSaves'

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
  dropID?: string
  dropData?: MonLocation
  disabled?: boolean
  onOver?: () => void
  onNotOver?: () => void
  children?: ReactNode
}

const DroppableSpace = ({
  dropID,
  dropData,
  disabled,
  onOver,
  onNotOver,
  children,
}: DroppableSpaceProps) => {
  const [dragMonState] = useContext(DragMonContext)
  const { isDropTarget, ref } = useDroppable({
    id: dropID ?? '',
    data: dropData,
    disabled: !dropID,
    collisionDetector: closestCenter,
  })

  useEffect(() => {
    if (isDropTarget) {
      onOver && onOver()
    }
  }, [isDropTarget, onOver])

  if (onNotOver && !isDropTarget) {
    onNotOver()
  }

  console.log({ isDropTarget, dropID, location, disabled, dragMonState })

  return (
    <div
      className="pokemon-slot"
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
      }}
      ref={ref}
    >
      {children}
    </div>
  )
}

export default DroppableSpace
