import { useDraggable } from '@dnd-kit/react'
import { OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import { displayIndexAdder, isBattleFormItem, isMegaStone } from '@openhome-core/pkm/util'
import { PkmFormSpecifiers } from '@openhome-core/pkm/util/pkmInterface'
import { FullMetadataLookup } from '@openhome-core/util'
import {
  TopRightBadge,
  TopRightBadgelMon as TopRightBadgeMon,
} from '@openhome-ui/components/badge/TopRightBadge'
import { useDraggingActive } from '@openhome-ui/state-zustand/drag-and-drop/dragStore'
import { MonWithLocation } from '@openhome-ui/state/saves'
import { Gender } from '@pkm-rs/pkg'
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
  mon: DraggableMonData
  style: CSSProperties
  dragID?: string
  dragData?: MonWithLocation
  isSelected?: boolean
  topRightIndicator?: TopRightBadgeType | null
  showShiny?: boolean
  showItem?: boolean
  monDisplayState: MonDisplayState
}

export type DraggableMonData = PkmFormSpecifiers &
  TopRightBadgeMon & {
    heldItemIndex: number
    nickname: string

    gender?: Gender

    personalityValue?: number

    isNicknamed?: boolean
    isShiny: () => boolean
    isEgg?: boolean

    tags?: MonTag[]
    notes?: string
    displayColor?: string

    openhomeId?: OhpkmIdentifier
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

  const formNumber = useMemo(() => {
    let formNumber = mon.formIndex

    if (isMegaStone(mon.heldItemIndex)) {
      const megaForStone = FullMetadataLookup(mon)?.megaEvolutions.find(
        (mega) => mega.requiredItemId === mon.heldItemIndex
      )

      if (megaForStone) formNumber = megaForStone.megaForm.formIndex
    } else if (isBattleFormItem(mon.nationalDex, mon.heldItemIndex)) {
      formNumber = displayIndexAdder(mon.heldItemIndex)(mon.formIndex)
    }

    return formNumber
  }, [mon])

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
        formIndex={formNumber}
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
        tags={mon.tags}
        hasNotes={typeof mon.notes === 'string' && mon.notes.trim().length > 0}
        monDisplayState={monDisplayState}
      />
    </div>
  )
}

export default DraggableMon
