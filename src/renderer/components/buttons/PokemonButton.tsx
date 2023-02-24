import React, { useEffect, useState } from 'react';
import { POKEMON_DATA } from '../../../consts/Mons';
import { PKM } from '../../../types/PKM/PKM';
import { acceptableExtensions, bytesToPKM } from '../../../util/FileImport';
import { getBoxSprite } from '../../util/PokemonSprite';

interface PokemonButtonProps {
  onClick: () => void;
  onDragStart: React.DragEventHandler<HTMLDivElement>;
  onDrop: (mons: PKM[] | undefined) => void;
  zIndex: number;
  mon: PKM | undefined;
}

const PokemonButton = (props: PokemonButtonProps) => {
  const { onClick, onDragStart, onDrop, zIndex, mon } = props;
  const [dragImage, setDragImage] = useState<HTMLDivElement>();

  const handleDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    if (e.dataTransfer.files[0]) {
      onDropFromFiles(e.dataTransfer.files);
    } else {
      onDrop(undefined);
    }
    e.nativeEvent.preventDefault();
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
        backgroundColor: '#fff4',
        position: 'relative',
        border: 'none',
        borderRadius: 2,
        textAlign: 'center',
      }}
      //   disabled={!mon}
    >
      {mon ? (
        <div
          draggable
          onDragStart={(e) => {
            if (mon) {
              var dragIcon = document.createElement('div');
              dragIcon.style.height = '100%';
              dragIcon.style.width = '100%';
              dragIcon.style.background = `url(/icons/BoxIcons.png) no-repeat 0.027027% 0.027027%`;
              dragIcon.style.backgroundSize = '3700%';
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
              var div = document.createElement('div');
              div.appendChild(dragIcon);
              const dimension = window.outerWidth / 24 - 4;
              div.style.height = `${dimension}px`;
              div.style.width = `${dimension}px`;
              div.style.position = 'absolute';
              div.style.top = '-500px';
              document.querySelector('body')?.appendChild(div);
              setDragImage(div);
              e.dataTransfer.setDragImage(div, dimension / 2, dimension / 2);
            }
            onDragStart(e);
          }}
          onDragEnd={(e) => {
            dragImage?.remove();
            if (e.dataTransfer.dropEffect !== 'copy') {
              setDragImage(undefined);
            }
          }}
          style={{
            background: `url(/icons/BoxIcons.png) no-repeat 0.027027% 0.027027%`,
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
            height: '100%',
            width: '100%',
            opacity: dragImage ? 0 : 1,
          }}
        />
      ) : (
        <div
          style={{ width: '100%', height: '100%' }}
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDrop={handleDrop}
        />
      )}
    </button>
  );
};

function getOffsetCoords(dexNum: number, formNum: number) {
  return `${((dexNum % 37) / 36) * 100}% ${
    (Math.floor(dexNum / 37) / 35) * 100
  }%`;
}

export default PokemonButton;
