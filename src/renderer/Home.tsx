import { Button, Dialog, MenuItem, Select } from '@mui/material';
import OHPKM from 'pkm/OHPKM';
import { PK4 } from 'pkm/PK4';
import { getMonFileIdentifier, getMonGen12Identifier } from 'pkm/util';
import { useCallback, useEffect, useState } from 'react';
import { G2SAV } from 'sav/G2SAV';
import { G3SAV } from 'sav/G3SAV';
import { HGSSSAV } from 'sav/HGSSSAV';
import { BoxCoordinates, SAV } from 'sav/SAV';
import { buildSaveFile, getSaveType } from 'sav/util';
import { acceptableExtensions, bytesToPKM } from 'util/FileImport';
import { utf16StringToGen4 } from 'util/Strings/StringConverter';
import { pkm } from '../pkm/pkm';
import { HomeData } from '../sav/HomeData';
import HomeBoxDisplay from './components/HomeBoxDisplay';
import PokemonDisplay from './components/PokemonDisplay';
import SaveDisplay from './components/SaveDisplay';
import Themes, { OpenHomeTheme } from './Themes';
import { SaveType } from './types/types';
import {
  handleDeleteOHPKM,
  handleMenuResetAndClose,
  handleMenuSave,
  readBoxData,
  readGen12Lookup,
} from './util/ipcFunctions';

export interface SaveCoordinates {
  save: number;
  isHome: boolean;
  box: number;
  index: number;
}

const Home = () => {
  const [currentTheme, setCurrentTheme] = useState<OpenHomeTheme>(Themes[0]);
  const [selectedMon, setSelectedMon] = useState<pkm>();
  const [draggingSource, setDraggingSource] = useState<SaveCoordinates>();
  const [draggingDest, setDraggingDest] = useState<SaveCoordinates>();
  const [box, setBox] = useState(0);
  const [saves, setSaves] = useState<
    [SAV | undefined, SAV | undefined, SAV | undefined, SAV | undefined]
  >([undefined, undefined, undefined, undefined]);
  const [homeMonMap, setHomeMonMap] = useState<{ [key: string]: OHPKM }>();
  const [changedOHPKMList, setChangedOHPKMList] = useState<OHPKM[]>([]);
  const [homeData, setHomeData] = useState(new HomeData(new Uint8Array()));

  useEffect(() => {
    if (homeMonMap) {
      readBoxData((boxString) => {
        // box file just stores references, so we need to populate them from the map
        const newBox = homeData.boxes[0];
        newBox.getMonsFromString(boxString, homeMonMap);
        const newData = new HomeData(new Uint8Array());
        Object.assign(newData, homeData);
        newData.boxes[0] = newBox;
        setHomeData(newData);
      });
    }
  }, [box, homeMonMap]);

  useEffect(() => {
    console.log('homedata changed');
  }, [homeData]);

  useEffect(() => {
    if (draggingSource && draggingDest) {
      const sourceSave = draggingSource.isHome
        ? homeData
        : saves[draggingSource.save];
      const sourceMon =
        sourceSave?.boxes[draggingSource.box]?.pokemon[draggingSource.index];
      if (sourceMon) {
        const homeMon =
          sourceMon instanceof OHPKM ? sourceMon : new OHPKM(sourceMon);
        if (draggingDest.isHome && draggingSource.isHome) {
          changeHomeMon(draggingDest.box, draggingDest.index, homeMon);
          changeHomeMon(draggingSource.box, draggingSource.index, undefined);
        } else if (draggingDest.isHome) {
          changeHomeMon(draggingDest.box, draggingDest.index, homeMon);
          changeSaveMon(
            draggingSource.box,
            draggingSource.index,
            draggingSource.save,
            undefined
          );
        } else if (draggingSource.isHome) {
          changeSaveMon(
            draggingDest.box,
            draggingDest.index,
            draggingDest.save,
            homeMon
          );
          changeHomeMon(draggingSource.box, draggingSource.index, undefined);
        } else {
          changeSaveMon(
            draggingDest.box,
            draggingDest.index,
            draggingDest.save,
            homeMon
          );
          changeSaveMon(
            draggingSource.box,
            draggingSource.index,
            draggingSource.save,
            undefined
          );
        }
        if (draggingSource.save != draggingDest.save) {
          console.log('adding to changed list');
          setChangedOHPKMList([...changedOHPKMList, homeMon]);
        }
        setDraggingSource(undefined);
        setDraggingDest(undefined);
      }
    }
  }, [draggingSource, draggingDest]);

  const changeHomeMon = (box: number, index: number, mon?: OHPKM) => {
    const newBoxes = homeData.boxes;
    newBoxes[box].pokemon[index] = mon;
    let newData = homeData;
    newData.boxes = newBoxes;
    setHomeData(newData);
  };

  const changeSaveMon = (
    box: number,
    index: number,
    saveNumber: number,
    mon?: OHPKM
  ) => {
    console.log('changeSaveMon', box, index, saveNumber, mon);
    const changingSave = saves[saveNumber];
    if (changingSave) {
      const newBoxes = changingSave.boxes;
      newBoxes[box].pokemon[index] = mon;
      let newSaveData = changingSave;
      newSaveData.changedMons.push({ box, index });
      newSaveData.boxes = newBoxes;
      const newSaves = saves;
      newSaves[saveNumber] = newSaveData;
      setSaves(newSaves);
    }
  };

  const onDragFromSave = (coords: SaveCoordinates) => {
    setDraggingSource({
      save: coords.save,
      isHome: false,
      box: coords.box,
      index: coords.index,
    });
  };

  const onDropToSave = (coords: SaveCoordinates) => {
    setDraggingDest({
      save: coords.save,
      isHome: false,
      box: coords.box,
      index: coords.index,
    });
  };

  const onViewDrop = (e: any, type: string) => {
    const processDroppedData = async (file: File) => {
      let bytes = new Uint8Array(await file.arrayBuffer());
      let [extension] = file.name.split('.').slice(-1);
      if (acceptableExtensions.includes(`.${extension}`)) {
        let mon = bytesToPKM(bytes, extension);
        switch (type) {
          case 'as is':
            setSelectedMon(mon);
            break;
          case 'pk4':
            setSelectedMon(new PK4(mon));
            break;
        }
      } else {
        console.log(`invalid extension: ${extension}`);
      }
    };
    let file = e.dataTransfer.files[0];
    console.log(file, draggingSource);
    if (file) {
      console.log(file);
      processDroppedData(file);
    } else {
      if (draggingSource?.isHome) {
        const mon =
          homeData.boxes[draggingSource.box]?.pokemon[draggingSource.index];
        if (mon && type === 'trash') {
          changeHomeMon(draggingSource.box, draggingSource.index);
          handleDeleteOHPKM(mon);
        } else if (mon) {
          switch (type) {
            case 'as is':
              setSelectedMon(mon);
              break;
            case 'pk4':
              setSelectedMon(new PK4(mon));
              break;
          }
        }
      } else if (
        draggingSource?.save !== undefined &&
        draggingSource?.isHome === false
      ) {
        const mon =
          saves[draggingSource.save]?.boxes[draggingSource.box]?.pokemon[
            draggingSource.index
          ];
        if (mon && type === 'trash') {
          changeSaveMon(
            draggingSource.box,
            draggingSource.index,
            draggingSource.save
          );
          handleDeleteOHPKM(mon);
        } else if (mon) {
          switch (type) {
            case 'as is':
              setSelectedMon(mon);
              break;
            case 'pk4':
              setSelectedMon(new PK4(mon));
              break;
          }
        }
      }
    }
    e.nativeEvent.preventDefault();
  };

  const onImportMon = (
    importedMon: pkm,
    saveIndex: number,
    boxCoords: BoxCoordinates
  ) => {
    const newSave = saves[saveIndex];
    if (!newSave) {
      return;
    }
    const homeMon = new OHPKM(importedMon);
    newSave.boxes[boxCoords.box].pokemon[boxCoords.index] = homeMon;
    newSave.changedMons.push(boxCoords);
    const newSaves = saves;
    newSaves[saveIndex] = newSave;
    console.log('adding to changed list');
    setChangedOHPKMList([...changedOHPKMList, homeMon]);
    setSaves(newSaves);
  };

  const writeAllHomeData = () => {
    homeData.boxes.forEach((b) => {
      window.electron.ipcRenderer.sendMessage('write-home-box', {
        boxName: b.name,
        boxString: b.writeMonsToString(),
      });
    });
    changedOHPKMList.forEach((mon) => {
      console.log('writing', mon);
      if (mon) {
        window.electron.ipcRenderer.sendMessage('write-ohpkm', mon.bytes);
      }
    });
  };

  const saveAllSaveFiles = () => {
    console.log(saves);
    saves.forEach((save) => {
      if (
        save instanceof G3SAV ||
        save instanceof G2SAV ||
        save instanceof HGSSSAV
      ) {
        const changedMons = save.prepareBoxesForSaving();
        if (changedMons && save instanceof G2SAV) {
          const gen12LookupString = changedMons
            .map((mon, i) => {
              if (!mon) return '';
              const gen12Identifier = getMonGen12Identifier(mon);
              const homeIdentifier = getMonFileIdentifier(mon);
              console.log(gen12Identifier, homeIdentifier);
              if (!gen12Identifier || !homeIdentifier) return '';
              return gen12Identifier + ',' + homeIdentifier + '\n';
            })
            .join('');
          window.electron.ipcRenderer.sendMessage(
            'write-gen12-lookup',
            gen12LookupString
          );
        }
        window.electron.ipcRenderer.sendMessage('write-save-file', {
          path: save.filePath,
          bytes: save.bytes,
        });
      }
    });
    writeAllHomeData();
  };

  const readHomeData = async () => {
    window.electron.ipcRenderer.once(
      'home-data-read',
      (byteMap: { [key: string]: Uint8Array }) => {
        const monMap: { [key: string]: OHPKM } = {};
        Object.entries(byteMap).forEach(([id, bytes]) => {
          monMap[id] = new OHPKM(bytes);
        });
        setHomeMonMap(monMap);
      }
    );
    window.electron.ipcRenderer.sendMessage('read-home-data', 'fake');
  };

  const openSave = async (saveIndex: number) => {
    window.electron.ipcRenderer.once('save-file-read', (result: any) => {
      const { path, fileBytes } = result;
      if (path && fileBytes) {
        const saveType = getSaveType(fileBytes);
        switch (saveType) {
          case SaveType.GS_I:
          case SaveType.C_I:
            console.log('gen 2');
            readGen12Lookup((gen12LookupMap) => {
              console.log('lookup map', gen12LookupMap);
              const newSave = buildSaveFile(
                path,
                fileBytes,
                saveType,
                homeMonMap,
                gen12LookupMap
              );
              const newSaves: [
                SAV | undefined,
                SAV | undefined,
                SAV | undefined,
                SAV | undefined
              ] = [saves[0], saves[1], saves[2], saves[3]];
              newSaves[saveIndex] = newSave;
              setSaves(newSaves);
            });
          case SaveType.UNKNOWN:
            return;
          default:
            const newSave = buildSaveFile(
              path,
              fileBytes,
              saveType,
              homeMonMap
            );
            const newSaves: [
              SAV | undefined,
              SAV | undefined,
              SAV | undefined,
              SAV | undefined
            ] = [saves[0], saves[1], saves[2], saves[3]];
            newSaves[saveIndex] = newSave;
            setSaves(newSaves);
        }
      }
    });
    window.electron.ipcRenderer.sendMessage('read-save-file');
  };

  useEffect(() => {
    const callback = handleMenuSave(saveAllSaveFiles);
    return () => callback();
  }, [saveAllSaveFiles]);

  useEffect(() => {
    const callback = handleMenuResetAndClose(
      () => console.log('reset'),
      () => setSaves([undefined, undefined, undefined, undefined])
    );
    return () => callback();
  }, [saves]);

  useEffect(() => {
    readHomeData();
  }, []);

  return homeMonMap ? (
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
        <Button onClick={saveAllSaveFiles}>Save</Button>
      </div>
      <div style={{ display: 'flex', flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', width: '25%' }}>
          <SaveDisplay
            save={saves[0]}
            saveIndex={0}
            openSave={openSave}
            onImport={onImportMon}
            onDrag={onDragFromSave}
            onDrop={onDropToSave}
            setSelectedMon={setSelectedMon}
          />
          <SaveDisplay
            save={saves[1]}
            saveIndex={1}
            openSave={openSave}
            onImport={onImportMon}
            onDrag={onDragFromSave}
            onDrop={onDropToSave}
            setSelectedMon={setSelectedMon}
          />
        </div>
        <HomeBoxDisplay
          box={homeData.boxes[box]}
          setBox={(newBox) => {
            homeData.boxes[box] = newBox;
            setHomeData({ ...homeData });
          }}
          currentTheme={currentTheme}
          setSelectedMon={setSelectedMon}
          onDrag={(index) =>
            setDraggingSource({
              save: -1,
              isHome: true,
              box,
              index,
            })
          }
          onDrop={(index) =>
            setDraggingDest({
              save: -1,
              isHome: true,
              box,
              index,
            })
          }
        />
        <div style={{ display: 'flex', flexDirection: 'column', width: '25%' }}>
          <SaveDisplay
            save={saves[2]}
            saveIndex={2}
            openSave={openSave}
            onImport={onImportMon}
            onDrag={onDragFromSave}
            onDrop={onDropToSave}
            setSelectedMon={setSelectedMon}
          />
          <SaveDisplay
            save={saves[3]}
            saveIndex={3}
            openSave={openSave}
            onImport={onImportMon}
            onDrag={onDragFromSave}
            onDrop={onDropToSave}
            setSelectedMon={setSelectedMon}
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
      <div style={{ display: 'flex', flex: 1 }}>
        <button
          type="button"
          style={{
            margin: 10,
            height: 'calc(100% - 20px)',
            width: '100%',
            backgroundColor: '#fff4',
            position: 'relative',
            border: 'none',
            borderRadius: 4,
            textAlign: 'center',
          }}
          onClick={() => console.log(utf16StringToGen4('Starmie', 11, true))}
          //   disabled={!mon}
        >
          <div
            draggable
            style={{
              cursor: 'grab',
              width: '100%',
              height: '100%',
              padding: 'auto',
            }}
            onDragOver={(e) => {
              console.log('dragover');
              e.preventDefault();
            }}
            onDrop={(e) => onViewDrop(e, 'as is')}
          >
            As Is
          </div>
        </button>
        <button
          type="button"
          style={{
            margin: 10,
            height: 'calc(100% - 20px)',
            width: '100%',
            backgroundColor: '#fff4',
            position: 'relative',
            border: 'none',
            borderRadius: 4,
            textAlign: 'center',
          }}
          onClick={() => console.log(utf16StringToGen4('Starmie', 11, true))}
          //   disabled={!mon}
        >
          <div
            draggable
            style={{
              cursor: 'grab',
              width: '100%',
              height: '100%',
              padding: 'auto',
            }}
            onDragOver={(e) => {
              console.log('dragover');
              e.preventDefault();
            }}
            onDrop={(e) => onViewDrop(e, 'pk4')}
          >
            PK4
          </div>
        </button>
        <button
          type="button"
          style={{
            margin: 10,
            height: 'calc(100% - 20px)',
            width: '100%',
            backgroundColor: '#fff4',
            position: 'relative',
            border: 'none',
            borderRadius: 4,
            textAlign: 'center',
          }}
          onClick={() => console.log(utf16StringToGen4('Starmie', 11, true))}
          //   disabled={!mon}
        >
          <div
            draggable
            style={{
              cursor: 'grab',
              width: '100%',
              height: '100%',
              padding: 'auto',
            }}
            onDragOver={(e) => {
              console.log('dragover');
              e.preventDefault();
            }}
            onDrop={(e) => onViewDrop(e, 'trash')}
          >
            TRASH
          </div>
        </button>
      </div>
    </div>
  ) : (
    <div />
  );
};

export default Home;
