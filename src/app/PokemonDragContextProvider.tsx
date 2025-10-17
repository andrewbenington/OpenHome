import { DragDropProvider, DragOverlay, PointerSensor } from '@dnd-kit/react'
import { ItemFromString } from 'pokemon-resources'
import { ReactNode, useContext } from 'react'
import { BagContext } from 'src/state/bag'
import { PersistedPkmDataContext } from 'src/state/persistedPkmData'
import { OHPKM } from 'src/types/pkm/OHPKM'
import PokemonIcon from '../components/PokemonIcon'
import { DragMonContext, DragPayload } from '../state/dragMon'
import { MonLocation, OpenSavesContext } from '../state/openSaves'

export default function PokemonDragContextProvider(props: { children?: ReactNode }) {
  const { children } = props
  const [, openSavesDispatch] = useContext(OpenSavesContext)
  const [, persistedPkmDataDispatch] = useContext(PersistedPkmDataContext)
  const [dragMonState, dispatchDragMonState] = useContext(DragMonContext)
  const [, bagDispatch] = useContext(BagContext)

  return (
    <DragDropProvider
      // collisionDetection={closestCenter}
      // modifiers={[RestrictToWindow]}
      onDragEnd={(e) => {
        const { operation } = e
        const { target } = operation

        const dest = target?.data as MonLocation
        const payload = dragMonState.payload

        if (!payload) return

        if (payload.kind === 'item') {
          if (dest && target) {
            openSavesDispatch({
              type: 'give_item_to_mon',
              payload: {
                itemName: payload.itemName,
                dest: target.data as MonLocation,
                bagDispatch,
              },
            })
          }
        } else if (payload.kind === 'mon') {
          const { mon } = payload.monData

          if (target?.id === 'to_release') {
            openSavesDispatch({
              type: 'add_mon_to_release',
              payload: payload.monData,
            })
          } else if (target?.id === 'bag-box') {
            if (mon.heldItemIndex) {
              bagDispatch({ type: 'add_item', payload: { name: mon.heldItemName, qty: 1 } })
              mon.heldItemIndex = 0
            }
          } else if (dest && (dest.is_home || dest.save?.supportsMon(mon.dexNum, mon.formeNum))) {
            const source = payload.monData

            if (source.save !== dest.save) {
              persistedPkmDataDispatch({ type: 'persist_data', payload: new OHPKM(mon) })
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
            distance: {
              value: 5,
            },
            // Or after holding for 200ms
            delay: {
              value: 200,
              tolerance: 10,
            },
          },
        }),
      ]}
    >
      <DragOverlay style={{ cursor: 'grabbing' }}>
        {dragMonState.payload &&
          (dragMonState.payload.kind === 'item' ? (
            <img
              src={`/items/index/${ItemFromString(dragMonState.payload.itemName)?.toString().padStart(4, '0')}.png`}
              alt={dragMonState.payload.itemName}
              style={{ width: 32, height: 32 }}
              draggable={false}
            />
          ) : (
            <PokemonIcon
              dexNumber={dragMonState.payload.monData.mon.dexNum ?? 0}
              formeNumber={dragMonState.payload.monData.mon.formeNum ?? 0}
              isShiny={dragMonState.payload.monData.mon.isShiny()}
              heldItemIndex={dragMonState.payload.monData.mon.heldItemIndex}
              style={{ width: '100%', height: '100%' }}
            />
          ))}
      </DragOverlay>
      {children}
    </DragDropProvider>
  )
}
