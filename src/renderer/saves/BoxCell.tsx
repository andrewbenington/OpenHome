import BoxIcons from '../images/icons/BoxIcons.png'
import React, { useEffect, useState } from 'react';
import { POKEMON_DATA } from '../../consts/Mons';
import { PKM } from '../../types/PKMTypes/PKM';
import { acceptableExtensions, bytesToPKM } from '../../util/FileImport';

interface BoxCellProps {
  onClick: () => void;
  onDragEvent: (cancelled: boolean) => void;
  onDrop: (mons: PKM[] | undefined) => void;
  disabled: boolean;
  zIndex: number;
  mon: PKM | undefined;
}

const BoxCell = (props: BoxCellProps) => {
  const { onClick, onDragEvent, onDrop, disabled, zIndex, mon } = props;
  const [dragImage, setDragImage] = useState<HTMLElement>();

  const handleDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    if (e.dataTransfer.files[0]) {
      onDropFromFiles(e.dataTransfer.files);
    } else {
      onDrop(undefined);
    }
    e.nativeEvent.preventDefault();
  };

  const getBackgroundDetails = () => {
    if (disabled) {
      return {
        backgroundBlendMode: 'multiply',
        backgroundColor: '#555',
      };
    } else {
      return {};
    }
  };

  const onDropFromFiles = async (files: FileList) => {
    const importedMons: PKM[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let bytes = new Uint8Array(await file.arrayBuffer());
      let [extension] = file.name.split('.').slice(-1);
      extension = extension.toUpperCase();
      if (acceptableExtensions.includes(extension)) {
        importedMons.push(bytesToPKM(bytes, extension));
      } else {
        console.log(`invalid extension: ${extension}`);
      }
    }
    onDrop(importedMons);
  };

  useEffect(() => {
    setDragImage(undefined);
  }, [mon]);

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: 0,
        width: '100%',
        aspectRatio: 1,
        zIndex: zIndex,
        backgroundColor: disabled ? '#555' : '#fff4',
        position: 'relative',
        border: 'none',
        borderRadius: 2,
        textAlign: 'center',
      }}
      disabled={disabled}
    >
      {mon ? (
        <div
          draggable
          onDragStart={(e) => {
            if (mon) {
              const dragIcon = document.getElementById('drag-image');
              const div = document.getElementById('drag-image-container');
              if (!dragIcon || !div) return;
              dragIcon.style.backgroundPosition =
                mon.isEgg || !POKEMON_DATA[mon.dexNum]
                  ? '0% 0%'
                  : `${
                      (POKEMON_DATA[mon.dexNum].formes[mon.formNum]
                        .spriteIndex[0] /
                        36) *
                      100
                    }% ${
                      (Math.floor(
                        POKEMON_DATA[mon.dexNum].formes[mon.formNum]
                          .spriteIndex[1]
                      ) /
                        35) *
                      100
                    }%`;
              const dimension = window.outerWidth / 24 - 4;
              div.style.height = `${dimension}px`;
              div.style.width = `${dimension}px`;
              setDragImage(dragIcon);
              e.dataTransfer.setDragImage(div, dimension / 2, dimension / 2);
            }
            onDragEvent(false);
          }}
          onDragEnd={(e: { dataTransfer: any; target: any }) => {
            if (dragImage) {
              dragImage.style.backgroundPosition = '0% 0%';
            }
            console.log("onDragEnd", e)
            // if not waiting for mon to show up in other slot, set drag image to
            // undefined so it shows up in this one again
            if (
              e.dataTransfer.dropEffect !== 'copy'
              // e.target.className !== 'pokemon_slot'
            ) {
              setDragImage(undefined);
              onDragEvent(true);
            }
          }}
          style={{
            background: `url(${BoxIcons}) no-repeat 0.027027% 0.027027%`,
            backgroundSize: '3700%',
            backgroundPosition:
              mon.isEgg || !POKEMON_DATA[mon.dexNum]
                ? '0% 0%'
                : `${
                    (POKEMON_DATA[mon.dexNum].formes[mon.formNum]
                      .spriteIndex[0] /
                      36) *
                    100
                  }% ${
                    (Math.floor(
                      POKEMON_DATA[mon.dexNum].formes[mon.formNum]
                        .spriteIndex[1]
                    ) /
                      35) *
                    100
                  }%`,
            ...getBackgroundDetails(),
            height: '100%',
            width: '100%',
            opacity: dragImage ? 0 : 1,
          }}
        />
      ) : (
        <div
          className="pokemon_slot"
          style={{
            width: '100%',
            height: '100%',
            ...getBackgroundDetails(),
          }}
          onDragOver={
            disabled
              ? undefined
              : (e) => {
                  e.preventDefault();
                }
          }
          onDrop={handleDrop}
        />
      )}
    </button>
  );
};

export default BoxCell;
