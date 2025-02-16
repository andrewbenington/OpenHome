import { closestCenter, DragOverlay, PointerSensor, useSensor } from '@dnd-kit/core'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import { ReactNode, useContext, useState } from 'react'
import { createPortal } from 'react-dom'
import PokemonIcon from '../components/PokemonIcon'
import { MonWithLocation, OpenSavesContext } from '../state/openSaves'
import { PKMInterface } from '../types/interfaces'
import { PokemonDragContext } from './PokemonDrag'

export default function PokemonDragContextProvider(props: { children?: ReactNode }) {
  const { children } = props
  const [, openSavesDispatch] = useContext(OpenSavesContext)
  const [dragData, setDragData] = useState<MonWithLocation>()
  const [dragMon, setDragMon] = useState<PKMInterface>()

  return (
    <PokemonDragContext
      collisionDetection={closestCenter}
      modifiers={[restrictToWindowEdges]}
      onDragEnd={(e) => {
        const dest = e.over?.data.current

        if (dragData) {
          if (e.over?.id === 'to_release') {
            openSavesDispatch({
              type: 'add_mon_to_release',
              payload: dragData,
            })
          } else if (dragMon && dest?.save.supportsMon(dragMon.dexNum, dragMon.formeNum)) {
            openSavesDispatch({ type: 'move_mon', payload: { source: dragData, dest } })
          }
        }

        setDragData(e.over?.data.current as MonWithLocation)
        let d = e.over?.data.current

        setDragMon(d?.save.boxes[d.box].pokemon[d.boxPos])
      }}
      onDragStart={(e) => {
        setDragData(e.active.data.current)
        setDragMon(e.active.data.current?.mon)
      }}
      sensors={[
        useSensor(PointerSensor, {
          activationConstraint: {
            distance: 0, // Set a small distance threshold
          },
        }),
      ]}
    >
      {createPortal(
        <DragOverlay dropAnimation={{ duration: 300 }} style={{ cursor: 'grabbing' }}>
          {dragData && (
            <PokemonIcon
              dexNumber={dragMon?.dexNum ?? 0}
              formeNumber={
                dragData.save.boxes[dragData.box].pokemon[dragData.boxPos]?.formeNum ?? 0
              }
              isShiny={dragData.save.boxes[dragData.box].pokemon[dragData.boxPos]?.isShiny()}
              heldItemIndex={
                dragData.save.boxes[dragData.box].pokemon[dragData.boxPos]?.heldItemIndex
              }
              style={{ width: '100%', height: '100%' }}
            />
          )}
        </DragOverlay>,
        document.body
      )}
      {children}
    </PokemonDragContext>
  )
}
