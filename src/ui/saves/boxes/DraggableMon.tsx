import { useDraggable } from '@dnd-kit/core'
import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { displayIndexAdder, isBattleFormeItem, isMegaStone } from '@openhome-core/pkm/util'
import { MonWithLocation } from '@openhome-ui/state/saves'
import { MetadataLookup } from '@pkm-rs/pkg'
import { useMemo } from 'react'
import PokemonIcon from '../../components/PokemonIcon'
import { TopRightIndicatorType } from '../../hooks/useMonDisplay'
import useDragAndDrop from '../../state/drag-and-drop/useDragAndDrop'
import TopRightIndicator from '../TopRightIndicator'

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
  topRightIndicator?: TopRightIndicatorType | null
  showShiny?: boolean
  showItem?: boolean
}

const DraggableMon = (props: DraggableMonProps) => {
  const { onClick, disabled, mon, dragID, dragData, topRightIndicator, showItem, showShiny } = props
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: (dragID ?? '') + mon.personalityValue?.toString(),
    data: dragData ? { kind: 'mon', monData: dragData } : undefined,
    disabled: disabled || !dragID,
  })
  const { dragState } = useDragAndDrop()

  const isDragging = useMemo(
    () =>
      dragState.payload?.kind === 'mon' &&
      dragData &&
      dragState.payload.monData.box === dragData.box &&
      dragState.payload.monData.box_slot === dragData.box_slot &&
      dragState.payload.monData.save === dragData.save,
    [dragData, dragState.payload]
  )

  let formeNumber = mon.formeNum

  if (isMegaStone(mon.heldItemIndex)) {
    const megaForStone = MetadataLookup(mon.dexNum, mon.formeNum)?.megaEvolutions.find(
      (mega) => mega.requiredItemId === mon.heldItemIndex
    )

    if (megaForStone) formeNumber = megaForStone.megaForme.formeIndex
  } else if (isBattleFormeItem(mon.dexNum, mon.heldItemIndex)) {
    formeNumber = displayIndexAdder(mon.heldItemIndex)(mon.formeNum)
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
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
        formeNumber={formeNumber}
        isShiny={showShiny && mon.isShiny()}
        isEgg={mon.isEgg}
        heldItemIndex={
          showItem && (!isDragging || dragState.mode !== 'item') ? mon.heldItemIndex : undefined
        }
        style={{
          width: '100%',
          height: '100%',
          visibility: isDragging && dragState.mode === 'mon' ? 'hidden' : undefined,
        }}
        greyedOut={disabled}
        topRightIndicator={
          topRightIndicator ? (
            <TopRightIndicator indicatorType={topRightIndicator} mon={mon} />
          ) : (
            <></>
          )
        }
      />
    </div>
  )
}

export default DraggableMon
