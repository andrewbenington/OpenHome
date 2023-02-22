import React, { useEffect } from 'react';
import { MONS_LIST } from '../../../consts/Mons';
import { PKM } from '../../../PKM/PKM';
import { acceptableExtensions, bytesToPKM } from '../../../util/FileImport';
import { getBoxSprite } from '../../util/PokemonSprite';

interface PokemonButtonProps {
  onClick: () => void;
  onDragStart: React.DragEventHandler<HTMLDivElement>;
  onDrop: (mon: PKM | undefined) => void;
  zIndex: number;
  mon: PKM | undefined;
}

const PokemonButton = (props: PokemonButtonProps) => {
  const { onClick, onDragStart, onDrop, zIndex, mon } = props;

  const handleDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    let file = e.dataTransfer.files[0];
    if (file) {
      onDropFromFile(file);
    } else {
      onDrop(undefined);
    }
    e.nativeEvent.preventDefault();
  };

  const onDropFromFile = async (file: File) => {
    let bytes = new Uint8Array(await file.arrayBuffer());
    let [extension] = file.name.split('.').slice(-1);
    extension = extension.toUpperCase();
    console.log(extension, acceptableExtensions);
    if (acceptableExtensions.includes(extension)) {
      let mon = bytesToPKM(bytes, extension);
      console.log(`accepting ${mon.dexNum} ${extension}`);
      onDrop(mon);
    } else {
      console.log(`invalid extension: ${extension}`);
    }
  };

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
          onDragStart={onDragStart}
          // onDragEnd={onDragEnd}
          style={{
            cursor: 'grab',
            background: `url(/icons/BoxIcons.png) no-repeat 0.027027% 0.027027%`,
            backgroundSize: '3700%',
            backgroundPosition:
              mon.isEgg || !MONS_LIST[mon.dexNum]
                ? '0% 0%'
                : `${
                    (MONS_LIST[mon.dexNum].formes[mon.formNum].spriteIndex[0] /
                      36) *
                    100
                  }% ${
                    (Math.floor(
                      MONS_LIST[mon.dexNum].formes[mon.formNum].spriteIndex[1]
                    ) /
                      35) *
                    100
                  }%`,
            height: '100%',
            width: '100%',
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
