import { useDraggable } from '@dnd-kit/react'
import PokemonIcon from '../../components/PokemonIcon'
import { MonWithLocation } from '../../state/openSaves'
import { PKMInterface } from '../../types/interfaces'

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

export interface DraggableMonProps {
  onClick: () => void
  disabled?: boolean
  mon: PKMInterface
  style: any
  dragID?: string
  dragData?: MonWithLocation
}

const DraggableMon = ({ mon, onClick, disabled, dragData, dragID }: DraggableMonProps) => {
  const { ref, isDragging } = useDraggable({
    id: (dragID ?? '') + mon.personalityValue?.toString(),
    data: dragData,
    disabled: disabled || !dragID,
  })

  return (
    <div
      ref={ref}
      style={{
        width: '100%',
        height: '100%',
        ...getBackgroundDetails(),
        cursor: 'pointer',
      }}
      onClick={onClick}
    >
      <PokemonIcon
        dexNumber={mon.dexNum}
        formeNumber={mon.formeNum}
        isShiny={mon.isShiny()}
        heldItemIndex={mon.heldItemIndex}
        style={{
          width: '100%',
          height: '100%',
          visibility: isDragging ? 'hidden' : undefined,
        }}
        greyedOut={disabled}
      />
    </div>
  )
}

export default DraggableMon
