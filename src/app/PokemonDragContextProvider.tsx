import { DragDropProvider, DragOverlay, PointerSensor } from '@dnd-kit/react'
import { ReactNode, useContext } from 'react'
import PokemonIcon from '../components/PokemonIcon'
import { DragMonContext } from '../state/dragMon'
import { MonLocation, MonWithLocation, OpenSavesContext } from '../state/openSaves'

export default function PokemonDragContextProvider(props: { children?: ReactNode }) {
  const { children } = props
  const [, openSavesDispatch] = useContext(OpenSavesContext)
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
          } else if (dest?.save?.supportsMon(payload.mon.dexNum, payload.mon.formeNum)) {
            openSavesDispatch({ type: 'move_mon', payload: { source: payload, dest } })
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
            formeNumber={
              dragMonState.payload.save.boxes[dragMonState.payload.box].pokemon[
                dragMonState.payload.boxPos
              ]?.formeNum ?? 0
            }
            isShiny={dragMonState.payload.save.boxes[dragMonState.payload.box].pokemon[
              dragMonState.payload.boxPos
            ]?.isShiny()}
            heldItemIndex={
              dragMonState.payload.save.boxes[dragMonState.payload.box].pokemon[
                dragMonState.payload.boxPos
              ]?.heldItemIndex
            }
            style={{ width: '100%', height: '100%' }}
          />
        )}
      </DragOverlay>
      {children}
    </DragDropProvider>
  )
}
