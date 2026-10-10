import { PointerActivationConstraints, PointerSensor } from '@dnd-kit/dom'
import { DragDropProvider, DragOverlay, useDragDropMonitor, useDragOperation } from '@dnd-kit/react'
import { displayIndexAdder, isBattleFormItem, isMegaStone } from '@openhome-core/pkm/util'
import { monSupportedBySave } from '@openhome-core/save/util'
import { FullMetadataLookup } from '@openhome-core/util'
import { Option, R } from '@openhome-core/util/functional'
import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import useDisplayError from '@openhome-ui/hooks/displayError'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { getItemIconPath } from '@openhome-ui/images/items'
import { useDragStore } from '@openhome-ui/state-zustand/drag-and-drop/dragStore'
import { isMonLocation, MonLocation, useSaves } from '@openhome-ui/state/saves'
import { Badge } from '@radix-ui/themes'
import { ReactNode } from 'react'
import { DragPayload, locationKey } from '.'
import { OPENHOME_BOX_SLOTS, useBanksAndBoxes } from '../../state-zustand/banks-and-boxes/store'
import useMultiSelect, { MultiSelectState } from './useMultiSelect'

export default function PokemonDndContext(props: { children?: ReactNode }) {
  const { children } = props
  const savesAndBanks = useSaves()
  const { homeLocationIsEmpty, getCurrentBank } = useBanksAndBoxes()
  const { multiSelectState, clearSelections } = useMultiSelect()
  const displayError = useDisplayError()

  return (
    <DragDropProvider<DragPayload>
      onDragEnd={async (e) => {
        const dest = e.operation.target?.data
        let payload: Option<DragPayload> = e.operation.source?.data

        const dropElementId = e.operation.target?.id

        if (!payload) return

        if (payload.kind === 'item') {
          if (isMonLocation(dest)) {
            savesAndBanks.giveItemToMon(dest, payload.item)
          }
          return
        }

        const allMonsWithLocations = payload.kind === 'mon' ? [payload.monData] : payload.monData
        if (allMonsWithLocations.length === 0) return
        const firstMonWithLocation = allMonsWithLocations[0]

        const selectedLocationKeys = new Set(multiSelectState.selectedLocations.map(locationKey))
        const sourceLocationKey = locationKey(firstMonWithLocation)
        const isSourceSelected = selectedLocationKeys.has(sourceLocationKey)
        const selectedLocations = isSourceSelected
          ? [
              firstMonWithLocation,
              ...multiSelectState.selectedLocations.filter(
                (l) => locationKey(l) !== sourceLocationKey
              ),
            ]
          : [firstMonWithLocation]

        const { mon } = firstMonWithLocation

        if (dropElementId === 'to_release') {
          if (multiSelectState.multiSelectEnabled && isSourceSelected) {
            for (const location of selectedLocations) {
              const mon = await savesAndBanks.getMonAtLocation(location)
              if (mon) savesAndBanks.releaseMonAtLocation(location)
            }
            clearSelections()
          } else {
            savesAndBanks.releaseMonAtLocation(firstMonWithLocation)
          }
        } else if (dropElementId === 'item-bag') {
          if (multiSelectState.multiSelectEnabled && isSourceSelected) {
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
          if (multiSelectState.multiSelectEnabled && isSourceSelected) {
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
      }}
      sensors={(defaults) => [
        ...defaults.filter((sensor) => sensor !== PointerSensor),
        PointerSensor.configure({
          activationConstraints: [
            multiSelectState.multiSelectEnabled
              ? new PointerActivationConstraints.Delay({ value: 100, tolerance: 8 })
              : new PointerActivationConstraints.Distance({ value: 10 }),
          ],
        }),
      ]}
    >
      <PokemonDndOverlay multiSelectState={multiSelectState}>{children}</PokemonDndOverlay>
    </DragDropProvider>
  )
}

function PokemonDndOverlay(props: { multiSelectState: MultiSelectState; children: ReactNode }) {
  const { source, target } = useDragOperation<DragPayload>()

  const dragPayload = source?.data
  const draggingOverId = target?.id

  useDragDropMonitor<DragPayload>({
    onDragStart: (e) => useDragStore.setState({ payload: e.operation.source?.data }),
    onDragOver: (e) =>
      useDragStore.setState({
        overId: e.operation.target?.id ? String(e.operation.target.id) : undefined,
      }),
    onDragEnd: () => useDragStore.setState({ payload: undefined, overId: undefined }),
  })

  const draggingMon = dragPayload?.kind === 'mon' ? dragPayload.monData.mon : undefined
  let formeNumber = draggingMon?.formIndex ?? 0

  if (draggingMon && isMegaStone(draggingMon.heldItemIndex)) {
    const megaForStone = FullMetadataLookup(draggingMon)?.megaEvolutions.find(
      (mega) => mega.requiredItemId === draggingMon.heldItemIndex
    )

    if (megaForStone) formeNumber = megaForStone.megaForme.formIndex
  } else if (draggingMon && isBattleFormItem(draggingMon.nationalDex, draggingMon.heldItemIndex)) {
    formeNumber = displayIndexAdder(draggingMon.heldItemIndex)(draggingMon.formIndex)
  }

  const { multiSelectState } = props

  return (
    <>
      <DragOverlay style={{ cursor: 'grabbing' }} dropAnimation={{ duration: 0 }}>
        {dragPayload?.kind === 'item' ? (
          <img
            className="draggable-item"
            src={getPublicImageURL(getItemIconPath(dragPayload.item.index))}
            alt={dragPayload.item.name}
            draggable={false}
          />
        ) : (
          dragPayload?.kind === 'mon' && (
            <div style={{ width: '100%', height: '100%', position: 'absolute' }}>
              <PokemonIcon
                nationalDex={dragPayload.monData.mon.nationalDex ?? 0}
                formIndex={formeNumber}
                isShiny={dragPayload.monData.mon.isShiny()}
                heldItemIndex={dragPayload.monData.mon.heldItemIndex}
                onlyItem={
                  draggingOverId === 'item-bag' && Boolean(dragPayload.monData.mon.heldItemIndex)
                }
                extraFormIndex={dragPayload.monData.mon.extraFormIndex}
              />
              {multiSelectState.selectedLocations.length > 1 && (
                <Badge variant="solid" style={{ position: 'absolute', top: 0, left: 0 }}>
                  {multiSelectState.selectedLocations.length}
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
