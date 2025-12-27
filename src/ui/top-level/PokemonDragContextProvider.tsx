import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { getItemIconPath } from '@openhome-ui/images/items'
import { useItems } from '@openhome-ui/state/items'
import { useOhpkmStore } from '@openhome-ui/state/ohpkm'
import { MonLocation, useSaves } from '@openhome-ui/state/saves'
import { MetadataLookup } from '@pkm-rs/pkg'
import { ReactNode } from 'react'
import { displayIndexAdder, isBattleFormeItem, isMegaStone } from '../../core/pkm/util'
import { DragPayload } from '../state/drag-and-drop'
import useDragAndDrop from '../state/drag-and-drop/useDragAndDrop'

export default function PokemonDragContextProvider(props: { children?: ReactNode }) {
  const { children } = props
  const savesAndBanks = useSaves()
  const ohpkmStore = useOhpkmStore()
  const { moveMonItemToBag, giveItemToMon } = useItems()
  const { dragState, startDragging, endDragging } = useDragAndDrop()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 0 },
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

  return (
    <DndContext
      onDragEnd={(e) => {
        const target: DragPayload | undefined = e.active.data.current as DragPayload | undefined
        if (!target) return

        const dest = e.over?.data.current
        const payload = dragState.payload

        const dropElementId = e.over?.id

        if (!payload) return

        if (payload.kind === 'item') {
          if (isMonLocation(dest) && target) {
            giveItemToMon(dest, payload.item)
          }
        } else if (payload.kind === 'mon') {
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
        }

        endDragging()
      }}
      onDragStart={(e) => {
        if (e.active.data?.current) {
          startDragging(e.active.data.current as DragPayload)
        }
      }}
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
        ) : dragState.mode === 'item' ? (
          <img
            src={getPublicImageURL(
              getItemIconPath(dragState.payload?.monData.mon.heldItemIndex ?? 0)
            )}
            style={{ width: 32, height: 32 }}
            draggable={false}
          />
        ) : (
          dragState.payload?.kind === 'mon' && (
            <PokemonIcon
              dexNumber={dragState.payload?.monData.mon.dexNum ?? 0}
              formeNumber={formeNumber}
              isShiny={dragState.payload?.monData.mon.isShiny()}
              heldItemIndex={dragState.payload?.monData.mon.heldItemIndex}
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
