import { useDraggable } from '@dnd-kit/react'
import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { displayIndexAdder, isBattleFormeItem, isMegaStone } from '@openhome-core/pkm/util'
import { TopRightBadge } from '@openhome-ui/components/badge/TopRightBadge'
import { useDraggingActive } from '@openhome-ui/state-zustand/drag-and-drop/dragStore'
import { MonWithLocation } from '@openhome-ui/state/saves'
import { MetadataSummaryLookup } from '@pkm-rs/pkg'
import { CSSProperties, useMemo } from 'react'
import PokemonIcon from '../../components/PokemonIcon'
import { MonDisplayState, TopRightBadgeType } from '../../hooks/monDisplay'
import { MonTag } from '../../util/tags'

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

interface DraggableMonProps {
  onClick: () => void
  disabled?: boolean
  mon: PKMInterface
  style: CSSProperties
  dragID?: string
  dragData?: MonWithLocation
  isSelected?: boolean
  topRightIndicator?: TopRightBadgeType | null
  showShiny?: boolean
  showItem?: boolean
  monDisplayState: MonDisplayState
}

type MonWithManagementData = PKMInterface & {
  tags?: MonTag[]
  notes?: string
}

const DraggableMon = (props: DraggableMonProps) => {
  const {
    onClick,
    disabled,
    mon,
    dragID,
    dragData,
    isSelected,
    topRightIndicator,
    showItem,
    showShiny,
    monDisplayState,
    style,
  } = props
  const { ref, isDragging } = useDraggable({
    id: (dragID ?? '') + mon.personalityValue?.toString(),
    data: dragData ? { kind: 'mon', monData: dragData } : undefined,
    disabled: disabled || !dragID,
  })
  const draggingActive = useDraggingActive()
  const monWithManagement = mon as MonWithManagementData

  const formeNumber = useMemo(() => {
    let formeNumber = mon.formIndex

    if (isMegaStone(mon.heldItemIndex)) {
      const megaForStone = MetadataSummaryLookup(
        mon.nationalDex,
        mon.formIndex
      )?.megaEvolutions.find((mega) => mega.requiredItemId === mon.heldItemIndex)

      if (megaForStone) formeNumber = megaForStone.megaForme.formIndex
    } else if (isBattleFormeItem(mon.nationalDex, mon.heldItemIndex)) {
      formeNumber = displayIndexAdder(mon.heldItemIndex)(mon.formIndex)
    }

    return formeNumber
  }, [mon.nationalDex, mon.formIndex, mon.heldItemIndex])

  const topRightIndicatorComponent = useMemo(
    () => (topRightIndicator ? <TopRightBadge badgeType={topRightIndicator} mon={mon} /> : <></>),
    [mon, topRightIndicator]
  )

  const shouldHide = isDragging || (draggingActive && isSelected)

  return (
    <div
      className="fill-parent flex-centered"
      ref={ref}
      style={{
        ...getBackgroundDetails(),
        cursor: 'pointer',
      }}
      onClick={onClick}
    >
      <PokemonIcon
        nationalDex={mon.nationalDex}
        formIndex={formeNumber}
        isShiny={showShiny && mon.isShiny()}
        gender={mon.gender}
        isEgg={mon.isEgg}
        heldItemIndex={showItem ? mon.heldItemIndex : undefined}
        style={{
          ...style,
          visibility: shouldHide ? 'hidden' : undefined,
        }}
        grayedOut={disabled}
        topRightIndicator={topRightIndicatorComponent}
        extraFormIndex={mon.extraFormIndex}
        tags={monWithManagement.tags}
        hasNotes={
          typeof monWithManagement.notes === 'string' && monWithManagement.notes.trim().length > 0
        }
        monDisplayState={monDisplayState}
      />
    </div>
  )
}

export default DraggableMon
