import { Button, Dialog } from "@mui/material";
import { useEffect, useState } from "react";
import { FileContent, useFilePicker } from "use-file-picker";
import { BoxDisplay } from "./BoxDisplay";
import { pkm } from "../pkm/pkm";
import { G3SAV } from "../sav/G3SAV";
import { SAV } from "../sav/SAV";
import OpenHomeButton from "./buttons/OpenHomeButton";
import { HGSSSAV } from "../sav/HGSSSAV";
import { G5SAV } from "../sav/G5SAV";

interface SaveDisplayProps {
  setSelectedMon: (mon: pkm | undefined) => void;
  setDraggingMon: (mon: pkm | undefined) => void;
}

const SaveDisplay = (props: SaveDisplayProps) => {
  const { setSelectedMon, setDraggingMon } = props;
  const [save, setSave] = useState<SAV>();
  const [bytes, setBytes] = useState<Uint8Array>();
  const [generationSelect, setGenerationSelect] = useState<string>();
  const [openFileSelector, { filesContent }] = useFilePicker({
    accept: [".sav"],
    readAs: "ArrayBuffer",
  });

  useEffect(() => {
    if (filesContent?.length) {
      let save = fileContentToSav(filesContent[0]);
      setSave(save);
    }
  }, [filesContent]);

  const fileContentToSav = (fileContent: FileContent): SAV | undefined => {
    let bytes = new Uint8Array(fileContent.content as unknown as ArrayBuffer);
    console.log(bytes.length);
    switch (bytes.length) {
      case 131072:
        return new G3SAV(bytes);
      case 524288:
        setGenerationSelect("45");
        setBytes(bytes);
        return undefined;
    }
  };

  const onGameSelect: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    if (bytes) {
      const button = e.target as HTMLElement;
      switch (button?.innerText) {
        case "HGSS":
          setSave(new HGSSSAV(bytes));
          break;
        case "Gen 5":
          setSave(new G5SAV(bytes));
          break;
      }
      setGenerationSelect(undefined)
      setBytes(undefined)
    }
  };

  return (
    <>
      {save ? (
        <BoxDisplay
          setSelectedMon={setSelectedMon}
          setDraggingMon={setDraggingMon}
          save={save}
        />
      ) : (
        <Button
          style={{ width: "100%" }}
          onClick={() => {
            openFileSelector();
          }}
        >
          <h2>Open Save File</h2>
        </Button>
      )}
      <Dialog
        open={!!generationSelect}
        onClose={() => setGenerationSelect(undefined)}
      >
        <h3 style={{ marginLeft: 10 }}>Select Game</h3>
        <div style={{ display: "flex" }}>
          {generationSelectOptions[generationSelect ?? ""]?.map((option) => (
            <OpenHomeButton
              key={`${option} button`}
              style={{ width: 200, height: 100, margin: 10 }}
              onClick={onGameSelect}
            >
              {option}
            </OpenHomeButton>
          ))}
        </div>
      </Dialog>
    </>
  );
};

const generationSelectOptions: { [key: string]: string[] } = {
  "45": ["DP", "Pt", "HGSS", "Gen 5"],
};

export default SaveDisplay;
