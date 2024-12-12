import { useDroppable } from '@dnd-kit/core'
import { useCallback, useContext, useMemo } from 'react'
import { FilterContext } from 'src/state/filter'
import { MonLocation } from 'src/state/openSaves'
import { filterApplies } from 'src/types/Filter'
import { PKMInterface } from 'src/types/interfaces'
import { Styles } from 'src/types/types'
import BoxIcons from '../../images/BoxIcons.png'
import '../style.css'
import DraggableMon from './DraggableMon'
import DroppableSpace from './DroppableSpace'

const styles = {
  fillContainer: { width: '100%', height: '100%' },
  button: {
    padding: 0,
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
    borderRadius: 3,
    textAlign: 'center',
    borderWidth: 1,
  },
  background: {
    background: `url(${BoxIcons}) no-repeat 0.02777% 0.02777%`,
    backgroundSize: '3600%',
    imageRendering: 'crisp-edges',
    height: '100%',
    width: '100%',
    zIndex: 1,
    top: 0,
    left: 0,
    position: 'absolute',
  },
} as Styles

interface BoxCellProps {
  onClick: () => void
  onDragEvent: (_: boolean) => void
  onDrop: (_: PKMInterface[] | undefined) => void
  disabled?: boolean
  zIndex: number
  mon: PKMInterface | undefined
  borderColor?: string
  dragID?: string
  dragData?: MonLocation
}

const BoxCell = ({
  onClick,
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

  // const onDropFromFiles = async (files: FileList) => {
  //   const importedMons: PKMInterface[] = []
  //   for (let i = 0; i < files.length; i++) {
  //     const file = files[i]
  //     const bytes = new Uint8Array(await file.arrayBuffer())
  //     const [extension] = file.name.split('.').slice(-1)
  //     try {
  //       importedMons.push(bytesToPKM(bytes, extension.toUpperCase()))
  //     } catch (e) {
  //       console.error(e)
  //     }
  //   }
  //   onDrop(importedMons)
  // }

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

  const setNodeRefLog = useCallback(
    (element: HTMLElement | null) => {
      console.log('setNodeRefLog', element)
      setNodeRef(element)
    },
    [setNodeRef]
  )

  return (
    <div
      ref={setNodeRefLog}
      style={{
        ...styles.button,
        backgroundColor: disabled || isFilteredOut ? '#555' : '#6662',
        borderColor: borderColor,
        zIndex,
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
