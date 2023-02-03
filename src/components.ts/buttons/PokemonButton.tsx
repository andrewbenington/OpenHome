import React from "react";
import { MONS_LIST } from "../../consts/Mons";
import { pk3 } from "../../pkm/pk3";
import { pkm } from "../../pkm/pkm";
import { acceptableExtensions, bytesToPKM } from "../../util/FileImport";
import { getBoxSprite } from "../../util/PokemonSprite";

interface PokemonButtonProps {
  onClick: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDropFile: (mon: pkm) => void;
  zIndex: number;
  mon: pkm | undefined;
}

const PokemonButton = (props: PokemonButtonProps) => {
  const { onClick, onDragEnd, onDragStart, onDropFile, zIndex, mon } = props;

  const handleDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    console.log("drop");
    let file = e.dataTransfer.files[0];
    console.log(e.dataTransfer.files);
    onDropFromFile(file);
    e.nativeEvent.preventDefault();
  };

  const onDropFromFile = async (file: File) => {
    let bytes = new Uint8Array(await file.arrayBuffer());
    let [extension] = file.name.split(".").slice(-1);
    if (acceptableExtensions.includes(`.${extension}`)) {
      let mon = bytesToPKM(bytes, extension);
      console.log(`accepting ${mon.dexNum} ${extension}`)
      onDropFile(mon);
    } else {
      console.log(`invalid extension: ${extension}`)
    }
  };

  return (
    <button
      onClick={onClick}
      style={{
        padding: 0,
        width: "100%",
        aspectRatio: 1,
        zIndex: zIndex,
        backgroundColor: "#fff4",
        position: "relative",
        border: "none",
        borderRadius: 2,
        textAlign: "center",
      }}
      //   disabled={!mon}
    >
      {mon ? (
        <img
          // key={`pc_mon_${row * 6 + rowIndex}`}
          alt={`${MONS_LIST[mon.dexNum].name} icon`}
          src={mon ? getBoxSprite(mon.dexNum, mon.formNum) : ""}
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          style={{
            position: "absolute",
            width: "140%",
            top: "-20%",
            left: "-20%",
            right: "20%",
            bottom: "20%",
            imageRendering: "crisp-edges",
            cursor: "pointer",
          }}
        />
      ) : (
        <div
          style={{ width: "100%", height: "100%" }}
          onDragOver={(e) => {
            console.log("dragEnter");
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

export default PokemonButton;
