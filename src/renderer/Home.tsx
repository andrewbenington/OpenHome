import { Button, Dialog, MenuItem, Select } from '@mui/material';
import { useEffect, useState } from 'react';
import OHPKM from 'types/PKM/OHPKM';
import { PK3 } from 'types/PKM/PK3';
import { PK4 } from 'types/PKM/PK4';
import G1SAV from 'types/SAV/G1SAV';
import { G2SAV } from 'types/SAV/G2SAV';
import { G3SAV } from 'types/SAV/G3SAV';
import { G4SAV } from 'types/SAV/G4SAV';
import { BoxCoordinates, SAV } from 'types/SAV/SAV';
import { buildSaveFile, getSaveType } from 'types/SAV/util';
import { isRestricted } from 'types/TransferRestrictions';
import { bytesToUint16LittleEndian } from 'util/ByteLogic';
import { acceptableExtensions, bytesToPKM } from 'util/FileImport';
import {
  getMonFileIdentifier,
  updateGen12LookupTable,
  updateGen34LookupTable,
} from '../util/Lookup';
import Gen4ToUTFMap from 'util/Strings/Gen4ToUTFMap';
import { utf16StringToGen4 } from 'util/Strings/StringConverter';
import { PKM } from '../types/PKM/PKM';
import { HomeData } from '../types/SAV/HomeData';
import { MonReference, SaveType } from '../types/types';
import HomeBoxDisplay from './components/HomeBoxDisplay';
import PokemonDisplay from './components/PokemonDisplay';
import SaveDisplay from './components/SaveDisplay';
import Themes, { OpenHomeTheme } from './Themes';
import { initializeDragImage } from './util/initializeDragImage';
import {
  handleDeleteOHPKMFiles,
  handleMenuResetAndClose,
  handleMenuSave,
  readBoxData,
  readGen12Lookup,
  readGen34Lookup,
} from './util/ipcFunctions';

export interface SaveCoordinates {
  save: number;
  isHome: boolean;
  box: number;
  index: number;
}

type SaveArray = [
  SAV | undefined,
  SAV | undefined,
  SAV | undefined,
  SAV | undefined
];

const Home = () => {
  const [currentTheme, setCurrentTheme] = useState<OpenHomeTheme>(Themes[0]);
  const [selectedMon, setSelectedMon] = useState<PKM>();
  const [draggingSource, setDraggingSource] = useState<SaveCoordinates>();
  const [draggingDest, setDraggingDest] = useState<SaveCoordinates>();
  const [draggingMon, setDraggingMon] = useState<MonReference>();
  const [box, setBox] = useState(0);
  const [saves, setSaves] = useState<SaveArray>([
    undefined,
    undefined,
    undefined,
    undefined,
  ]);
  const [homeMonMap, setHomeMonMap] = useState<{ [key: string]: OHPKM }>();
  const [changedOHPKMList, setChangedOHPKMList] = useState<OHPKM[]>([]);
  const [deleteFileList, setDeleteFileList] = useState<string[]>([]);
  const [homeData, setHomeData] = useState(new HomeData(new Uint8Array()));

  useEffect(() => {
    if (homeMonMap) {
      console.log('home mon map updated', homeMonMap);
      readBoxData((boxString) => {
        console.log(boxString);
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
    console.log('changedOHPKMList updated', changedOHPKMList);
  }, [changedOHPKMList]);

  useEffect(() => {
    console.log('homedata changed');
    console.log(homeData);
  }, [homeData]);

  useEffect(() => {
    // console.log(draggingSource, draggingDest);
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
    let newData = { ...homeData };
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
      const newSaves: SaveArray = [...saves];
      newSaves[saveNumber] = newSaveData;
      setSaves(newSaves);
    }
  };

  const boxSetDragSource = (coords?: SaveCoordinates) => {
    // if coords are undefined, drag event was cancelled
    if (coords) {
      const sourceSave = coords.isHome ? homeData : saves[coords.save];
      const sourceMon = sourceSave?.boxes[coords.box]?.pokemon[coords.index];
      console.log(sourceMon);
      if (sourceMon) {
        setDraggingMon({
          dexNumber: sourceMon.dexNum,
          formeNumber: sourceMon.formNum,
        });
      } else {
        setDraggingMon(undefined);
      }
      setDraggingSource({
        save: coords.save,
        isHome: false,
        box: coords.box,
        index: coords.index,
      });
    } else {
      setDraggingMon(undefined);
      setDraggingSource(undefined);
    }
  };

  const boxSetDragDest = (coords: SaveCoordinates) => {
    setDraggingMon(undefined);
    setDraggingDest({
      save: coords.save,
      isHome: false,
      box: coords.box,
      index: coords.index,
    });
  };

  const onViewDrop = (e: any, type: string) => {
    const processDroppedData = async (file?: File, droppedMon?: PKM) => {
      let mon: PKM | undefined = droppedMon;
      if (file) {
        let bytes = new Uint8Array(await file.arrayBuffer());
        let [extension] = file.name.split('.').slice(-1);
        extension = extension.toUpperCase();
        if (!acceptableExtensions.includes(extension)) {
          console.log(`invalid extension: ${extension}`);
          return;
        }
        mon = bytesToPKM(bytes, extension);
      }
      if (!mon) return;
      switch (type) {
        case 'as is':
          setSelectedMon(mon);
          break;
        case 'PK4':
          setSelectedMon(new PK4(mon));
          break;
        case 'PK3':
          setSelectedMon(new PK3(mon));
          break;
      }
    };
    let file = e.dataTransfer.files[0];
    let mon;
    if (!file && draggingSource) {
      if (draggingSource.isHome) {
        mon = homeData.boxes[draggingSource.box]?.pokemon[draggingSource.index];
        if (mon && type === 'trash') {
          changeHomeMon(draggingSource.box, draggingSource.index);
          const changedOHPKMListIndex = changedOHPKMList.indexOf(mon);
          console.log('removing at', changedOHPKMListIndex);
          setChangedOHPKMList([
            ...changedOHPKMList.slice(0, changedOHPKMListIndex),
            ...changedOHPKMList.slice(changedOHPKMListIndex + 1),
          ]);
          const identifier = getMonFileIdentifier(mon);
          if (identifier) {
            setDeleteFileList([...deleteFileList, identifier]);
          }
          return;
        }
      } else if (draggingSource.save !== undefined) {
        mon =
          saves[draggingSource.save]?.boxes[draggingSource.box]?.pokemon[
            draggingSource.index
          ];
        if (mon && type === 'trash') {
          changeSaveMon(
            draggingSource.box,
            draggingSource.index,
            draggingSource.save
          );
          if (mon instanceof OHPKM) {
            const identifier = getMonFileIdentifier(mon);
            if (identifier) {
              setDeleteFileList([...deleteFileList, identifier]);
            }
          }
          return;
        }
      }
      setDraggingSource(undefined);
    }
    processDroppedData(file, mon);
    e.nativeEvent.preventDefault();
  };

  const onImportMon = (
    importedMons: PKM[],
    saveIndex: number,
    boxCoords: BoxCoordinates,
    isHome: boolean = false
  ) => {
    const addedMons: OHPKM[] = [];
    let nextIndex = boxCoords.index;
    importedMons.forEach((mon) => {
      const homeMon = new OHPKM(mon);
      if (isHome) {
        while (
          homeData.boxes[boxCoords.box].pokemon[nextIndex] &&
          nextIndex < 120
        ) {
          nextIndex++;
        }
        if (nextIndex < 120) {
          changeHomeMon(boxCoords.box, nextIndex, homeMon);
          addedMons.push(homeMon);
          nextIndex++;
        }
      } else {
        while (
          homeData.boxes[boxCoords.box].pokemon[nextIndex] &&
          nextIndex < 30
        ) {
          nextIndex++;
        }
        if (nextIndex < 30) {
          changeSaveMon(boxCoords.box, nextIndex, saveIndex, homeMon);
          addedMons.push(homeMon);
          nextIndex++;
        }
      }
    });
    setChangedOHPKMList([...changedOHPKMList, ...addedMons]);
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
      console.log(new OHPKM(mon));
      console.log(
        'pid',
        bytesToUint16LittleEndian(mon.bytes, 0x1c).toString(16)
      );
      if (mon) {
        window.electron.ipcRenderer.sendMessage('write-ohpkm', mon.bytes);
      }
    });
    setChangedOHPKMList([]);
  };

  const saveAllSaveFiles = () => {
    saves.forEach((save) => {
      if (
        save instanceof G1SAV ||
        save instanceof G2SAV ||
        save instanceof G3SAV ||
        save instanceof G4SAV
      ) {
        const changedMons = save.prepareBoxesForSaving();
        if (changedMons && (save instanceof G2SAV || save instanceof G1SAV)) {
          updateGen12LookupTable(changedMons);
        } else if (
          changedMons &&
          (save instanceof G3SAV || save instanceof G4SAV)
        ) {
          updateGen34LookupTable(changedMons);
        }
        window.electron.ipcRenderer.sendMessage('write-save-file', {
          path: save.filePath,
          bytes: save.bytes,
        });
      }
    });
  };

  const saveChanges = () => {
    saveAllSaveFiles();
    writeAllHomeData();
    handleDeleteOHPKMFiles(deleteFileList);
    setDeleteFileList([]);
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
          case SaveType.RBY_I:
          case SaveType.GS_I:
          case SaveType.C_I:
            readGen12Lookup((gen12LookupMap) => {
              const newSave = buildSaveFile(path, fileBytes, saveType, {
                homeMonMap,
                gen12LookupMap,
              });
              const newSaves: SaveArray = [...saves];
              newSaves[saveIndex] = newSave;
              setSaves(newSaves);
            });
            return;
          case SaveType.RS:
          case SaveType.E:
          case SaveType.FRLG:
          case SaveType.DP:
          case SaveType.Pt:
          case SaveType.HGSS:
            readGen34Lookup((gen34LookupMap) => {
              const newSave = buildSaveFile(path, fileBytes, saveType, {
                homeMonMap,
                gen34LookupMap,
              });
              const newSaves: SaveArray = [...saves];
              newSaves[saveIndex] = newSave;
              setSaves(newSaves);
            });
            return;
          case SaveType.UNKNOWN:
            return;
          default:
            const newSave = buildSaveFile(path, fileBytes, saveType, {
              homeMonMap,
            });
            const newSaves: SaveArray = [...saves];
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
    console.log(draggingMon);
  }, [draggingMon]);

  useEffect(() => {
    const callback = handleMenuResetAndClose(
      () => console.log('reset'),
      () => setSaves([undefined, undefined, undefined, undefined])
    );
    return () => callback();
  }, [saves]);

  useEffect(() => {
    readHomeData();
    initializeDragImage();
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
        <Button onClick={saveChanges}>Save</Button>
      </div>
      <div style={{ display: 'flex', flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', width: '25%' }}>
          <SaveDisplay
            save={saves[0]}
            saveIndex={0}
            openSave={openSave}
            onImport={onImportMon}
            setDragSource={boxSetDragSource}
            setDragDest={boxSetDragDest}
            disabled={
              draggingMon &&
              saves[0] &&
              isRestricted(
                saves[0].transferRestrictions,
                draggingMon.dexNumber,
                draggingMon.formeNumber
              )
            }
            setSelectedMon={setSelectedMon}
          />
          <SaveDisplay
            save={saves[1]}
            saveIndex={1}
            openSave={openSave}
            onImport={onImportMon}
            setDragSource={boxSetDragSource}
            setDragDest={boxSetDragDest}
            disabled={
              draggingMon &&
              saves[1] &&
              isRestricted(
                saves[1].transferRestrictions,
                draggingMon.dexNumber,
                draggingMon.formeNumber
              )
            }
            setSelectedMon={setSelectedMon}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', width: '50%' }}>
          <HomeBoxDisplay
            box={homeData.boxes[box]}
            setBox={(newBox) => {
              homeData.boxes[box] = newBox;
              setHomeData({ ...homeData });
            }}
            onImport={(mon, index) =>
              onImportMon(mon, -1, { box, index }, true)
            }
            currentTheme={currentTheme}
            setSelectedMon={setSelectedMon}
            setDragSource={(index) => {
              if (index !== undefined) {
                const sourceMon = homeData.boxes[box].pokemon[index];
                if (sourceMon) {
                  setDraggingMon({
                    dexNumber: sourceMon.dexNum,
                    formeNumber: sourceMon.formNum,
                  });
                } else {
                  setDraggingMon(undefined);
                }
              } else {
                setDraggingMon(undefined);
              }
              setDraggingSource(
                index !== undefined
                  ? {
                      save: -1,
                      isHome: true,
                      box,
                      index,
                    }
                  : undefined
              );
            }}
            setDragDest={(index) => {
              setDraggingMon(undefined);
              setDraggingDest({
                save: -1,
                isHome: true,
                box,
                index,
              });
            }}
          />
          <button
            type="button"
            style={{
              width: '100%',
              backgroundColor: '#fff4',
              position: 'relative',
              border: 'none',
              flex: 1,
              borderRadius: 4,
              textAlign: 'center',
            }}
            onClick={() =>
              Object.entries(Gen4ToUTFMap).forEach(([key, value]) => {
                console.log(key, String.fromCharCode(value));
              })
            }
            //   disabled={!mon}
          >
            <div
              style={{
                width: '100%',
                flex: 1,
                padding: 'auto',
              }}
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDrop={(e) => onViewDrop(e, 'trash')}
            >
              TRASH
            </div>
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', width: '25%' }}>
          <SaveDisplay
            save={saves[2]}
            saveIndex={2}
            openSave={openSave}
            onImport={onImportMon}
            setDragSource={boxSetDragSource}
            setDragDest={boxSetDragDest}
            disabled={
              draggingMon &&
              saves[2] &&
              isRestricted(
                saves[2].transferRestrictions,
                draggingMon.dexNumber,
                draggingMon.formeNumber
              )
            }
            setSelectedMon={setSelectedMon}
          />
          <SaveDisplay
            save={saves[3]}
            saveIndex={3}
            openSave={openSave}
            onImport={onImportMon}
            setDragSource={boxSetDragSource}
            setDragDest={boxSetDragDest}
            disabled={
              draggingMon &&
              saves[3] &&
              isRestricted(
                saves[3].transferRestrictions,
                draggingMon.dexNumber,
                draggingMon.formeNumber
              )
            }
            setSelectedMon={setSelectedMon}
          />
        </div>
      </div>
      <Dialog
        open={!!selectedMon}
        onClose={() => setSelectedMon(undefined)}
        fullWidth
        maxWidth="lg"
        PaperProps={{ sx: { height: 400 } }}
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
              e.preventDefault();
            }}
            onDrop={(e) => onViewDrop(e, 'PK3')}
          >
            PK3
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
              e.preventDefault();
            }}
            onDrop={(e) => onViewDrop(e, 'PK4')}
          >
            PK4
          </div>
        </button>
      </div>
    </div>
  ) : (
    <div />
  );
};

export default Home;
