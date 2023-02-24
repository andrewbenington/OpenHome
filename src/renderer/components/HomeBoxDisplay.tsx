import { Card, Grid } from '@mui/material';
import _ from 'lodash';
import OHPKM from 'types/PKM/OHPKM';
import { PKM } from 'types/PKM/PKM';
import { useEffect } from 'react';
import { OpenHomeTheme } from 'renderer/Themes';
import { HomeBox, HomeData } from 'types/SAV/HomeData';
import { SAV, BoxCoordinates } from 'types/SAV/SAV';
import PokemonButton from './buttons/PokemonButton';

interface HomeBoxDisplayProps {
  box: HomeBox;
  setBox: (box: HomeBox) => void;
  currentTheme: OpenHomeTheme;
  setSelectedMon: (mon: PKM | undefined) => void;
  onDrag: (index: number) => void;
  onDrop: (index: number) => void;
  onImport: (importedMons: PKM[], index: number) => void;
}

const HomeBoxDisplay = (props: HomeBoxDisplayProps) => {
  const { box, currentTheme, setSelectedMon, onDrag, onDrop, onImport } = props;

  return (
    <Card
      style={{
        borderRadius: 5,
        backgroundColor: currentTheme.contentColor,
        width: '100%',
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
                  onDrop={(importedMons) => {
                    if (importedMons) {
                      onImport(importedMons, row * 12 + rowIndex);
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
