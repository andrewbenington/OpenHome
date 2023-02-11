/* eslint-disable no-unused-vars */
import { ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';
import { Card, Grid } from '@mui/material';
import { useEffect, useState } from 'react';
import { pkm } from '../../pkm/pkm';
import { SAV } from '../sav/SAV';
import OpenHomeButton from './buttons/OpenHomeButton';
import PokemonButton from './buttons/PokemonButton';

const _ = require('lodash');

interface BoxDisplayProps {
  setSelectedMon: (mon: pkm | undefined) => void;
  setDraggingMon: (mon: pkm | undefined) => void;
  save: SAV;
}

const BoxDisplay = (props: BoxDisplayProps) => {
  const [box, setBox] = useState(0);
  const { setSelectedMon, setDraggingMon, save } = props;

  useEffect(() => {
    console.log(save?.name);
  }, [save]);

  return (
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
                    <Grid item xs={2} style={{ padding: 2 }}>
                      <PokemonButton
                        onClick={() => setSelectedMon(mon)}
                        onDragStart={() => setDraggingMon(mon)}
                        onDragEnd={() => setDraggingMon(undefined)}
                        mon={mon}
                        zIndex={5 - row}
                        onDropFile={(dropped: pkm) =>
                          console.log(dropped.dexNum)
                        }
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
  );
};

export default BoxDisplay;
