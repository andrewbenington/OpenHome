import { useDroppable } from '@dnd-kit/react'
import { useContext, useMemo } from 'react'
import { BackendContext } from 'src/backend/backendContext'
import { FilterContext } from 'src/state/filter'
import { MonLocation } from 'src/state/openSaves'
import { bytesToPKM } from 'src/types/FileImport'
import { filterApplies } from 'src/types/Filter'
import { PKMInterface } from 'src/types/interfaces'
import { displayIndexAdder, isBattleFormeItem } from 'src/types/pkm/util'
import { PokedexUpdate } from 'src/types/pokedex'
import useDisplayError from '../../hooks/displayError'
import '../style.css'
import DraggableMon from './DraggableMon'
import DroppableSpace from './DroppableSpace'

interface BoxCellProps {
  onClick: () => void
  onDrop: (_: PKMInterface[]) => void
  disabled?: boolean
  disabledReason?: string
  zIndex: number
  mon: PKMInterface | undefined
  borderColor?: string
  dragID: string
  location: MonLocation
}

const BoxCell = ({
  onClick,
  onDrop,
  disabled,
  disabledReason,
  zIndex,
  mon,
  borderColor,
  dragID,
  location,
}: BoxCellProps) => {
  const [filterState] = useContext(FilterContext)
  const backend = useContext(BackendContext)
  const displayError = useDisplayError()

  const isFilteredOut = useMemo(() => {
    return (
      Object.values(filterState).some((val) => val !== undefined) &&
      (mon === undefined || !filterApplies(filterState, mon))
    )
  }, [filterState, mon])

  const onDropFromFiles = async (files: FileList) => {
    const importedMons: PKMInterface[] = []
    const pokedexUpdates: PokedexUpdate[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const bytes = new Uint8Array(await file.arrayBuffer())
      const [extension] = file.name.split('.').slice(-1)

      try {
        const mon = bytesToPKM(bytes, extension.toUpperCase())

        importedMons.push(mon)
        pokedexUpdates.push({
          dexNumber: mon.dexNum,
          formeNumber: mon.formeNum,
          status: mon.isShiny() ? 'ShinyCaught' : 'Caught',
        })

        if (isBattleFormeItem(mon.dexNum, mon.heldItemIndex)) {
          pokedexUpdates.push({
            dexNumber: mon.dexNum,
            formeNumber: displayIndexAdder(mon.heldItemIndex)(mon.formeNum),
            status: mon.isShiny() ? 'ShinyCaught' : 'Caught',
          })
        }
      } catch (e) {
        displayError('Error Importing Pokémon', `${e}`)
      }

      backend.registerInPokedex(pokedexUpdates)
    }
    onDrop(importedMons)
  }

  const getBackgroundDetails = () => {
    if (disabled) {
      return {
        backgroundBlendMode: 'multiply',
        backgroundColor: '#555',
      }
    }
    return {
      backgroundColor: '#0000',
    }
  }

  const { ref } = useDroppable({
    id: dragID,
    data: location,
    disabled,
  })

  return (
    <div
      ref={ref}
      style={{
        padding: 0,
        width: '100%',
        aspectRatio: 1,
        borderRadius: 3,
        borderWidth: 1,
        backgroundColor: disabled || isFilteredOut ? '#555' : '#6662',
        borderColor: borderColor,
        zIndex,
      }}
      onDrop={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onDropFromFiles(e.dataTransfer.files)
      }}
      title={disabledReason}
    >
      {mon ? (
        <DraggableMon
          onClick={onClick}
          mon={mon}
          style={{
            width: '100%',
            height: '100%',
            ...getBackgroundDetails(),
          }}
          dragData={location ? { ...location, mon } : undefined}
          dragID={dragID}
          disabled={disabled || isFilteredOut}
        />
      ) : (
        <DroppableSpace dropID={dragID} dropData={location} disabled={disabled} />
      )}
    </div>
  )
}

export default BoxCell
