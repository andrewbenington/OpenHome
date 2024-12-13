import { useDroppable } from '@dnd-kit/core'
import { useTheme } from '@mui/joy'
import { ReactNode, useEffect } from 'react'
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
  children?: ReactNode
}

const DroppableSpace = ({ dropID, dropData, disabled, onOver, children }: DroppableSpaceProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: dropID ?? '',
    data: dropData,
    disabled: !dropID,
  })
  const { palette } = useTheme()

  useEffect(() => {
    if (isOver) {
      onOver && onOver()
    }
  }, [isOver, onOver])

  return (
    <div
      className="pokemon_slot"
      style={{
        ...getBackgroundDetails(disabled),
        outlineStyle: 'solid',
        outlineWidth: 1,
        outlineColor: isOver ? palette.primary.mainChannel : 'transparent',
        borderRadius: 3,
        display: 'grid',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
      }}
      ref={setNodeRef}
    >
      {children}
    </div>
  )
}

export default DroppableSpace
