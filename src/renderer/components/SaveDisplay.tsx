import { ArrowBack, ArrowForward } from '@mui/icons-material';
import { Button, Card, Grid } from '@mui/material';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { SaveCoordinates } from 'renderer/Home';
import { PKM } from '../../types/PKMTypes/PKM';
import { BoxCoordinates, SAV } from '../../types/SAV/SAV';
import ArrowButton from './buttons/ArrowButton';
import PokemonButton from './buttons/PokemonButton';

interface SaveDisplayProps {
  save?: SAV;
  saveIndex: number;
  openSave: (saveIndex: number) => void;
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
  const {
    save,
    openSave,
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

  useEffect(() => {
    console.log('box changed to', box);
  }, [box]);
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
                backgroundColor: '#bcb',
                margin: 5,
                width: '80%',
                color: 'white',
                fontWeight: 'bold',
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                {save?.name} ({save?.displayID})
              </div>
            </Card>
            <Card
              style={{
                backgroundColor: disabled ? '#555' : '#bcb',
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
                    style={{ display: 'grid', alignItems: 'center' }}
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
                          <PokemonButton
                            onClick={() => {
                              setSelectedMon(mon);
                              // if (!mon || mon instanceof save.pkmType) {
                              //   setSelectedMon(mon);
                              // } else {
                              //   setSelectedMon(new save.pkmType(mon));
                              // }
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
        <Button
          style={{ width: '100%', height: '50%' }}
          onClick={() => {
            openSave(saveIndex);
            setIsLoading(true);
          }}
        >
          <h2>Open Save File</h2>
        </Button>
      )}
    </div>
  );
};

export default SaveDisplay;
