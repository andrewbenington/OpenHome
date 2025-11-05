import { DragDropProvider, DragOverlay, PointerSensor } from '@dnd-kit/react'
import { ReactNode, useContext } from 'react'
import { ItemBagContext } from 'src/state/itemBag'
import { PersistedPkmDataContext } from 'src/state/persistedPkmData'
import { OHPKM } from 'src/types/pkm/OHPKM'
import PokemonIcon from '../components/PokemonIcon'
import { getPublicImageURL } from '../images/images'
import { getItemIconPath } from '../images/items'
import { DragMonContext, DragPayload } from '../state/dragMon'
import { getMonAtLocation, MonLocation, OpenSavesContext } from '../state/openSaves'

export default function PokemonDragContextProvider(props: { children?: ReactNode }) {
  const { children } = props
  const [openSaves, openSavesDispatch] = useContext(OpenSavesContext)
  const [, persistedPkmDataDispatch] = useContext(PersistedPkmDataContext)
  const [dragMonState, dispatchDragMonState] = useContext(DragMonContext)
  const [, bagDispatch] = useContext(ItemBagContext)

  return (
    <DragDropProvider
      onDragEnd={(e) => {
        const { operation } = e
        const { target } = operation

        const dest = target?.data
        const payload = dragMonState.payload

        if (!payload) return

        if (payload.kind === 'item') {
          if (isMonLocation(dest) && target) {
            // Avoid losing the second item if mon already holding same item
            const destMon = getMonAtLocation(openSaves, dest)
            if (destMon?.heldItemIndex === payload.item.index) {
              return
            }

            openSavesDispatch({
              type: 'set_mon_item',
              payload: {
                item: payload.item,
                dest: target.data as MonLocation,
              },
            })
            bagDispatch({ type: 'remove_item', payload: { index: payload.item.index, qty: 1 } })
          }
        } else if (payload.kind === 'mon') {
          const { mon } = payload.monData

          if (target?.id === 'to_release') {
            openSavesDispatch({
              type: 'add_mon_to_release',
              payload: payload.monData,
            })
          } else if (target?.id === 'item-bag') {
            if (mon.heldItemIndex) {
              bagDispatch({ type: 'add_item', payload: { index: mon.heldItemIndex, qty: 1 } })
              openSavesDispatch({
                type: 'set_mon_item',
                payload: { item: undefined, dest: payload.monData },
              })
              mon.heldItemIndex = 0
            }
          } else if (
            isMonLocation(dest) &&
            (dest.is_home || dest.save.supportsMon(mon.dexNum, mon.formeNum))
          ) {
            const source = payload.monData

            // If moving mon outside of its save, start persisting this mon's data in OpenHome
            // (if it isnt already)
            if (source.save !== dest.save) {
              persistedPkmDataDispatch({ type: 'persist_data', payload: new OHPKM(mon) })
            }

            // Move item to OpenHome bag if not supported by the save file
            if (mon.heldItemIndex && !dest.is_home && !dest.save?.supportsItem(mon.heldItemIndex)) {
              bagDispatch({ type: 'add_item', payload: { index: mon.heldItemIndex, qty: 1 } })
              mon.heldItemIndex = 0
            }

            openSavesDispatch({ type: 'move_mon', payload: { source, dest } })
          }
        }

        dispatchDragMonState({ type: 'end_drag' })
      }}
      onDragStart={(e) => {
        const { source } = e.operation

        if (!source?.data) return
        const data = source.data as DragPayload

        if (data.kind === 'item') {
          dispatchDragMonState({ type: 'start_drag', payload: data })
        } else if (data.kind === 'mon') {
          dispatchDragMonState({ type: 'start_drag', payload: data })
        }
      }}
      sensors={[
        PointerSensor.configure({
          activationConstraints: {
            // Start dragging after moving 5px
            distance: { value: 5 },
            // Or after holding for 200ms
            delay: { value: 200, tolerance: 10 },
          },
        }),
      ]}
    >
      <DragOverlay style={{ cursor: 'grabbing' }}>
        {dragMonState.payload?.kind === 'item' ? (
          <img
            src={getPublicImageURL(getItemIconPath(dragMonState.payload.item.index))}
            alt={dragMonState.payload.item.name}
            style={{ width: 32, height: 32 }}
            draggable={false}
          />
        ) : dragMonState.mode === 'item' ? (
          <img
            src={getPublicImageURL(
              getItemIconPath(dragMonState.payload?.monData.mon.heldItemIndex ?? 0)
            )}
            style={{ width: 32, height: 32 }}
            draggable={false}
          />
        ) : (
          dragMonState.payload?.kind === 'mon' && (
            <PokemonIcon
              dexNumber={dragMonState.payload?.monData.mon.dexNum ?? 0}
              formeNumber={dragMonState.payload?.monData.mon.formeNum ?? 0}
              isShiny={dragMonState.payload?.monData.mon.isShiny()}
              heldItemIndex={dragMonState.payload?.monData.mon.heldItemIndex}
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
  return obj !== undefined && 'box' in obj && 'boxSlot' in obj
}
