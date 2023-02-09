import { Button, Dialog, Grid, MenuItem, Select } from "@mui/material";
import _ from "lodash";
import { useEffect, useState } from "react";
import PokemonButton from "./components.ts/buttons/PokemonButton";
import PokemonDisplay from "./components.ts/PokemonDisplay";
import SaveDisplay from "./components.ts/SaveDisplay";
import { pkm } from "./pkm/pkm";
import { HomeData } from "./sav/HomeData";
import Themes, { OpenHomeTheme } from "./Themes";

const Home = () => {
  const [currentTheme, setCurrentTheme] = useState<OpenHomeTheme>(Themes[0]);
  const [selectedMon, setSelectedMon] = useState<pkm>();
  const [, setDraggingMon] = useState<pkm>();
  const [homeData, setHomeData] = useState(new HomeData(new Uint8Array()));

  useEffect(() => {
    getCurrentDirectory();
  }, []);

  const getCurrentDirectory = async () => {
    try {
      const result = await (window as unknown as any).electron.ipcRenderer.invoke("read-home-data");
      console.log(result);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      style={{
        backgroundColor: currentTheme.backgroundColor,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", height: 40 }}>
        <Button>Import PKM</Button>
        <Select
          value={currentTheme.name}
          onChange={(event) => {
            const themeName = (event?.target?.value as string) ?? "Default";
            const theme = Themes.find((t) => t.name === themeName) ?? Themes[0];
            setCurrentTheme(theme);
          }}
        >
          {Themes.map((theme) => (
            <MenuItem value={theme.name}>{theme.name}</MenuItem>
          ))}
        </Select>
      </div>
      <div style={{ display: "flex", flex: 1 }}>
        <div style={{ display: "flex", flexDirection: "column", width: "25%" }}>
          <SaveDisplay
            setSelectedMon={setSelectedMon}
            setDraggingMon={setDraggingMon}
          />
          <SaveDisplay
            setSelectedMon={setSelectedMon}
            setDraggingMon={setDraggingMon}
          />
        </div>
        <div
          style={{
            borderRadius: 10,
            backgroundColor: currentTheme.contentColor,
            width: "50%",
            aspectRatio: 1,
            borderWidth: 2,
            borderColor: currentTheme.borderColor,
            borderStyle: "solid",
          }}
        >
          {_.range(10).map((row: number) => (
            <Grid container key={`pc_row_${row}`}>
              {_.range(12).map((rowIndex: number) => {
                let mon = homeData.boxes[0].pokemon[row * 12 + rowIndex];
                let currentBox = 0;
                return (
                  <Grid item xs={1} style={{ padding: "2px 2px 0px 2px" }}>
                    <PokemonButton
                      onClick={() => setSelectedMon(mon)}
                      onDragStart={() => setDraggingMon(mon)}
                      onDragEnd={() => setDraggingMon(undefined)}
                      mon={mon}
                      zIndex={10 - row}
                      onDropFile={(importedMon) => {
                        homeData.boxes[currentBox].pokemon[
                          row * 12 + rowIndex
                        ] = importedMon;
                        let newBoxes = homeData.boxes;
                        newBoxes[currentBox].pokemon[row * 12 + rowIndex] =
                          importedMon;
                        setHomeData({ ...homeData, boxes: newBoxes });
                      }}
                    />
                  </Grid>
                );
              })}
            </Grid>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: "25%" }}>
          <SaveDisplay
            setSelectedMon={setSelectedMon}
            setDraggingMon={setDraggingMon}
          />
          <SaveDisplay
            setSelectedMon={setSelectedMon}
            setDraggingMon={setDraggingMon}
          />
        </div>
      </div>
      <Dialog
        open={!!selectedMon}
        onClose={() => setSelectedMon(undefined)}
        fullWidth
        maxWidth="lg"
      >
        {selectedMon && <PokemonDisplay mon={selectedMon} />}
      </Dialog>
    </div>
  );
};

export default Home;
