import {
  DndContext,
  DragOverEvent,
  DragOverlay,
  PointerSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { getItemIconPath } from '@openhome-ui/images/items'
import { useItems } from '@openhome-ui/state/items'
import { useOhpkmStore } from '@openhome-ui/state/ohpkm'
import { MonLocation, useSaves } from '@openhome-ui/state/saves'
import { MetadataLookup } from '@pkm-rs/pkg'
import { ReactNode, useCallback, useState } from 'react'
import { displayIndexAdder, isBattleFormeItem, isMegaStone } from 'src/core/pkm/util'
import PokemonIcon from 'src/ui/components/PokemonIcon'
import { DragPayload } from '.'
import useDragAndDrop from './useDragAndDrop'

export default function PokemonDndContext(props: { children?: ReactNode }) {
  const { children } = props
  const savesAndBanks = useSaves()
  const ohpkmStore = useOhpkmStore()
  const { moveMonItemToBag, giveItemToMon } = useItems()
  const { dragState, startDragging, endDragging } = useDragAndDrop()
  const [dragOverId, setDragOverId] = useState<UniqueIdentifier | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
      delay: { value: 200, tolerance: 10 },
    })
  )

  const draggingMon = dragState.payload?.kind === 'mon' ? dragState.payload.monData.mon : undefined
  let formeNumber = draggingMon?.formeNum ?? 0

  if (draggingMon && isMegaStone(draggingMon.heldItemIndex)) {
    const megaForStone = MetadataLookup(
      draggingMon.dexNum,
      draggingMon.formeNum
    )?.megaEvolutions.find((mega) => mega.requiredItemId === draggingMon.heldItemIndex)

    if (megaForStone) formeNumber = megaForStone.megaForme.formeIndex
  } else if (draggingMon && isBattleFormeItem(draggingMon.dexNum, draggingMon.heldItemIndex)) {
    formeNumber = displayIndexAdder(draggingMon.heldItemIndex)(draggingMon.formeNum)
  }

  const onDragOver = useCallback(
    (e: DragOverEvent) => {
      setDragOverId(e.over?.id ?? null)
    },
    [setDragOverId]
  )

  return (
    <DndContext
      onDragEnd={(e) => {
        setDragOverId(null)

        const target = e.active.data.current as DragPayload | undefined
        if (!target) return

        const dest = e.over?.data.current
        const payload = dragState.payload

        const dropElementId = e.over?.id

        if (!payload) return

        if (payload.kind === 'item') {
          if (isMonLocation(dest) && target) {
            giveItemToMon(dest, payload.item)
          }
          endDragging()
          return
        }

        const { mon } = payload.monData

        if (dropElementId === 'to_release') {
          savesAndBanks.releaseMonAtLocation(payload.monData)
        } else if (dropElementId === 'item-bag') {
          moveMonItemToBag(payload.monData)
        } else if (
          isMonLocation(dest) &&
          (dest.is_home ||
            savesAndBanks
              .saveFromIdentifier(dest.saveIdentifier)
              .supportsMon(mon.dexNum, mon.formeNum))
        ) {
          const source = payload.monData

          // If moving mon outside of its save, start persisting this mon's data in OpenHome
          // (if it isnt already)
          if (source.is_home || dest.is_home || source.saveIdentifier !== dest.saveIdentifier) {
            ohpkmStore.overwrite(new OHPKM(mon))
          }

          // Move item to OpenHome bag if not supported by the save file
          if (
            mon.heldItemIndex &&
            !dest.is_home &&
            !savesAndBanks.saveFromIdentifier(dest.saveIdentifier).supportsItem(mon.heldItemIndex)
          ) {
            moveMonItemToBag(source)
          }

          savesAndBanks.moveMon(source, dest)
        }

        endDragging()
      }}
      onDragStart={(e) => {
        if (e.active.data?.current) {
          startDragging(e.active.data.current as DragPayload)
        }
      }}
      onDragOver={onDragOver}
      onDragCancel={endDragging}
      sensors={sensors}
    >
      <DragOverlay style={{ cursor: 'grabbing' }}>
        {dragState.payload?.kind === 'item' ? (
          <img
            className="draggable-item"
            src={getPublicImageURL(getItemIconPath(dragState.payload.item.index))}
            alt={dragState.payload.item.name}
            draggable={false}
          />
        ) : (
          dragState.payload?.kind === 'mon' && (
            <PokemonIcon
              dexNumber={dragState.payload?.monData.mon.dexNum ?? 0}
              formeNumber={formeNumber}
              isShiny={dragState.payload?.monData.mon.isShiny()}
              heldItemIndex={dragState.payload?.monData.mon.heldItemIndex}
              onlyItem={
                dragOverId === 'item-bag' && Boolean(dragState.payload?.monData.mon.heldItemIndex)
              }
              style={{ width: '100%', height: '100%' }}
            />
          )
        )}
      </DragOverlay>
      {children}
    </DndContext>
  )
}

function isMonLocation(obj: object | undefined): obj is MonLocation {
  return obj !== undefined && 'box' in obj && 'box_slot' in obj
}
