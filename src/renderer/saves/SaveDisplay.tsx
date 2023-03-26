import { ArrowBack, ArrowForward, Close, FileOpen } from '@mui/icons-material';
import { Card, Grid, useTheme } from '@mui/material';
import { GameOfOriginData } from 'consts';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { SaveCoordinates } from 'renderer/app/Home';
import { getSaveTypeString } from 'types/types';
import { PKM } from '../../types/PKMTypes/PKM';
import { BoxCoordinates, SAV } from '../../types/SAVTypes/SAV';
import ArrowButton from './ArrowButton';
import OpenHomeButton from 'renderer/components/OpenHomeButton';
import BoxCell from './BoxCell';

interface SaveDisplayProps {
  save?: SAV;
  saveIndex: number;
  openSave: (saveIndex: number) => void;
  closeSave: () => void;
  setDragSource: (coords?: SaveCoordinates) => void;
  setDragDest: (coords: SaveCoordinates) => void;
  onImport: (
    importedMon: PKM[],
    saveIndex: number,
    boxCoords: BoxCoordinates
  ) => void;
  setSelectedMon: (mon: PKM | undefined) => void;
  disabled?: boolean;
}

const SaveDisplay = (props: SaveDisplayProps) => {
  const { palette } = useTheme();
  const {
    save,
    openSave,
    closeSave,
    saveIndex,
    setDragSource,
    setDragDest,
    onImport,
    setSelectedMon,
    disabled,
  } = { disabled: false, ...props };
  const [box, setBox] = useState<number>();
  const [isloading, setIsLoading] = useState(false);

  useEffect(() => {
    setBox(save?.currentPCBox ?? 0);
    setIsLoading(false);
  }, [save]);

  return (
    <div style={{ flex: 1 }}>
      {save && box !== undefined && !isloading ? (
        <div style={{ display: 'flex' }}>
          <div
            style={{
              width: '100%',
              margin: 5,
            }}
          >
            <Card
              style={{
                display: 'flex',
                flexDirection: 'row',
                marginLeft: 10,
                marginRight: 10,
                backgroundColor: palette.secondary.main,
              }}
            >
              <OpenHomeButton
                style={{
                  color: !!save.changedMons.length
                    ? palette.text.disabled
                    : palette.text.secondary,
                  fontWeight: 'bold',
                  backgroundColor: palette.secondary.main,
                }}
                onClick={closeSave}
                disabled={!!save.changedMons.length}
              >
                <Close style={{}} />
              </OpenHomeButton>
              <div
                style={{
                  flex: 1,
                  color: 'white',
                  fontWeight: 'bold',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  {save.origin
                    ? `Pokémon ${GameOfOriginData[save.origin]?.name}`
                    : getSaveTypeString(save.saveType)}
                </div>
                <div style={{ textAlign: 'center' }}>
                  {save?.name} ({save?.displayID})
                </div>
              </div>
            </Card>
            <Card
              style={{
                backgroundColor: disabled ? '#555' : palette.secondary.main,
                padding: 5,
                margin: 10,
              }}
            >
              <div>
                <Grid container>
                  <Grid
                    xs={2}
                    style={{ display: 'grid', alignItems: 'center' }}
                  >
                    <ArrowButton
                      onClick={() =>
                        setBox(box > 0 ? box - 1 : save.boxes.length - 1)
                      }
                    >
                      <ArrowBack fontSize="small" />
                    </ArrowButton>
                  </Grid>
                  <Grid xs={8} style={{ textAlign: 'center', color: 'white' }}>
                    {save.boxes[box]?.name}
                  </Grid>
                  <Grid
                    xs={2}
                    style={{
                      display: 'grid',
                      alignItems: 'center',
                    }}
                  >
                    <ArrowButton
                      onClick={() => setBox((box + 1) % save.boxes.length)}
                    >
                      <ArrowForward fontSize="small" />
                    </ArrowButton>
                  </Grid>
                </Grid>
                {_.range(save.boxRows).map((row: number) => (
                  <Grid container key={`pc_row_${row}`}>
                    {_.range(save.boxColumns).map((rowIndex: number) => {
                      const mon =
                        save.boxes[box].pokemon[
                          row * save.boxColumns + rowIndex
                        ];
                      return (
                        <Grid
                          key={`pc_row_${row}_slot_${rowIndex}`}
                          item
                          xs={12 / save.boxColumns}
                          style={{ padding: '2px 2px 0px 2px' }}
                        >
                          <BoxCell
                            onClick={() => {
                              setSelectedMon(mon);
                            }}
                            onDragEvent={(cancelled: boolean) => {
                              console.log(
                                'button drag event cancelled =',
                                cancelled
                              );
                              setDragSource(
                                cancelled
                                  ? undefined
                                  : {
                                      save: saveIndex,
                                      isHome: false,
                                      box,
                                      index: row * save.boxColumns + rowIndex,
                                    }
                              );
                            }}
                            disabled={disabled}
                            mon={mon}
                            zIndex={5 - row}
                            onDrop={(importedMons) => {
                              if (importedMons) {
                                onImport(importedMons, saveIndex, {
                                  box,
                                  index: row * save.boxColumns + rowIndex,
                                });
                              } else {
                                setDragDest({
                                  save: saveIndex,
                                  isHome: false,
                                  box,
                                  index: row * save.boxColumns + rowIndex,
                                });
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
            openSave(saveIndex);
            setIsLoading(true);
          }}
        >
          <FileOpen />
          <h2>Open Save</h2>
        </OpenHomeButton>
      )}
    </div>
  );
};

export default SaveDisplay;
