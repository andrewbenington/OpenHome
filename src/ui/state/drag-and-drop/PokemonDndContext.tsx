import {
  DndContext,
  DragOverEvent,
  DragOverlay,
  PointerSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { monSupportedBySave } from '@openhome-core/save/util'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { getItemIconPath } from '@openhome-ui/images/items'
import { useItems } from '@openhome-ui/state/items'
import { isMonLocation, MonLocation, useSaves } from '@openhome-ui/state/saves'
import { MetadataLookup } from '@pkm-rs/pkg'
import { ReactNode, useCallback, useState } from 'react'
import { displayIndexAdder, isBattleFormeItem, isMegaStone } from 'src/core/pkm/util'
import { OpenHomeBanks } from 'src/core/save/HomeData'
import PokemonIcon from 'src/ui/components/PokemonIcon'
import { DragPayload, locationsEqual } from '.'
import useDragAndDrop from './useDragAndDrop'

export default function PokemonDndContext(props: { children?: ReactNode }) {
  const { children } = props
  const savesAndBanks = useSaves()
  const { moveMonItemToBag, giveItemToMon } = useItems()
  const { dragState, startDragging, endDragging, clearSelections } = useDragAndDrop()
  const [dragOverId, setDragOverId] = useState<UniqueIdentifier | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: dragState.multiSelectEnabled
        ? { delay: 250, tolerance: 8 }
        : { distance: 10 },
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
          if (
            dragState.multiSelectEnabled &&
            dragState.selectedLocations.some((l) => locationsEqual(l, payload.monData))
          ) {
            dragState.selectedLocations.forEach((loc) => {
              const m = savesAndBanks.getMonAtLocation(loc)
              if (m) savesAndBanks.releaseMonAtLocation(loc)
            })
            clearSelections()
          } else {
            savesAndBanks.releaseMonAtLocation(payload.monData)
          }
        } else if (dropElementId === 'item-bag') {
          if (
            dragState.multiSelectEnabled &&
            dragState.selectedLocations.some((l) => locationsEqual(l, payload.monData))
          ) {
            dragState.selectedLocations.forEach((loc) => {
              const m = savesAndBanks.getMonAtLocation(loc)
              if (m) moveMonItemToBag(loc)
            })
            clearSelections()
          } else {
            moveMonItemToBag(payload.monData)
          }
        } else if (
          isMonLocation(dest) &&
          (dest.isHome ||
            monSupportedBySave(savesAndBanks.saveFromIdentifier(dest.saveIdentifier), mon))
        ) {
          if (
            dragState.multiSelectEnabled &&
            dragState.selectedLocations.some((l) => locationsEqual(l, payload.monData))
          ) {
            const locationsToMove = [
              payload.monData,
              ...dragState.selectedLocations.filter((l) => !locationsEqual(l, payload.monData)),
            ]
            let currentDestSlot = dest.boxSlot
            let currentDestBox = dest.box

            const maxSlots = dest.isHome ? OpenHomeBanks.BOX_ROWS * OpenHomeBanks.BOX_COLUMNS : 30

            for (const sourceLoc of locationsToMove) {
              const currMon = savesAndBanks.getMonAtLocation(sourceLoc)
              if (!currMon) continue

              if (
                !dest.isHome &&
                !savesAndBanks
                  .saveFromIdentifier(dest.saveIdentifier)
                  .supportsMon(currMon.dexNum, currMon.formeNum)
              ) {
                continue
              }

              if (
                currMon.heldItemIndex &&
                !dest.isHome &&
                !savesAndBanks
                  .saveFromIdentifier(dest.saveIdentifier)
                  .supportsItem(currMon.heldItemIndex)
              ) {
                moveMonItemToBag(sourceLoc)
              }

              const nextDest: MonLocation = {
                ...dest,
                box: currentDestBox,
                boxSlot: currentDestSlot,
              }
              savesAndBanks.moveMon({ ...sourceLoc, mon: currMon }, nextDest)

              currentDestSlot++
              if (currentDestSlot >= maxSlots) {
                currentDestSlot = 0
                currentDestBox++
              }
            }
            clearSelections()
          } else {
            const source = payload.monData

            if (
              mon.heldItemIndex &&
              !dest.isHome &&
              !savesAndBanks.saveFromIdentifier(dest.saveIdentifier).supportsItem(mon.heldItemIndex)
            ) {
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
              pluginForm={dragState.payload?.monData.mon.pluginForm}
              pluginOrigin={dragState.payload?.monData.mon.pluginOrigin}
              style={{ width: '100%', height: '100%' }}
            />
          )
        )}
      </DragOverlay>
      {children}
    </DndContext>
  )
}
