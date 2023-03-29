import { FileOpen } from '@mui/icons-material';
import { Dialog, useTheme } from '@mui/material';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import OpenHomeButton from 'renderer/components/OpenHomeButton';
import { OHPKM, PK3, PK4 } from 'types/PKMTypes';
import { BoxCoordinates, SAV } from 'types/SAVTypes';
import { buildSaveFile, getSaveType } from 'types/SAVTypes/util';
import { acceptableExtensions, bytesToPKM } from 'util/FileImport';
import { getMonFileIdentifier } from 'util/Lookup';
import { PKM } from '../../types/PKMTypes/PKM';
import { HomeData } from '../../types/SAVTypes/HomeData';
import { SaveCoordinates, SaveType } from '../../types/types';
import PokemonDisplay from '../pokemon/PokemonDisplay';
import { useAppDispatch } from '../redux/hooks';
import {
  useDragMon,
  useDragSource,
  useHomeData,
  useModifiedOHPKMs,
  useSaveFunctions,
  useSaves,
} from '../redux/selectors';
import {
  addSave,
  cancelDrag,
  clearAllSaves,
  completeDrag,
  setHomeData,
  setSaveMon,
  startDrag,
  writeAllSaveFiles,
} from '../redux/slices/appSlice';
import HomeBoxDisplay from '../saves/HomeBoxDisplay';
import SaveDisplay from '../saves/SaveDisplay';
import SaveFileSelector from '../saves/SaveFileSelector';
import { initializeDragImage } from '../util/initializeDragImage';
import {
  addSaveToRecents,
  handleDeleteOHPKMFiles,
  handleMenuResetAndClose,
  handleMenuSave,
  readBoxData,
  readGen12Lookup,
  readGen345Lookup,
} from '../util/ipcFunctions';
import Themes, { OpenHomeTheme } from './Themes';

const Home = () => {
  const { palette } = useTheme();
  const saves = useSaves();
  const homeData = useHomeData();
  const dragMon = useDragMon();
  const dragSource = useDragSource();
  const modifiedOHPKMs = useModifiedOHPKMs();
  const [loadingMessage, setLoadingMessage] = useState<string | undefined>(
    'Starting app...'
  );
  const [currentTheme, setCurrentTheme] = useState<OpenHomeTheme>(Themes[0]);
  const [selectedMon, setSelectedMon] = useState<PKM>();
  const [box, setBox] = useState(0);
  const [tab, setTab] = useState('summary');
  const [openSaveDialog, setOpenSaveDialog] = useState(false);
  const [homeMonMap, setHomeMonMap] = useState<{ [key: string]: OHPKM }>();
  const [changedOHPKMList, setChangedOHPKMList] = useState<OHPKM[]>([]);
  const [filesToDelete, setFilesToDelete] = useState<string[]>([]);
  const dispatch = useAppDispatch();
  const dispatchSetHomeData = (data: HomeData) => dispatch(setHomeData(data));
  const dispatchSetSaveMon = (
    mon: PKM | undefined,
    saveCoordinates: SaveCoordinates
  ) => dispatch(setSaveMon({ mon, saveCoordinates }));
  const [writeAllSaveFiles, writeAllHomeData] = useSaveFunctions();
  const dispatchAddSave = (save: SAV) => dispatch(addSave(save));
  const dispatchClearAllSaves = () => dispatch(clearAllSaves());
  const dispatchStartDrag = (source: SaveCoordinates) =>
    dispatch(startDrag(source));
  const dispatchCancelDrag = () => dispatch(cancelDrag());
  const dispatchCompleteDrag = (dest: SaveCoordinates) =>
    dispatch(completeDrag(dest));

  const updateBoxData = () => {
    if (homeMonMap) {
      console.log('home mon map updated', homeMonMap);
      readBoxData((boxString) => {
        // box file just stores references, so we need to populate them from the map
        const newBox = homeData.boxes[0];
        newBox.clear();
        newBox.getMonsFromString(boxString, homeMonMap);
        const newData = new HomeData(new Uint8Array());
        Object.assign(newData, homeData);
        newData.boxes[0] = newBox;
        dispatchSetHomeData(newData);
      });
    }
  };

  useEffect(() => {
    console.log(
      'modifiedOHPKMs updated',
      modifiedOHPKMs.map((mon) => mon.nickname)
    );
  }, [modifiedOHPKMs]);

  const markMonsAsChanged = (changedMons: OHPKM[]) => {
    setChangedOHPKMList([...changedOHPKMList, ...changedMons]);
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
    let mon = dragMon;
    if (!file && dragSource) {
      if (mon && type === 'trash') {
        dispatchSetSaveMon(undefined, dragSource);
        dispatchCancelDrag();
        if (mon instanceof OHPKM) {
          const identifier = getMonFileIdentifier(mon);
          if (identifier) {
            setFilesToDelete([...filesToDelete, identifier]);
          }
        }
      }
      processDroppedData(file, mon);
      e.nativeEvent.preventDefault();
    }
  };

  // const onImportMon = (
  //   importedMons: PKM[],
  //   saveIndex: number,
  //   boxCoords: BoxCoordinates,
  //   isHome: boolean = false
  // ) => {
  //   const addedMons: OHPKM[] = [];
  //   let nextIndex = boxCoords.index;
  //   importedMons.forEach((mon) => {
  //     const homeMon = new OHPKM(mon);
  //     if (isHome) {
  //       while (
  //         homeData.boxes[boxCoords.box].pokemon[nextIndex] &&
  //         nextIndex < 120
  //       ) {
  //         nextIndex++;
  //       }
  //       if (nextIndex < 120) {
  //         setHomeMon(boxCoords.box, nextIndex, homeMon);
  //         addedMons.push(homeMon);
  //         nextIndex++;
  //       }
  //     } else {
  //       while (
  //         homeData.boxes[boxCoords.box].pokemon[nextIndex] &&
  //         nextIndex < 30
  //       ) {
  //         nextIndex++;
  //       }
  //       if (nextIndex < 30) {
  //         setSaveMon(boxCoords.box, nextIndex, saveIndex, homeMon);
  //         addedMons.push(homeMon);
  //         nextIndex++;
  //       }
  //     }
  //   });
  //   markMonsAsChanged(addedMons);
  // };

  const saveChanges = () => {
    console.log('save changes');
    writeAllSaveFiles();
    writeAllHomeData();
    handleDeleteOHPKMFiles(filesToDelete);
    setFilesToDelete([]);
  };

  useEffect(() => {
    updateBoxData();
  }, [homeMonMap]);

  const readHomeData = async () => {
    setChangedOHPKMList([]);
    window.electron.ipcRenderer.once(
      'home-data-read',
      (byteMap: { [key: string]: Uint8Array }) => {
        const monMap: { [key: string]: OHPKM } = {};
        Object.entries(byteMap).forEach(([id, bytes]) => {
          monMap[id] = new OHPKM(bytes);
        });
        setHomeMonMap(monMap);
        setLoadingMessage(undefined);
      }
    );
    window.electron.ipcRenderer.sendMessage('read-home-data', 'fake');
  };

  const onOpenSave = (newSave: SAV) => {
    const changedMons: OHPKM[] = [];
    newSave.changedMons.forEach(({ box, index }) => {
      const mon = newSave.boxes[box].pokemon[index];
      if (mon instanceof OHPKM) {
        changedMons.push(mon);
      }
    });
    addSaveToRecents(newSave.getSaveRef());
    markMonsAsChanged(changedMons);
    dispatchAddSave(newSave);
  };

  const openSave = async () => {
    window.electron.ipcRenderer.once('save-file-read', (result: any) => {
      const { path, fileBytes, createdDate } = result;
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
                fileCreatedDate: createdDate,
              });
              if (newSave) onOpenSave(newSave);
            });
            return;
          case SaveType.RS:
          case SaveType.E:
          case SaveType.FRLG:
          case SaveType.DP:
          case SaveType.Pt:
          case SaveType.HGSS:
            readGen345Lookup((gen345LookupMap) => {
              const newSave = buildSaveFile(path, fileBytes, saveType, {
                homeMonMap,
                gen345LookupMap,
                fileCreatedDate: createdDate,
              });
              if (newSave) onOpenSave(newSave);
            });
            return;
          case SaveType.UNKNOWN:
            return;
          default:
            const newSave = buildSaveFile(path, fileBytes, saveType, {
              homeMonMap,
              fileCreatedDate: createdDate,
            });
            if (newSave) onOpenSave(newSave);
        }
      }
    });
    setOpenSaveDialog(true);
  };

  // necessary to update save function called by top menu
  useEffect(() => {
    const callback = handleMenuSave(saveChanges);
    return () => callback();
  }, [saveChanges]);

  useEffect(() => {
    const callback = handleMenuResetAndClose(
      () => readHomeData(),
      dispatchClearAllSaves
    );
    return () => callback();
  }, [saves]);

  useEffect(() => {
    readHomeData();
    initializeDragImage();
  }, []);

  return loadingMessage ? (
    <div>{loadingMessage}</div>
  ) : (
    <div
      style={{
        backgroundColor: currentTheme.backgroundColor,
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
      }}
    >
      <div
        className="scroll-no-bar"
        style={{
          width: '25%',
          overflow: 'scroll',
        }}
      >
        {_.range(saves.length).map((i) => (
          <SaveDisplay saveIndex={i} setSelectedMon={setSelectedMon} />
        ))}
        <OpenHomeButton
          style={{
            margin: 'auto',
            backgroundColor: palette.secondary.light,
            color: palette.text.secondary,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
          }}
          onClick={() => {
            openSave();
          }}
        >
          <FileOpen />
          <h2>Open Save</h2>
        </OpenHomeButton>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', width: '50%' }}>
        <HomeBoxDisplay
          box={homeData.boxes[box]}
          setBox={(newBox) => {
            homeData.boxes[box] = newBox;
            dispatchSetHomeData({ ...homeData });
          }}
          onImport={(mon, index) => {}}
          //   onImportMon(mon, -1, { box, index }, true)
          // }
          setSelectedMon={setSelectedMon}
          setDragSource={(index) => {
            if (index) {
              dispatchStartDrag({
                saveNumber: -1,
                box,
                index,
              });
            }
          }}
          setDragDest={(index) => {
            dispatchCompleteDrag({
              saveNumber: -1,
              box,
              index,
            });
          }}
        />
      </div>
      <div style={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
        <button
          type="button"
          style={{
            margin: 10,
            height: 'calc(100% - 40px)',
            flex: 1,
            backgroundColor: '#fff4',
            position: 'relative',
            border: 'none',
            borderRadius: 4,
            textAlign: 'center',
          }}
        >
          <div
            draggable
            style={{
              height: '100%',
              width: '100%',
              flex: 1,
              padding: 'auto',
            }}
            onDragOver={(e) => {
              e.preventDefault();
            }}
            // onDrop={(e) => onViewDrop(e, 'as is')}
          >
            Preview
          </div>
        </button>
        <button
          type="button"
          style={{
            margin: 10,
            height: 'calc(100% - 40px)',
            backgroundColor: '#fff4',
            position: 'relative',
            border: 'none',
            flex: 1,
            borderRadius: 4,
            textAlign: 'center',
          }}
          onClick={() => {}}
          //   disabled={!mon}
        >
          <div
            style={{
              height: '100%',
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
      <Dialog
        open={!!selectedMon}
        onClose={() => setSelectedMon(undefined)}
        fullWidth
        maxWidth="lg"
        PaperProps={{ sx: { height: 400 } }}
      >
        {selectedMon && (
          <PokemonDisplay
            mon={selectedMon}
            updateMon={() => {}}
            tab={tab}
            setTab={setTab}
          />
        )}
      </Dialog>
      <Dialog
        open={openSaveDialog}
        onClose={() => setOpenSaveDialog(false)}
        fullWidth
        maxWidth="lg"
        PaperProps={{ sx: { height: 400 } }}
      >
        <SaveFileSelector
          onSelectFile={(filePath) => {
            window.electron.ipcRenderer.sendMessage('read-save-file', [
              filePath,
            ]);
            setOpenSaveDialog(false);
          }}
          onImportSave={() => {
            window.electron.ipcRenderer.sendMessage('read-save-file');
            setOpenSaveDialog(false);
          }}
        />
      </Dialog>
    </div>
  );
};

export default Home;
