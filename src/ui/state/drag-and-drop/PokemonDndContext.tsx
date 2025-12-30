import {
  DndContext,
  DragOverEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { getItemIconPath } from '@openhome-ui/images/items'
import { useItems } from '@openhome-ui/state/items'
import { useOhpkmStore } from '@openhome-ui/state/ohpkm'
import { MonLocation, useSaves } from '@openhome-ui/state/saves'
import { ReactNode, useCallback } from 'react'
import PokemonIcon from 'src/ui/components/PokemonIcon'
import { DragPayload } from '.'
import useDragAndDrop from './useDragAndDrop'

export default function PokemonDndContext(props: { children?: ReactNode }) {
  const { children } = props
  const savesAndBanks = useSaves()
  const ohpkmStore = useOhpkmStore()
  const { moveMonItemToBag, giveItemToMon } = useItems()
  const { dragState, startDragging, endDragging, dragOverId, setDragOverId } = useDragAndDrop()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
      delay: { value: 200, tolerance: 10 },
    })
  )

  const draggingMon = dragState.payload?.kind === 'mon' ? dragState.payload.monData.mon : undefined
  let formeNumber = draggingMon?.formeNum ?? 0

  // if (draggingMon && isMegaStone(draggingMon.heldItemIndex)) {
  //   const megaForStone = MetadataLookup(
  //     draggingMon.dexNum,
  //     draggingMon.formeNum
  //   )?.megaEvolutions.find((mega) => mega.requiredItemId === draggingMon.heldItemIndex)

  //   if (megaForStone) formeNumber = megaForStone.megaForme.formeIndex
  // } else if (draggingMon && isBattleFormeItem(draggingMon.dexNum, draggingMon.heldItemIndex)) {
  //   formeNumber = displayIndexAdder(draggingMon.heldItemIndex)(draggingMon.formeNum)
  // }

  const onDragOver = useCallback(
    (e: DragOverEvent) => {
      console.log(e.over?.id)
      setDragOverId(e.over?.id ?? null)
    },
    [setDragOverId]
  )

  return (
    <DndContext
      onDragEnd={(e) => {
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
          return
        }

        const { mon } = payload.monData

        if (dropElementId === 'to_release') {
          savesAndBanks.releaseMonAtLocation(payload.monData)
        } else if (dropElementId === 'item-bag') {
          moveMonItemToBag(payload.monData)
        } else if (
          isMonLocation(dest) &&
          (dest.is_home || dest.save.supportsMon(mon.dexNum, mon.formeNum))
        ) {
          const source = payload.monData

          // If moving mon outside of its save, start persisting this mon's data in OpenHome
          // (if it isnt already)
          if (source.save !== dest.save) {
            ohpkmStore.overwrite(new OHPKM(mon))
          }

          // Move item to OpenHome bag if not supported by the save file
          if (mon.heldItemIndex && !dest.is_home && !dest.save?.supportsItem(mon.heldItemIndex)) {
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
      sensors={sensors}
    >
      <DragOverlay style={{ cursor: 'grabbing' }}>
        {dragState.payload?.kind === 'item' ? (
          <img
            src={getPublicImageURL(getItemIconPath(dragState.payload.item.index))}
            alt={dragState.payload.item.name}
            style={{ width: 32, height: 32 }}
            draggable={false}
          />
        ) : (
          dragState.payload?.kind === 'mon' && (
            // <div>{dragState.payload?.monData.mon.dexNum ?? 0}</div>
            <PokemonIcon
              dexNumber={dragState.payload?.monData.mon.dexNum ?? 0}
              formeNumber={formeNumber}
              isShiny={dragState.payload?.monData.mon.isShiny()}
              heldItemIndex={dragState.payload?.monData.mon.heldItemIndex}
              onlyItem={dragOverId === 'item-bag'}
              style={{ width: '100%', height: '100%' }}
            />
          )
        )}
      </DragOverlay>
      <div
        style={{ position: 'absolute', top: 0, height: 20, width: 200, backgroundColor: 'orange' }}
      >
        {dragOverId}
      </div>
      {children}
    </DndContext>
  )
}

function isMonLocation(obj: object | undefined): obj is MonLocation {
  return obj !== undefined && 'box' in obj && 'box_slot' in obj
}
