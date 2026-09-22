import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  PointerSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { displayIndexAdder, isBattleFormeItem, isMegaStone } from '@openhome-core/pkm/util'
import { monSupportedBySave } from '@openhome-core/save/util'
import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import useDisplayError from '@openhome-ui/hooks/displayError'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { getItemIconPath } from '@openhome-ui/images/items'
import { isMonLocation, MonLocation, useSaves } from '@openhome-ui/state/saves'
import { MetadataSummaryLookup } from '@pkm-rs/pkg'
import { Badge } from '@radix-ui/themes'
import { ReactNode, useCallback, useState } from 'react'
import { locationKey } from '.'
import { OPENHOME_BOX_SLOTS, useBanksAndBoxes } from '../../state-zustand/banks-and-boxes/store'
import useDragAndDrop from './useDragAndDrop'

function usePokemonDragAndDrop() {
  const { dragState, startDragging, endDragging: stopDragging, clearSelections } = useDragAndDrop()
  const savesAndBanks = useSaves()
  const { homeLocationIsEmpty, getCurrentBank } = useBanksAndBoxes()
  const [dragOverId, setDragOverId] = useState<UniqueIdentifier | null>(null)
  const displayError = useDisplayError()

  async function onDragEnd(controller: DragController, e: DragEndEvent) {
    const {
      currentlyDragging,
      stopDragging: endDragging,
      clearSelections,
      setDragOverId,
    } = controller
    setDragOverId(null)

    const dest = e.over?.data.current

    const dropElementId = e.over?.id

    if (!currentlyDragging) return

    if (currentlyDragging.kind === 'item') {
      if (isMonLocation(dest)) {
        await savesAndBanks.giveItemToMon(dest, currentlyDragging.item)
      }
      endDragging()
      return
    }

    const allMonsWithLocations =
      currentlyDragging.kind === 'mon' ? [currentlyDragging.monData] : currentlyDragging.monData
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
        for (const location of selectedLocations) {
          const mon = await savesAndBanks.getMonAtLocation(location)
          if (mon) savesAndBanks.releaseMonAtLocation(location)
        }
        clearSelections()
      } else {
        savesAndBanks.releaseMonAtLocation(firstMonWithLocation)
      }
    } else if (dropElementId === 'item-bag') {
      if (dragState.multiSelectEnabled && isSourceSelected) {
        for (const location of selectedLocations) {
          const mon = await savesAndBanks.getMonAtLocation(location)
          if (mon) await savesAndBanks.moveMonItemToBag(location)
        }
        clearSelections()
      } else {
        await savesAndBanks.moveMonItemToBag(firstMonWithLocation)
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

        const nextSaveDestination = (startBox: number, startSlot: number): MonLocation | null => {
          if (!targetSave) return null

          for (let box = startBox; box < targetSave.getBoxCount(); box++) {
            const slotStart = box === startBox ? startSlot : 0

            for (let boxSlot = slotStart; boxSlot < targetSave.boxSlotCount; boxSlot++) {
              if (!targetSave.getMonAt(box, boxSlot)) {
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

        const nextHomeDestination = (startBox: number, startSlot: number): MonLocation | null => {
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

          const currMon = await savesAndBanks.getMonAtLocation(sourceLoc)
          if (!currMon) continue

          if (
            !dest.isHome &&
            targetSave &&
            !targetSave.supportsMon(currMon.nationalDex, currMon.formIndex)
          ) {
            continue
          }

          if (
            currMon.heldItemIndex &&
            !dest.isHome &&
            targetSave &&
            !targetSave.supportsItem(currMon.heldItemIndex)
          ) {
            await savesAndBanks.moveMonItemToBag(sourceLoc)
          }

          await savesAndBanks
            .moveMon({ ...sourceLoc, mon: currMon }, nextDestination)
            .catch((error) => displayError('Error moving Pokémon', error))

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
          await savesAndBanks.moveMonItemToBag(source)
        }

        savesAndBanks
          .moveMon(source, dest)
          .catch((error) => displayError('Could not move Pokémon', error))
      }
    }

    endDragging()
  }

  return {
    currentlyDragging: dragState.payload,
    multiSelectEnabled: dragState.multiSelectEnabled,
    draggingCount: dragState.selectedLocations.length,
    startDragging,
    stopDragging,
    onDragEnd,
    clearSelections,
    dragOverId,
    setDragOverId,
  }
}

export default function PokemonDndContext(props: { children?: ReactNode }) {
  const { children } = props

  const dragController = usePokemonDragAndDrop()
  const {
    currentlyDragging,
    multiSelectEnabled,
    draggingCount,
    stopDragging: endDragging,
    onDragEnd,
  } = dragController
  const [dragOverId, setDragOverId] = useState<UniqueIdentifier | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: multiSelectEnabled ? { delay: 100, tolerance: 8 } : { distance: 10 },
    })
  )

  const draggingMon = currentlyDragging?.kind === 'mon' ? currentlyDragging.monData.mon : undefined
  let formeNumber = draggingMon?.formIndex ?? 0

  if (draggingMon && isMegaStone(draggingMon.heldItemIndex)) {
    const megaForStone = MetadataSummaryLookup(
      draggingMon.nationalDex,
      draggingMon.formIndex
    )?.megaEvolutions.find((mega) => mega.requiredItemId === draggingMon.heldItemIndex)

    if (megaForStone) formeNumber = megaForStone.megaForme.formIndex
  } else if (draggingMon && isBattleFormeItem(draggingMon.nationalDex, draggingMon.heldItemIndex)) {
    formeNumber = displayIndexAdder(draggingMon.heldItemIndex)(draggingMon.formIndex)
  }

  const onDragOver = useCallback(
    (e: DragOverEvent) => {
      setDragOverId(e.over?.id ?? null)
    },
    [setDragOverId]
  )

  return (
    <DndContext
      onDragEnd={(e) => void onDragEnd(dragController, e)}
      onDragOver={onDragOver}
      onDragCancel={endDragging}
      sensors={sensors}
    >
      <DragOverlay style={{ cursor: 'grabbing' }} dropAnimation={{ duration: 0 }}>
        {currentlyDragging?.kind === 'item' ? (
          <img
            className="draggable-item"
            src={getPublicImageURL(getItemIconPath(currentlyDragging.item.index))}
            alt={currentlyDragging.item.name}
            draggable={false}
          />
        ) : (
          currentlyDragging?.kind === 'mon' && (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              <PokemonIcon
                nationalDex={currentlyDragging?.monData.mon.nationalDex ?? 0}
                formIndex={formeNumber}
                isShiny={currentlyDragging?.monData.mon.isShiny()}
                heldItemIndex={currentlyDragging?.monData.mon.heldItemIndex}
                onlyItem={
                  dragOverId === 'item-bag' && Boolean(currentlyDragging?.monData.mon.heldItemIndex)
                }
                extraFormIndex={currentlyDragging?.monData.mon.extraFormIndex}
                style={{ width: '100%', height: '100%' }}
              />
              {draggingCount > 1 && (
                <Badge variant="solid" style={{ position: 'absolute', top: 0, left: 0 }}>
                  {draggingCount}
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

type DragController = ReturnType<typeof usePokemonDragAndDrop>
