import { FileOpen } from '@mui/icons-material';
import { Dialog, useTheme } from '@mui/material';
import { POKEMON_DATA } from 'consts';
import _ from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import OpenHomeButton from 'renderer/components/OpenHomeButton';
import { loadRecentSaves } from 'renderer/redux/slices/recentSavesSlice';
import { loadResourcesPath } from 'renderer/redux/slices/resourcesSlice';
import { OHPKM } from 'types/PKMTypes';
import { acceptableExtensions, bytesToPKM } from 'util/FileImport';
import { getMonFileIdentifier } from 'util/Lookup';
import { PKM } from '../../types/PKMTypes/PKM';
import { SaveCoordinates } from '../../types/types';
import BoxIcons from '../images/icons/BoxIcons.png';
import PokemonDisplay from '../pokemon/PokemonDisplay';
import { useAppDispatch } from '../redux/hooks';
import {
  useDragMon,
  useDragSource,
  useHomeData,
  useModifiedOHPKMs,
  useMonsToDelete,
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
import { dropAreaStyle } from './styles';

const Home = () => {
  const { palette } = useTheme();
  const saves = useSaves();
  const homeData = useHomeData();
  const dragMon = useDragMon();
  const dragSource = useDragSource();
  const modifiedOHPKMs = useModifiedOHPKMs();
  const monsToDelete = useMonsToDelete();
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
  const dispatchClearAllSaves = useCallback(
    () => dispatch(clearAllSaves()),
    [dispatch]
  );
  const dispatchCancelDrag = () => dispatch(cancelDrag());

  useEffect(() => {
    console.info(
      'modifiedOHPKMs updated',
      Object.values(modifiedOHPKMs).map((mon) => mon.nickname)
    );
  }, [modifiedOHPKMs]);

  useEffect(() => {
    const edited =
      homeData.updatedBoxSlots.length > 0 ||
      !saves.every((save) => save.updatedBoxSlots.length === 0);
    window.electron.ipcRenderer.invoke('set-document-edited', edited);
  }, [saves, homeData]);

  const onViewDrop = (e: any, type: string) => {
    const processDroppedData = async (file?: File, droppedMon?: PKM) => {
      let mon: PKM | undefined = droppedMon;
      if (file) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        let [extension] = file.name.split('.').slice(-1);
        extension = extension.toUpperCase();
        if (!acceptableExtensions.includes(extension)) {
          console.error(`invalid extension: ${extension}`);
          return;
        }
        mon = bytesToPKM(bytes, extension);
      }
      if (!mon) return;
      switch (type) {
        case 'as is':
          setSelectedMon(mon);
          break;
      }
    };
    const file = e.dataTransfer.files[0];
    const mon = dragMon;
    if (!file && dragSource) {
      if (mon && type === 'release') {
        dispatchDeleteMon(dragSource);
        if (mon instanceof OHPKM) {
          const identifier = getMonFileIdentifier(mon);
          if (identifier) {
            setFilesToDelete([...filesToDelete, identifier]);
          }
        }
      }
      dispatchCancelDrag();
      processDroppedData(file, mon);
      e.nativeEvent.preventDefault();
    } else if (file) {
      processDroppedData(file, undefined);
    }
  };

  const saveChanges = useCallback(() => {
    writeAllSaveFiles();
    writeAllHomeData();
    handleDeleteOHPKMFiles(filesToDelete);
    setFilesToDelete([]);
  }, [filesToDelete, writeAllHomeData, writeAllSaveFiles]);

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
  }, [dispatch, dispatchClearAllSaves, saves]);

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
  }, [dispatch]);

  return loadingMessage ? (
    <div>{loadingMessage}</div>
  ) : (
    <div
      style={{
        backgroundColor: currentTheme.backgroundColor,
        height: 'calc(100% - 10px)',
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        paddingTop: 10,
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
      <button type="button" style={dropAreaStyle}>
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
          onDrop={(e) => onViewDrop(e, 'as is')}
        >
          Preview
        </div>
      </button>
      <button
        type="button"
        style={dropAreaStyle}
        onClick={() => {}}
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
          onDrop={(e) => onViewDrop(e, 'release')}
        >
          RELEASE
        </div>
        <div
          style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}
        >
          {monsToDelete.map((mon) => {
            if (mon.isEgg || !POKEMON_DATA[mon.dexNum]) {
              return '0% 0%';
            }
            const [x, y] =
              POKEMON_DATA[mon.dexNum].formes[mon.formNum].spriteIndex;
            const backgroundPosition = `${(x / 35) * 100}% ${(y / 36) * 100}%`;
            return (
              <div
                style={{
                  background: `url(${BoxIcons}) no-repeat 0.02777% 0.02777%`,
                  backgroundSize: '3600%',
                  backgroundPosition,
                  imageRendering: 'crisp-edges',
                  height: '10%',
                  aspectRatio: 1,
                  zIndex: 100,
                }}
              />
            );
          })}
        </div>
      </button>
      <Dialog
        open={!!selectedMon}
        onClose={() => setSelectedMon(undefined)}
        fullWidth
        PaperProps={{ sx: { height: 400 } }}
      >
        {selectedMon && (
          <PokemonDisplay mon={selectedMon} tab={tab} setTab={setTab} />
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
