import { ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';
import { Button, Card, Dialog, Grid } from '@mui/material';
import _ from 'lodash';
import OHPKM from 'pkm/OHPKM';
import { getMonFileIdentifier } from 'pkm/util';
import { useEffect, useRef, useState } from 'react';
import { pk3 } from '../../pkm/pk3';
import { pkm } from '../../pkm/pkm';
import { G3SAV } from '../../sav/G3SAV';
import { G5SAV } from '../../sav/G5SAV';
import { HGSSSAV } from '../../sav/HGSSSAV';
import { SAV } from '../../sav/SAV';
import { SaveType } from '../types/types';
import OpenHomeButton from './buttons/OpenHomeButton';
import PokemonButton from './buttons/PokemonButton';

interface SaveDisplayProps {
  setSelectedMon: (mon: pkm | undefined) => void;
  setDraggingMon: (mon: pkm | undefined) => void;
  draggingMon: pkm | undefined;
  setOnSaveListener: (listener: () => void) => void;
  homeMonMap: { [key: string]: OHPKM };
  
}

const SaveDisplay = (props: SaveDisplayProps) => {
  const {
    setSelectedMon,
    setDraggingMon,
    draggingMon,
    setOnSaveListener,
    homeMonMap,
  } = props;
  const [save, setSave] = useState<SAV>();
  const saveRef = useRef<SAV>();
  const savePathRef = useRef<string>();
  const [box, setBox] = useState(0);
  const [bytes, setBytes] = useState<Uint8Array>();
  const [saveType, setSaveType] = useState<SaveType>();
  const [filePath, setFilePath] = useState<string>();
  const [generationSelect, setGenerationSelect] = useState<string>();

  const onSaveListener = () => {
    console.log('onSaveListener called', save, saveRef.current);
    if (saveRef.current && saveRef.current instanceof G3SAV) {
      saveRef.current.prepareBoxesForSaving();
      window.electron.ipcRenderer.sendMessage('write-save-file', {
        path: savePathRef.current,
        bytes: saveRef.current?.bytes,
      });
    }
  };

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  useEffect(() => {
    savePathRef.current = filePath;
  }, [filePath]);

  const buildSaveFile = (filePath: string, fileBytes: Uint8Array): SAV | undefined => {
    console.log(fileBytes.length);
    let saveFile;
    console.log(homeMonMap);
    switch (fileBytes.length) {
      case 131072:
        saveFile = new G3SAV(filePath, fileBytes);
        saveFile.boxes.forEach((box) => {
          box.pokemon.forEach((mon, monIndex) => {
            if (mon) {
              const identifier = getMonFileIdentifier(mon);
              if (identifier) {
                console.log(identifier.slice(0, identifier.length - 3));
                const result = Object.entries(homeMonMap).find(
                  (entry) =>
                    entry[0].slice(0, entry[0].length - 3) ==
                    identifier.slice(0, identifier.length - 3)
                );
                if (result) {
                  console.log('home mon found:', result[1]);
                  box.pokemon[monIndex] = result[1];
                }
              }
            }
          });
        });
        setSaveType(saveFile.saveType);
        setSave(saveFile);
        console.log(saveFile);
        return saveFile;
      case 131088:
        saveFile = new G3SAV(filePath, fileBytes);
        saveFile.boxes.forEach((box) => {
          box.pokemon.forEach((mon, monIndex) => {
            if (mon) {
              const identifier = getMonFileIdentifier(mon);
              if (identifier) {
                // console.log(identifier.slice(0, identifier.length - 3))
                const result = Object.entries(homeMonMap).find(
                  (entry) =>
                    entry[0].slice(0, entry[0].length - 3) ==
                    identifier.slice(0, identifier.length - 3)
                );
                if (result) {
                  console.log('home mon found:', result[1]);
                  box.pokemon[monIndex] = result[1];
                }
              }
            }
          });
        });
        setSaveType(saveFile.saveType);
        setSave(saveFile);
        console.log(saveFile);
        return saveFile;
      case 524288:
        setFilePath(filePath);
        setGenerationSelect('45');
        setBytes(fileBytes);
        return undefined;
    }
  };

  const onGameSelect = (saveType: SaveType) => {
    if (bytes && filePath) {
      switch (saveType) {
        case SaveType.HGSS:
          setSave(new HGSSSAV(filePath, bytes));
          setSaveType(SaveType.HGSS);
          break;
        case SaveType.G5:
          setSave(new G5SAV(filePath, bytes));
          setSaveType(SaveType.G5);
          break;
      }
      setGenerationSelect(undefined);
      setBytes(undefined);
    }
  };

  return (
    <>
      {save ? (
        <div style={{ display: 'flex' }}>
          <div
            style={{
              width: '100%',
              margin: 5,
            }}
          >
            <Card
              style={{
                backgroundColor: '#bcb',
                margin: 5,
                width: '80%',
                color: 'white',
                fontWeight: 'bold',
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              <Grid container>
                <Grid xs={2} style={{ display: 'grid', alignItems: 'center' }}>
                  <OpenHomeButton
                    style={{
                      borderRadius: 0,
                    }}
                    onClick={() =>
                      setBox(box > 0 ? box - 1 : save.boxes.length - 1)
                    }
                  >
                    <ArrowBackIos style={{ width: 12, height: 12 }} />
                  </OpenHomeButton>
                </Grid>
                <Grid xs={8} style={{ textAlign: 'center' }}>
                  {save.boxes[box].name}
                </Grid>
                <Grid xs={2} style={{ display: 'grid', alignItems: 'center' }}>
                  <OpenHomeButton
                    onClick={() => setBox((box + 1) % save.boxes.length)}
                    style={{ borderRadius: 0 }}
                  >
                    <ArrowForwardIos style={{ width: 12, height: 12 }} />
                  </OpenHomeButton>
                </Grid>
              </Grid>
            </Card>
            <Card
              style={{
                backgroundColor: '#bcb',
                padding: 5,
                margin: 10,
              }}
            >
              <div>
                {_.range(5).map((row: number) => (
                  <Grid container key={`pc_row_${row}`}>
                    {_.range(6).map((rowIndex: number) => {
                      const mon = save.boxes[box].pokemon[row * 6 + rowIndex];
                      return (
                        <Grid
                          key={`pc_row_${row}_slot_${rowIndex}`}
                          item
                          xs={2}
                          style={{ padding: '2px 2px 0px 2px' }}
                        >
                          <PokemonButton
                            onClick={() => setSelectedMon(mon)}
                            onDragStart={(e) => setDraggingMon(mon)}
                            onDragEnd={(e) => {
                              if (e.dataTransfer.dropEffect === 'copy') {
                                save.boxes[box].pokemon[row * 6 + rowIndex] =
                                  undefined;
                                save.changedMons.push({
                                  box,
                                  index: row * 6 + rowIndex,
                                });
                                setSave(save);
                              }
                              setDraggingMon(undefined);
                            }}
                            mon={mon}
                            zIndex={5 - row}
                            onDrop={(importedMon) => {
                              const monData = importedMon ?? draggingMon;
                              console.log(monData, saveType);
                              if (saveType !== undefined && monData) {
                                save.boxes[box].pokemon[row * 6 + rowIndex] =
                                  monData;
                                save.changedMons.push({
                                  box,
                                  index: row * 6 + rowIndex,
                                });
                                setSave(save);
                              }
                            }}
                          />
                        </Grid>
                      );
                    })}
                  </Grid>
                ))}
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <Button
          style={{ width: '100%' }}
          onClick={() => {
            window.electron.ipcRenderer.once(
              'save-file-read',
              (result: any) => {
                const { path, fileBytes } = result;
                setOnSaveListener(onSaveListener);
                if (path && fileBytes) {
                  buildSaveFile(path, fileBytes);
                }
              }
            );
            window.electron.ipcRenderer.sendMessage('read-save-file');
            // openFileSelector();
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
        <div style={{ display: 'flex' }}>
          {generationSelectOptions[generationSelect ?? '']?.map((option) => (
            <OpenHomeButton
              key={`${option} button`}
              style={{ width: 200, height: 100, margin: 10 }}
              onClick={() => onGameSelect(option)}
            >
              {option}
            </OpenHomeButton>
          ))}
        </div>
      </Dialog>
    </>
  );
};

const generationSelectOptions: { [key: string]: SaveType[] } = {
  '3': [SaveType.RS, SaveType.E, SaveType.FRLG],
  '45': [SaveType.DPPt, SaveType.HGSS, SaveType.G5],
};

export default SaveDisplay;
