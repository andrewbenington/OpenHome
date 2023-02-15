import { Button, Card, Dialog, Grid, MenuItem, Select } from '@mui/material';
import _ from 'lodash';
import OHPKM from 'pkm/OHPKM';
import { useEffect, useState } from 'react';
import { SAV } from 'sav/SAV';
import { pkm } from '../pkm/pkm';
import { HomeData } from '../sav/HomeData';
import PokemonButton from './components.ts/buttons/PokemonButton';
import PokemonDisplay from './components.ts/PokemonDisplay';
import SaveDisplay from './components.ts/SaveDisplay';
import Themes, { OpenHomeTheme } from './Themes';

const Home = () => {
  const [currentTheme, setCurrentTheme] = useState<OpenHomeTheme>(Themes[0]);
  const [selectedMon, setSelectedMon] = useState<pkm>();
  const [draggingMon, setDraggingMon] = useState<pkm>();
  const [box, setBox] = useState(0);
  const [saves, setSaves] = useState<
    [SAV | undefined, SAV | undefined, SAV | undefined, SAV | undefined]
  >([undefined, undefined, undefined, undefined]);
  const [homeMonMap, setHomeMonMap] = useState<{ [key: string]: OHPKM }>({});
  const [newOHPKMList, setNewOHPKMList] = useState<string[]>([]);
  const [homeData, setHomeData] = useState(new HomeData(new Uint8Array()));

  const writeAllHomeMons = () => {
    homeData.boxes.forEach((b) => {
      b.pokemon.forEach((mon) => {
        if (mon) {
          window.electron.ipcRenderer.sendMessage('write-ohpkm', mon.bytes);
        }
      });
    });
  };

  const [onSaveListeners, setOnSaveListeners] = useState<(() => any)[]>([
    writeAllHomeMons,
  ]);

  const readHomeData = async () => {
    window.electron.ipcRenderer.once(
      'home-data-read',
      ({
        byteMap,
      }: {
        byteMap: {
          [key: string]: Uint8Array;
        };
      }) => {
        const monMap: { [key: string]: OHPKM } = {};
        Object.entries(byteMap).forEach(([id, bytes]) => {
          monMap[id] = new OHPKM(bytes);
        });
        setHomeMonMap(monMap);
      }
    );
    window.electron.ipcRenderer.sendMessage('read-home-data', 'fake');
  };

  useEffect(() => {
    readHomeData();
  }, []);

  const addOnSaveListener = (listener: () => any) => {
    console.log('adding to listeners', listener);
    setOnSaveListeners([...onSaveListeners, listener]);
  };

  return (
    <div
      style={{
        backgroundColor: currentTheme.backgroundColor,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', height: 40 }}>
        <Button>Import PKM</Button>
        <Select
          value={currentTheme.name}
          onChange={(event) => {
            const themeName = (event?.target?.value as string) ?? 'Default';
            const theme = Themes.find((t) => t.name === themeName) ?? Themes[0];
            setCurrentTheme(theme);
          }}
        >
          {Themes.map((theme) => (
            <MenuItem key={theme.name} value={theme.name}>
              {theme.name}
            </MenuItem>
          ))}
        </Select>
        <Button
          onClick={() => {
            console.log(onSaveListeners);
            onSaveListeners.forEach((listener) => {
              listener();
            });
          }}
        >
          Save
        </Button>
      </div>
      <div style={{ display: 'flex', flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', width: '25%' }}>
          <SaveDisplay
            setSelectedMon={setSelectedMon}
            setDraggingMon={setDraggingMon}
            draggingMon={draggingMon}
            setOnSaveListener={addOnSaveListener}
            homeMonMap={homeMonMap}
          />
          <SaveDisplay
            setSelectedMon={setSelectedMon}
            setDraggingMon={setDraggingMon}
            draggingMon={draggingMon}
            setOnSaveListener={addOnSaveListener}
            homeMonMap={homeMonMap}
          />
        </div>
        <Card
          style={{
            borderRadius: 5,
            backgroundColor: currentTheme.contentColor,
            width: '50%',
            height: 'fit-content',
            // borderWidth: 2,
            // borderColor: currentTheme.borderColor,
            // borderStyle: 'solid',
          }}
        >
          {_.range(10).map((row: number) => (
            <Grid container key={`pc_row_${row}`}>
              {_.range(12).map((rowIndex: number) => {
                const mon = homeData.boxes[0].pokemon[row * 12 + rowIndex];
                const currentBox = 0;
                return (
                  <Grid item xs={1} style={{ padding: '2px 2px 0px 2px' }}>
                    <PokemonButton
                      onClick={() => setSelectedMon(mon)}
                      onDragStart={() => setDraggingMon(mon)}
                      onDragEnd={(e) => {
                        if (e.dataTransfer.dropEffect === 'copy') {
                          homeData.boxes[box].pokemon[row * 12 + rowIndex] =
                            undefined;
                          homeData.changedMons.push({
                            box,
                            index: row * 12 + rowIndex,
                          });
                          console.log(homeData.boxes);
                          setHomeData(homeData);
                        }
                        setDraggingMon(undefined);
                      }}
                      mon={mon}
                      zIndex={10 - row}
                      onDrop={(importedMon) => {
                        if (importedMon || draggingMon) {
                          const homeMon = new OHPKM(importedMon ?? draggingMon);
                          const newBoxes = homeData.boxes;
                          newBoxes[currentBox].pokemon[row * 12 + rowIndex] =
                            homeMon;
                          setHomeData({ ...homeData, boxes: newBoxes });
                        }
                      }}
                    />
                  </Grid>
                );
              })}
            </Grid>
          ))}
        </Card>
        <div style={{ display: 'flex', flexDirection: 'column', width: '25%' }}>
          <SaveDisplay
            setSelectedMon={setSelectedMon}
            setDraggingMon={setDraggingMon}
            draggingMon={draggingMon}
            setOnSaveListener={addOnSaveListener}
            homeMonMap={homeMonMap}
          />
          <SaveDisplay
            setSelectedMon={setSelectedMon}
            setDraggingMon={setDraggingMon}
            draggingMon={draggingMon}
            setOnSaveListener={addOnSaveListener}
            homeMonMap={homeMonMap}
          />
        </div>
      </div>
      <Dialog
        open={!!selectedMon}
        onClose={() => setSelectedMon(undefined)}
        fullWidth
        maxWidth="lg"
      >
        {selectedMon && (
          <PokemonDisplay mon={selectedMon} updateMon={() => {}} />
        )}
      </Dialog>
    </div>
  );
};

export default Home;
