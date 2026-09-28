import { PointerActivationConstraints, PointerSensor } from '@dnd-kit/dom'
import { DragDropProvider, DragOverlay, useDragOperation } from '@dnd-kit/react'
import { displayIndexAdder, isBattleFormeItem, isMegaStone } from '@openhome-core/pkm/util'
import { monSupportedBySave } from '@openhome-core/save/util'
import { Option, R } from '@openhome-core/util/functional'
import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import useDisplayError from '@openhome-ui/hooks/displayError'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { getItemIconPath } from '@openhome-ui/images/items'
import { isMonLocation, MonLocation, useSaves } from '@openhome-ui/state/saves'
import { MetadataSummaryLookup } from '@pkm-rs/pkg'
import { Badge } from '@radix-ui/themes'
import { ReactNode } from 'react'
import { DragMonState, DragPayload, locationKey } from '.'
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
  const displayError = useDisplayError()

  // const sensors = useSensors(
  //   useSensor(PointerSensor, {
  //     activationConstraint: dragState.multiSelectEnabled
  //       ? { delay: 100, tolerance: 8 }
  //       : { distance: 10 },
  //   })
  // )

  return (
    <DragDropProvider<DragPayload>
      onDragEnd={async (e) => {
        console.log(e.operation.source?.data, e.operation.target?.id, e.operation.target?.data)

        const dest = e.operation.target?.data
        let payload: Option<DragPayload> = e.operation.source?.data

        const dropElementId = e.operation.target?.id

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
              if (mon) savesAndBanks.moveMonItemToBag(location)
            }
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
                savesAndBanks.moveMonItemToBag(sourceLoc)
              }

              await savesAndBanks
                .moveMon({ ...sourceLoc, mon: currMon }, nextDestination)
                .then(R.mapErr((error) => displayError('Could not move Pokémon', error)))

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

            await savesAndBanks
              .moveMon(source, dest)
              .then(R.mapErr((error) => displayError('Could not move Pokémon', error)))
          }
        }

        endDragging()
      }}
      onDragStart={(e) => {
        const payload = e.operation.source?.data
        if (!isDragPayload(payload)) return
        startDragging(payload)
      }}

      // onDragCancel={endDragging}
      sensors={(defaults) => [
        ...defaults.filter((sensor) => sensor !== PointerSensor),
        PointerSensor.configure({
          activationConstraints: [
            dragState.multiSelectEnabled
              ? new PointerActivationConstraints.Delay({ value: 100, tolerance: 8 })
              : new PointerActivationConstraints.Distance({ value: 10 }),
          ],
        }),
      ]}
    >
      <PokemonDndOverlay dragState={dragState}>{children}</PokemonDndOverlay>
    </DragDropProvider>
  )
}

function PokemonDndOverlay(props: { dragState: DragMonState; children: ReactNode }) {
  const { source, target } = useDragOperation<DragPayload>()

  const draggingMon = source?.data?.kind === 'mon' ? source?.data.monData.mon : undefined
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

  const { dragState } = props

  return (
    <>
      <DragOverlay style={{ cursor: 'grabbing' }} dropAnimation={{ duration: 0 }}>
        {source?.data?.kind === 'item' ? (
          <img
            className="draggable-item"
            src={getPublicImageURL(getItemIconPath(source.data.item.index))}
            alt={source.data.item.name}
            draggable={false}
          />
        ) : (
          source?.data.kind === 'mon' && (
            <div style={{ width: '100%', height: '100%', position: 'absolute' }}>
              <PokemonIcon
                nationalDex={source.data.monData.mon.nationalDex ?? 0}
                formIndex={formeNumber}
                isShiny={source.data.monData.mon.isShiny()}
                heldItemIndex={source.data.monData.mon.heldItemIndex}
                onlyItem={
                  target?.id === 'item-bag' && Boolean(source.data.monData.mon.heldItemIndex)
                }
                extraFormIndex={source.data.monData.mon.extraFormIndex}
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
      {props.children}
    </>
  )
}
