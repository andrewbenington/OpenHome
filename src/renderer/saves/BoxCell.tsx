import BoxIcons from '../images/icons/BoxIcons.png';
import React, { useEffect, useState } from 'react';
import { PKM } from '../../types/PKMTypes/PKM';
import { acceptableExtensions, bytesToPKM } from '../../util/FileImport';
import { useResourcesPath } from 'renderer/redux/selectors';
import { POKEMON_DATA } from 'consts';

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
  const [dragImage, setDragImage] = useState<Element>();
  const resourcesPath = useResourcesPath();

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
      return {
        backgroundColor: '#0000',
      };
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
          style={{
            width: '100%',
            height: '100%',
          }}
        >
          <div
            draggable
            onDragStart={(e) => {
              onDragEvent(false);
            }}
            onDragEnd={(e: { dataTransfer: any; target: any }) => {
              if (dragImage) {
                document.body.removeChild(dragImage);
              }
              console.log('onDragEnd', e);
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
              imageRendering: 'crisp-edges',
              height: '100%',
              width: '100%',
              opacity: dragImage ? 0 : 1,
              // boxShadow: '0px 0px 20px 5px #0ff',
              zIndex: 100,
              top: 0,
              left: 0,
              position: 'absolute',
            }}
          />
        </div>
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
