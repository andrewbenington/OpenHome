import { useDroppable } from '@dnd-kit/core'
import { useContext, useMemo } from 'react'
import { FilterContext } from 'src/state/filter'
import { MonLocation } from 'src/state/openSaves'
import { bytesToPKM } from 'src/types/FileImport'
import { filterApplies } from 'src/types/Filter'
import { PKMInterface } from 'src/types/interfaces'
import '../style.css'
import DraggableMon from './DraggableMon'
import DroppableSpace from './DroppableSpace'

interface BoxCellProps {
  onClick: () => void
  onDrop: (_: PKMInterface[]) => void
  disabled?: boolean
  zIndex: number
  mon: PKMInterface | undefined
  borderColor?: string
  dragID?: string
  dragData?: MonLocation
}

const BoxCell = ({
  onClick,
  onDrop,
  disabled,
  zIndex,
  mon,
  borderColor,
  dragID,
  dragData,
}: BoxCellProps) => {
  const [filterState] = useContext(FilterContext)

  const isFilteredOut = useMemo(() => {
    return (
      Object.values(filterState).some((val) => val !== undefined) &&
      (mon === undefined || !filterApplies(filterState, mon))
    )
  }, [filterState, mon])

  const onDropFromFiles = async (files: FileList) => {
    const importedMons: PKMInterface[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const bytes = new Uint8Array(await file.arrayBuffer())
      const [extension] = file.name.split('.').slice(-1)

      try {
        importedMons.push(bytesToPKM(bytes, extension.toUpperCase()))
      } catch (e) {
        console.error(e)
      }
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

  const { setNodeRef } = useDroppable({
    id: dragID ?? '',
    data: dragData,
    disabled,
  })

  return (
    <div
      ref={setNodeRef}
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
          dragData={dragData ? { ...dragData, mon } : undefined}
          dragID={dragID}
          disabled={disabled || mon.isLocked || isFilteredOut}
        />
      ) : (
        <DroppableSpace dropID={dragID} dropData={dragData} disabled={disabled} />
      )}
    </div>
  )
}

export default BoxCell
