import React from 'react';
import { MONS_LIST } from '../../../consts/Mons';
import { pkm } from '../../../pkm/pkm';
import { acceptableExtensions, bytesToPKM } from '../../../util/FileImport';
import { getBoxSprite } from '../../util/PokemonSprite';

interface PokemonButtonProps {
  onClick: () => void;
  onDragStart: React.DragEventHandler<HTMLDivElement>;
  onDragEnd: React.DragEventHandler<HTMLDivElement>;
  onDrop: (mon: pkm | undefined) => void;
  zIndex: number;
  mon: pkm | undefined;
}

const PokemonButton = (props: PokemonButtonProps) => {
  const { onClick, onDragEnd, onDragStart, onDrop, zIndex, mon } = props;

  const handleDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.relatedTarget;
    console.log('drop');
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
    if (acceptableExtensions.includes(`.${extension}`)) {
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
          onDragEnd={onDragEnd}
          style={{
            cursor: 'grab',
            background: `url(/icons/BoxIcons.png) no-repeat 0.027027% 0.027027%`,
            backgroundSize: '3700%',
            backgroundPosition: mon.isEgg || !MONS_LIST[mon.dexNum]
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
        // <img
        //   // key={`pc_mon_${row * 6 + rowIndex}`}
        //   alt={`${MONS_LIST[mon.dexNum]?.name} icon`}
        //   src={mon ? getBoxSprite(mon.dexNum, mon.formNum) : ''}
        //   draggable
        //   onDragStart={onDragStart}
        //   onDragEnd={onDragEnd}
        //   style={{
        //     position: 'absolute',
        //     width: '140%',
        //     top: '-20%',
        //     left: '-20%',
        //     right: '20%',
        //     bottom: '20%',
        //     imageRendering: 'crisp-edges',
        //     cursor: 'pointer',
        //   }}
        // />
        <div
          style={{ width: '100%', height: '100%' }}
          onDragOver={(e) => {
            console.log('dragEnter');
            e.stopPropagation();
            e.preventDefault();
            return false;
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
