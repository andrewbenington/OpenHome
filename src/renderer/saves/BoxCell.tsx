import React, { useContext, useEffect, useMemo, useState } from 'react'
import { filterApplies } from 'src/types/Filter'
import { PKM } from '../../types/PKMTypes/PKM'
import { Styles } from '../../types/types'
import { bytesToPKM } from '../../util/FileImport'
import PokemonIcon from '../components/PokemonIcon'
import BoxIcons from '../images/BoxIcons.png'
import { FilterContext } from '../state/filter'

const styles = {
  fillContainer: { width: '100%', height: '100%' },
  button: {
    padding: 0,
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
    borderRadius: 3,
    textAlign: 'center',
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
  onDrop: (_: PKM[] | undefined) => void
  disabled: boolean
  zIndex: number
  mon: PKM | undefined
}

const BoxCell = (props: BoxCellProps) => {
  const { onClick, onDragEvent, onDrop, disabled, zIndex, mon } = props
  const [isBeingDragged, setIsBeingDragged] = useState(false)
  const [isDraggedOver, setIsDraggedOver] = useState(false)
  const [filterState] = useContext(FilterContext)

  const isFilteredOut = useMemo(() => {
    return (
      Object.values(filterState).some((val) => val !== undefined) &&
      (mon === undefined || !filterApplies(filterState, mon))
    )
  }, [filterState, mon])

  const onDropFromFiles = async (files: FileList) => {
    const importedMons: PKM[] = []
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

  const handleDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    if (e.dataTransfer.files[0]) {
      onDropFromFiles(e.dataTransfer.files)
    } else {
      onDrop(undefined)
    }
    e.nativeEvent.preventDefault()
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

  useEffect(() => {
    setIsBeingDragged(false)
  }, [mon])

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...styles.button,
        backgroundColor: disabled || isFilteredOut ? '#555' : '#6662',
        borderColor: isDraggedOver ? 'red' : undefined,
        zIndex,
      }}
      disabled={disabled}
    >
      {mon ? (
        <PokemonIcon
          dexNumber={mon.dexNum}
          formeNumber={mon.formNum}
          greyedOut={isFilteredOut || disabled}
          isShiny={mon.isShiny}
          heldItemIndex={mon.heldItemIndex}
          heldItemFormat={mon.format}
          style={{
            width: '100%',
            height: '100%',
            ...getBackgroundDetails(),
            transition: '0.01s, background-color 0s',
            transform: isBeingDragged ? 'translateX(-9999px)' : undefined,
          }}
          draggable
          onDragStart={() => {
            onDragEvent(false)
            setIsBeingDragged(true)
          }}
          onDragEnter={() => setIsDraggedOver(true)}
          onDragLeave={() => setIsDraggedOver(false)}
          onDragEnd={(e: { dataTransfer: any; target: any }) => {
            setIsBeingDragged(false)
            if (e.dataTransfer.dropEffect !== 'copy') {
              onDragEvent(true)
            }
          }}
        />
      ) : (
        <div
          className="pokemon_slot"
          style={{ ...styles.fillContainer, ...getBackgroundDetails() }}
          onDragEnter={() => setIsDraggedOver(true)}
          onDragLeave={() => setIsDraggedOver(false)}
          onDragOver={
            disabled
              ? undefined
              : (e) => {
                  e.preventDefault()
                }
          }
          onDrop={(e) => {
            setIsDraggedOver(false)
            handleDrop(e)
          }}
        />
      )}
    </button>
  )
}

export default BoxCell
