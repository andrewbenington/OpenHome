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
import { isMonLocation, MonLocation, useSaves } from '@openhome-ui/state/saves'
import { MetadataLookup } from '@pkm-rs/pkg'
import { Badge } from '@radix-ui/themes'
import { ReactNode, useCallback, useState } from 'react'
import { displayIndexAdder, isBattleFormeItem, isMegaStone } from 'src/core/pkm/util'
import PokemonIcon from 'src/ui/components/PokemonIcon'
import { DragPayload, locationKey } from '.'
import { OPENHOME_BOX_SLOTS, useBanksAndBoxes } from '../../state-zustand/banks-and-boxes/store'
import useDragAndDrop from './useDragAndDrop'

function isDragPayload(value: unknown): value is DragPayload {
  if (!value || typeof value !== 'object') return false

  if (!('kind' in value)) return false

  if (value.kind === 'item') {
    return 'item' in value
  }

  if (value.kind === 'mon') {
    return 'monData' in value
  }

  return false
}

export default function PokemonDndContext(props: { children?: ReactNode }) {
  const { children } = props
  const savesAndBanks = useSaves()
  const { homeLocationIsEmpty, getCurrentBank } = useBanksAndBoxes()
  const { dragState, startDragging, endDragging, clearSelections } = useDragAndDrop()
  const [dragOverId, setDragOverId] = useState<UniqueIdentifier | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: dragState.multiSelectEnabled
        ? { delay: 100, tolerance: 8 }
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

        const dest = e.over?.data.current
        let payload = dragState.payload

        const dropElementId = e.over?.id

        if (!payload) return

        if (payload.kind === 'item') {
          if (isMonLocation(dest)) {
            savesAndBanks.giveItemToMon(dest, payload.item)
          }
          endDragging()
          return
        }

        const allMonsWithLocations = payload.kind === 'mon' ? [payload.monData] : payload.monData
        if (allMonsWithLocations.length === 0) return
        const firstMonWithLocation = allMonsWithLocations[0]

        const selectedLocationKeys = new Set(dragState.selectedLocations.map(locationKey))
        const sourceLocationKey = locationKey(firstMonWithLocation)
        const isSourceSelected = selectedLocationKeys.has(sourceLocationKey)
        const selectedLocations = isSourceSelected
          ? [
              firstMonWithLocation,
              ...dragState.selectedLocations.filter((l) => locationKey(l) !== sourceLocationKey),
            ]
          : [firstMonWithLocation]

        const { mon } = firstMonWithLocation

        if (dropElementId === 'to_release') {
          if (dragState.multiSelectEnabled && isSourceSelected) {
            selectedLocations.forEach((loc) => {
              const m = savesAndBanks.getMonAtLocation(loc)
              if (m) savesAndBanks.releaseMonAtLocation(loc)
            })
            clearSelections()
          } else {
            savesAndBanks.releaseMonAtLocation(firstMonWithLocation)
          }
        } else if (dropElementId === 'item-bag') {
          if (dragState.multiSelectEnabled && isSourceSelected) {
            selectedLocations.forEach((loc) => {
              const m = savesAndBanks.getMonAtLocation(loc)
              if (m) savesAndBanks.moveMonItemToBag(loc)
            })
            clearSelections()
          } else {
            savesAndBanks.moveMonItemToBag(firstMonWithLocation)
          }
        } else if (
          isMonLocation(dest) &&
          (dest.isHome ||
            monSupportedBySave(savesAndBanks.saveFromIdentifier(dest.saveIdentifier), mon))
        ) {
          if (dragState.multiSelectEnabled && isSourceSelected) {
            const targetSave = dest.isHome
              ? undefined
              : savesAndBanks.saveFromIdentifier(dest.saveIdentifier)

            const nextSaveDestination = (
              startBox: number,
              startSlot: number
            ): MonLocation | null => {
              if (!targetSave) return null

              for (let box = startBox; box < targetSave.boxes.length; box++) {
                const boxSlots = targetSave.boxes[box]?.boxSlots
                if (!boxSlots) continue
                const slotStart = box === startBox ? startSlot : 0

                for (let boxSlot = slotStart; boxSlot < boxSlots.length; boxSlot++) {
                  if (!boxSlots[boxSlot]) {
                    return {
                      isHome: false,
                      saveIdentifier: targetSave.identifier,
                      box,
                      boxSlot,
                    }
                  }
                }
              }

              return null
            }

            const nextHomeDestination = (
              startBox: number,
              startSlot: number
            ): MonLocation | null => {
              if (!dest.isHome) return null

              const currentBank = getCurrentBank()
              const bank = dest.bank

              for (let box = startBox; box < currentBank.boxes.size; box++) {
                const slotStart = box === startBox ? startSlot : 0

                for (let boxSlot = slotStart; boxSlot < OPENHOME_BOX_SLOTS; boxSlot++) {
                  const location = { bank, box, boxSlot }
                  if (homeLocationIsEmpty(location)) return { isHome: true, ...location }
                }
              }

              return null
            }

            let nextDestination: MonLocation | null = dest.isHome
              ? nextHomeDestination(dest.box, dest.boxSlot)
              : nextSaveDestination(dest.box, dest.boxSlot)

            for (const sourceLoc of selectedLocations) {
              if (!nextDestination) break

              const currMon = savesAndBanks.getMonAtLocation(sourceLoc)
              if (!currMon) continue

              if (
                !dest.isHome &&
                targetSave &&
                !targetSave.supportsMon(currMon.dexNum, currMon.formeNum)
              ) {
                continue
              }

              if (
                currMon.heldItemIndex &&
                !dest.isHome &&
                targetSave &&
                !targetSave.supportsItem(currMon.heldItemIndex)
              ) {
                savesAndBanks.moveMonItemToBag(sourceLoc)
              }

              savesAndBanks.moveMon({ ...sourceLoc, mon: currMon }, nextDestination)

              nextDestination = nextDestination.isHome
                ? nextHomeDestination(nextDestination.box, nextDestination.boxSlot + 1)
                : nextSaveDestination(nextDestination.box, nextDestination.boxSlot + 1)
            }
            clearSelections()
          } else {
            const source = firstMonWithLocation

            if (
              mon.heldItemIndex &&
              !dest.isHome &&
              !savesAndBanks.saveFromIdentifier(dest.saveIdentifier).supportsItem(mon.heldItemIndex)
            ) {
              savesAndBanks.moveMonItemToBag(source)
            }

            savesAndBanks.moveMon(source, dest)
          }
        }

        endDragging()
      }}
      onDragStart={(e) => {
        const payload = e.active.data?.current
        if (!isDragPayload(payload)) return
        startDragging(payload)
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
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              <PokemonIcon
                dexNumber={dragState.payload?.monData.mon.dexNum ?? 0}
                formeNumber={formeNumber}
                isShiny={dragState.payload?.monData.mon.isShiny()}
                heldItemIndex={dragState.payload?.monData.mon.heldItemIndex}
                onlyItem={
                  dragOverId === 'item-bag' && Boolean(dragState.payload?.monData.mon.heldItemIndex)
                }
                extraFormIndex={dragState.payload?.monData.mon.extraFormIndex}
                style={{ width: '100%', height: '100%' }}
              />
              {dragState.selectedLocations.length > 1 && (
                <Badge variant="solid" style={{ position: 'absolute', top: 0, left: 0 }}>
                  {dragState.selectedLocations.length}
                </Badge>
              )}
            </div>
          )
        )}
      </DragOverlay>
      {children}
    </DndContext>
  )
}
