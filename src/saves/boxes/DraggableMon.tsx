import { useDraggable } from '@dnd-kit/react'
import { useContext, useMemo } from 'react'
import { DragMonContext } from 'src/state/dragMon'
import { displayIndexAdder, isBattleFormeItem } from 'src/types/pkm/util'
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
  const { ref } = useDraggable({
    id: (dragID ?? '') + mon.personalityValue?.toString(),
    data: dragData ? { kind: 'mon', monData: dragData } : undefined,
    disabled: disabled || !dragID,
  })
  const [dragState] = useContext(DragMonContext)

  const isDragging = useMemo(
    () =>
      dragState.payload?.kind === 'mon' &&
      dragData &&
      dragState.payload.monData.box === dragData.box &&
      dragState.payload.monData.box_slot === dragData.box_slot &&
      dragState.payload.monData.save === dragData.save,
    [dragData, dragState.payload]
  )

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
        formeNumber={
          isBattleFormeItem(mon.heldItemIndex)
            ? displayIndexAdder(mon.heldItemIndex)(mon.formeNum)
            : mon.formeNum
        }
        isShiny={mon.isShiny()}
        heldItemIndex={isDragging && dragState.mode === 'item' ? undefined : mon.heldItemIndex}
        style={{
          width: '100%',
          height: '100%',
          visibility: isDragging && dragState.mode === 'mon' ? 'hidden' : undefined,
        }}
        greyedOut={disabled}
      />
    </div>
  )
}

export default DraggableMon
