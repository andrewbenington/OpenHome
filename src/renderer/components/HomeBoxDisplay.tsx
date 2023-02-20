import { Card, Grid } from '@mui/material';
import _ from 'lodash';
import OHPKM from 'pkm/OHPKM';
import { pkm } from 'pkm/pkm';
import { useEffect } from 'react';
import { OpenHomeTheme } from 'renderer/Themes';
import { HomeBox, HomeData } from 'sav/HomeData';
import { SAV, BoxCoordinates } from 'sav/SAV';
import PokemonButton from './buttons/PokemonButton';

interface HomeBoxDisplayProps {
  box: HomeBox;
  setBox: (box: HomeBox) => void;
  currentTheme: OpenHomeTheme;
  setSelectedMon: (mon: pkm | undefined) => void;
  onDrag: (index: number) => void;
  onDrop: (index: number) => void;
}

const HomeBoxDisplay = (props: HomeBoxDisplayProps) => {
  const { box, setBox, currentTheme, setSelectedMon, onDrag, onDrop } = props;
  useEffect(() => {
    console.log(box);
  }, [box]);
  
  return (
    <Card
      style={{
        borderRadius: 5,
        backgroundColor: currentTheme.contentColor,
        width: '50%',
        height: 'fit-content',
      }}
    >
      {_.range(10).map((row: number) => (
        <Grid container key={`pc_row_${row}`}>
          {_.range(12).map((rowIndex: number) => {
            const mon = box.pokemon[row * 12 + rowIndex];
            const currentBox = 0;
            return (
              <Grid item xs={1} style={{ padding: '2px 2px 0px 2px' }}>
                <PokemonButton
                  onClick={() => setSelectedMon(mon)}
                  onDragStart={() => onDrag(row * 12 + rowIndex)}
                  mon={mon}
                  zIndex={10 - row}
                  onDrop={(importedMon) => {
                    if (importedMon) {
                      console.log(importedMon);
                      const homeMon = new OHPKM(importedMon);
                      box.pokemon[row * 12 + rowIndex] = homeMon;
                      setBox(box);
                    } else {
                      onDrop(row * 12 + rowIndex);
                    }
                  }}
                />
              </Grid>
            );
          })}
        </Grid>
      ))}
    </Card>
  );
};

export default HomeBoxDisplay;
