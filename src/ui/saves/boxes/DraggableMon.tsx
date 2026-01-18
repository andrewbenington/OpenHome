import { useDraggable } from '@dnd-kit/core'
import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { displayIndexAdder, isBattleFormeItem, isMegaStone } from '@openhome-core/pkm/util'
import { MonWithLocation } from '@openhome-ui/state/saves'
import { MetadataLookup } from '@pkm-rs/pkg'
import { CSSProperties, useMemo } from 'react'
import PokemonIcon from '../../components/PokemonIcon'
import { TopRightIndicatorType } from '../../hooks/useMonDisplay'
import useDragAndDrop from '../../state/drag-and-drop/useDragAndDrop'
import { Indicator } from '../Indicator'

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
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: (dragID ?? '') + mon.personalityValue?.toString(),
    data: dragData ? { kind: 'mon', monData: dragData } : undefined,
    disabled: disabled || !dragID,
  })
  const { dragState } = useDragAndDrop()

  const formeNumber = useMemo(() => {
    let formeNumber = mon.formeNum

    if (isMegaStone(mon.heldItemIndex)) {
      const megaForStone = MetadataLookup(mon.dexNum, mon.formeNum)?.megaEvolutions.find(
        (mega) => mega.requiredItemId === mon.heldItemIndex
      )

      if (megaForStone) formeNumber = megaForStone.megaForme.formeIndex
    } else if (isBattleFormeItem(mon.dexNum, mon.heldItemIndex)) {
      formeNumber = displayIndexAdder(mon.heldItemIndex)(mon.formeNum)
    }

    return formeNumber
  }, [mon.dexNum, mon.formeNum, mon.heldItemIndex])

  const topRightIndicatorComponent = useMemo(
    () =>
      topRightIndicator ? (
        <Indicator.TopRight indicatorType={topRightIndicator} mon={mon} />
      ) : (
        <></>
      ),
    [mon, topRightIndicator]
  )

  const style: CSSProperties = useMemo(
    () => ({
      width: '100%',
      height: '100%',
      visibility: isDragging && dragState.mode === 'mon' ? 'hidden' : undefined,
    }),
    [dragState.mode, isDragging]
  )

  return (
    <div
      className="fill-parent"
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
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
        style={style}
        grayedOut={disabled}
        topRightIndicator={topRightIndicatorComponent}
      />
    </div>
  )
}

export default DraggableMon
