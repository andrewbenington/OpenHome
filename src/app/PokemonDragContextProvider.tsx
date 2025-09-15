import { DragDropProvider, DragOverlay, PointerSensor } from '@dnd-kit/react'
import { ReactNode, useContext } from 'react'
import { PersistedPkmDataContext } from 'src/state/persistedPkmData'
import { OHPKM } from 'src/types/pkm/OHPKM'
import PokemonIcon from '../components/PokemonIcon'
import { DragMonContext } from '../state/dragMon'
import { MonLocation, MonWithLocation, OpenSavesContext } from '../state/openSaves'

export default function PokemonDragContextProvider(props: { children?: ReactNode }) {
  const { children } = props
  const [, openSavesDispatch] = useContext(OpenSavesContext)
  const [, persistedPkmDataDispatch] = useContext(PersistedPkmDataContext)
  const [dragMonState, dispatchDragMonState] = useContext(DragMonContext)

  return (
    <DragDropProvider
      // collisionDetection={closestCenter}
      // modifiers={[RestrictToWindow]}
      onDragEnd={(e) => {
        const { operation } = e
        const { target } = operation

        const dest = target?.data as MonLocation
        const payload = dragMonState.payload

        if (payload) {
          if (target?.id === 'to_release') {
            openSavesDispatch({
              type: 'add_mon_to_release',
              payload,
            })
          } else if (
            dest.is_home ||
            dest?.save?.supportsMon(payload.mon.dexNum, payload.mon.formeNum)
          ) {
            const { mon, ...source } = payload

            if (source.save !== dest.save) {
              persistedPkmDataDispatch({ type: 'persist_data', payload: new OHPKM(mon) })
              openSavesDispatch({
                type: 'move_mon',
                payload: { source: payload, dest },
              })
            } else {
              openSavesDispatch({ type: 'move_mon', payload: { source: payload, dest } })
            }
          }
        }

        dispatchDragMonState({ type: 'end_drag' })
      }}
      onDragStart={(e) => {
        const { operation } = e
        const { source } = operation

        if (source?.data) {
          dispatchDragMonState({ type: 'start_drag', payload: source.data as MonWithLocation })
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
        {dragMonState.payload && (
          <PokemonIcon
            dexNumber={dragMonState.payload.mon.dexNum ?? 0}
            formeNumber={dragMonState.payload.mon.formeNum ?? 0}
            isShiny={dragMonState.payload.mon.isShiny()}
            heldItemIndex={dragMonState.payload.mon.heldItemIndex}
            style={{ width: '100%', height: '100%' }}
          />
        )}
      </DragOverlay>
      {children}
    </DragDropProvider>
  )
}
