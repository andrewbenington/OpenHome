import { ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';
import { Button, Card, Grid } from '@mui/material';
import _ from 'lodash';
import { useState } from 'react';
import { SaveCoordinates } from 'renderer/Home';
import { PKM } from '../../PKM/PKM';
import { BoxCoordinates, SAV } from '../../sav/SAV';
import OpenHomeButton from './buttons/OpenHomeButton';
import PokemonButton from './buttons/PokemonButton';

interface SaveDisplayProps {
  save?: SAV;
  saveIndex: number;
  openSave: (saveIndex: number) => void;
  onDrag: (coords: SaveCoordinates) => void;
  onDrop: (coords: SaveCoordinates) => void;
  onImport: (
    importedMon: PKM,
    saveIndex: number,
    boxCoords: BoxCoordinates
  ) => void;
  setSelectedMon: (mon: PKM | undefined) => void;
}

const SaveDisplay = (props: SaveDisplayProps) => {
  const {
    save,
    openSave,
    saveIndex,
    onDrag,
    onDrop,
    onImport,
    setSelectedMon,
  } = props;
  const [box, setBox] = useState(0);

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
              <div style={{ textAlign: 'center' }}>{save?.name}</div>
            </Card>
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
                  {save.boxes[box]?.name}
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
                              if (!mon || mon instanceof save.pkmType) {
                                setSelectedMon(mon);
                              } else {
                                setSelectedMon(new save.pkmType(mon));
                              }
                            }}
                            onDragStart={(e) =>
                              onDrag({
                                save: saveIndex,
                                isHome: false,
                                box,
                                index: row * save.boxColumns + rowIndex,
                              })
                            }
                            mon={mon}
                            zIndex={5 - row}
                            onDrop={(importedMon) => {
                              console.log(importedMon);
                              if (importedMon) {
                                onImport(importedMon, saveIndex, {
                                  box,
                                  index: row * save.boxColumns + rowIndex,
                                });
                              } else {
                                onDrop({
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
        <Button style={{ width: '100%' }} onClick={() => openSave(saveIndex)}>
          <h2>Open Save File</h2>
        </Button>
      )}
    </>
  );
};

export default SaveDisplay;
