import React, { useEffect, useState } from 'react'
import { hasGen3OnData } from 'src/types/interfaces/gen3'
import { POKEMON_DATA } from '../../consts'
import { PKM } from '../../types/PKMTypes/PKM'
import { BasePKMData } from '../../types/interfaces/base'
import { Styles } from '../../types/types'
import { bytesToPKM } from '../../util/FileImport'
import BoxIcons from '../images/BoxIcons.png'

const styles = {
  fillContainer: { width: '100%', height: '100%' },
  button: {
    padding: 0,
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
    border: 'none',
    borderRadius: 3,
    textAlign: 'center',
  },
  background: {
    background: `url(${BoxIcons}) no-repeat 0.02777% 0.02777%`,
    backgroundSize: '3600%',
    imageRendering: 'crisp-edges',
    height: '100%',
    width: '100%',
    zIndex: 100,
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
  const [dragImage, setDragImage] = useState<Element>()

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

  const getBackgroundPosition = (mon: BasePKMData) => {
    if ((hasGen3OnData(mon) && mon.isEgg) || !POKEMON_DATA[mon.dexNum]) {
      return '0% 0%'
    }
    const [x, y] = POKEMON_DATA[mon.dexNum].formes[mon.formNum].spriteIndex
    return `${(x / 35) * 100}% ${(y / 36) * 100}%`
  }

  useEffect(() => {
    setDragImage(undefined)
  }, [mon])

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...styles.button,
        backgroundColor: disabled ? '#555' : '#fff4',
        zIndex,
      }}
      disabled={disabled}
    >
      {mon ? (
        <div style={styles.fillContainer}>
          <div
            draggable
            onDragStart={() => {
              onDragEvent(false)
            }}
            onDragEnd={(e: { dataTransfer: any; target: any }) => {
              if (dragImage) {
                document.body.removeChild(dragImage)
              }
              // if not waiting for mon to show up in other slot, set drag image to
              // undefined so it shows up in this one again
              if (e.dataTransfer.dropEffect !== 'copy') {
                setDragImage(undefined)
                onDragEvent(true)
              }
            }}
            style={{
              ...styles.background,
              backgroundPosition: getBackgroundPosition(mon),
              ...getBackgroundDetails(),
              opacity: dragImage ? 0 : 1,
            }}
          />
        </div>
      ) : (
        <div
          className="pokemon_slot"
          style={{ ...styles.fillContainer, ...getBackgroundDetails() }}
          onDragOver={
            disabled
              ? undefined
              : (e) => {
                  e.preventDefault()
                }
          }
          onDrop={handleDrop}
        />
      )}
    </button>
  )
}

export default BoxCell
