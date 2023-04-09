import { FileOpen } from '@mui/icons-material';
import { Dialog, useTheme } from '@mui/material';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import OpenHomeButton from 'renderer/components/OpenHomeButton';
import { OHPKM, PK3, PK4 } from 'types/PKMTypes';
import { acceptableExtensions, bytesToPKM } from 'util/FileImport';
import { getMonFileIdentifier } from 'util/Lookup';
import { PKM } from '../../types/PKMTypes/PKM';
import { SaveCoordinates } from '../../types/types';
import PokemonDisplay from '../pokemon/PokemonDisplay';
import { useAppDispatch } from '../redux/hooks';
import {
  useDragMon,
  useDragSource,
  useModifiedOHPKMs,
  useSaveFunctions,
  useSaves,
} from '../redux/selectors';
import {
  cancelDrag,
  clearAllSaves,
  deleteMon,
  loadGen12Lookup,
  loadGen345Lookup,
  loadHomeBoxes,
  loadHomeMons,
} from '../redux/slices/appSlice';
import HomeBoxDisplay from '../saves/HomeBoxDisplay';
import SaveDisplay from '../saves/SaveDisplay';
import SaveFileSelector from '../saves/SaveFileSelector';
import { initializeDragImage } from '../util/initializeDragImage';
import {
  handleDeleteOHPKMFiles,
  handleMenuResetAndClose,
  handleMenuSave,
} from '../util/ipcFunctions';
import Themes, { OpenHomeTheme } from './Themes';
import { loadRecentSaves } from 'renderer/redux/slices/recentSavesSlice';
import { loadResourcesPath } from 'renderer/redux/slices/resourcesSlice';

const Home = () => {
  const { palette } = useTheme();
  const saves = useSaves();
  const dragMon = useDragMon();
  const dragSource = useDragSource();
  const modifiedOHPKMs = useModifiedOHPKMs();
  const [loadingMessage, setLoadingMessage] = useState<string | undefined>(
    'Starting app...'
  );
  const [currentTheme] = useState<OpenHomeTheme>(Themes[0]);
  const [selectedMon, setSelectedMon] = useState<PKM>();
  const [tab, setTab] = useState('summary');
  const [openSaveDialog, setOpenSaveDialog] = useState(false);
  const [filesToDelete, setFilesToDelete] = useState<string[]>([]);
  const dispatch = useAppDispatch();
  const dispatchDeleteMon = (saveCoordinates: SaveCoordinates) =>
    dispatch(deleteMon(saveCoordinates));
  const [writeAllSaveFiles, writeAllHomeData] = useSaveFunctions();
  const dispatchClearAllSaves = () => dispatch(clearAllSaves());
  const dispatchCancelDrag = () => dispatch(cancelDrag());

  useEffect(() => {
    console.log(
      'modifiedOHPKMs updated',
      Object.values(modifiedOHPKMs).map((mon) => mon.nickname)
    );
  }, [modifiedOHPKMs]);

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
      if (mon && type === 'release') {
        dispatchDeleteMon(dragSource);
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

  const saveChanges = () => {
    console.log('save changes');
    writeAllSaveFiles();
    writeAllHomeData();
    handleDeleteOHPKMFiles(filesToDelete);
    setFilesToDelete([]);
  };

  // listener for menu save
  useEffect(() => {
    const callback = handleMenuSave(saveChanges);
    return () => callback();
  }, [saveChanges]);

  // listener for menu reset + close
  useEffect(() => {
    const callback = handleMenuResetAndClose(() => {
      dispatch(loadHomeMons()).then(() => dispatch(loadHomeBoxes()));
    }, dispatchClearAllSaves);
    return () => callback();
  }, [saves]);

  // load all data when app starts
  useEffect(() => {
    initializeDragImage();
    Promise.all([
      dispatch(loadHomeMons()).then(() => dispatch(loadHomeBoxes())),
      dispatch(loadGen12Lookup()),
      dispatch(loadGen345Lookup()),
      dispatch(loadRecentSaves()),
      dispatch(loadResourcesPath()),
    ]).then(() => setLoadingMessage(undefined));
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
          onClick={() => setOpenSaveDialog(true)}
        >
          <FileOpen />
          <h2>Open Save</h2>
        </OpenHomeButton>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', width: '50%' }}>
        <HomeBoxDisplay setSelectedMon={setSelectedMon} />
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
            onDrop={(e) => onViewDrop(e, 'release')}
          >
            RELEASE
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
          onClose={() => {
            setOpenSaveDialog(false);
          }}
        />
      </Dialog>
    </div>
  );
};

export default Home;
