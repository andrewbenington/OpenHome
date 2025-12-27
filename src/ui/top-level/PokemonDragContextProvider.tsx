import { DragDropProvider, DragOverlay, PointerSensor } from '@dnd-kit/react'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { getItemIconPath } from '@openhome-ui/images/items'
import { useItems } from '@openhome-ui/state/items'
import { useOhpkmStore } from '@openhome-ui/state/ohpkm'
import { MonLocation, useSaves } from '@openhome-ui/state/saves'
import { ReactNode } from 'react'
import { DragPayload } from '../state/drag-and-drop'
import useDragAndDrop from '../state/drag-and-drop/useDragAndDrop'

const pointerSensor = PointerSensor.configure({
  activationConstraints: {
    // Start dragging after moving 5px
    distance: { value: 5 },
    // Or after holding for 200ms
    delay: { value: 200, tolerance: 10 },
  },
})

export default function PokemonDragContextProvider(props: { children?: ReactNode }) {
  const { children } = props
  const savesAndBanks = useSaves()
  const ohpkmStore = useOhpkmStore()
  const { moveMonItemToBag, giveItemToMon } = useItems()
  const { dragState, startDragging, endDragging } = useDragAndDrop()

  return (
    <DragDropProvider
      onDragEnd={(e) => {
        const target = e.operation.target

        const dest = target?.data
        const payload = dragState.payload

        if (!payload) return

        if (payload.kind === 'item') {
          if (isMonLocation(dest) && target) {
            giveItemToMon(dest, payload.item)
          }
        } else if (payload.kind === 'mon') {
          const { mon } = payload.monData

          if (target?.id === 'to_release') {
            savesAndBanks.releaseMonAtLocation(payload.monData)
          } else if (target?.id === 'item-bag') {
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
        if (e.operation.source?.data) {
          startDragging(e.operation.source.data as DragPayload)
        }
      }}
      sensors={[pointerSensor]}
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
              formeNumber={dragState.payload?.monData.mon.formeNum ?? 0}
              isShiny={dragState.payload?.monData.mon.isShiny()}
              heldItemIndex={dragState.payload?.monData.mon.heldItemIndex}
              style={{ width: '100%', height: '100%' }}
            />
          )
        )}
      </DragOverlay>
      {children}
    </DragDropProvider>
  )
}

function isMonLocation(obj: object | undefined): obj is MonLocation {
  return obj !== undefined && 'box' in obj && 'box_slot' in obj
}
