import { Card, Grid, useTheme } from '@mui/material';
import _ from 'lodash';
import { useAppDispatch } from 'renderer/redux/hooks';
import { useHomeData } from 'renderer/redux/selectors';
import {
  completeDrag,
  importMons,
  startDrag,
} from 'renderer/redux/slices/appSlice';
import { PKM } from 'types/PKMTypes/PKM';
import { SaveCoordinates } from 'types/types';
import BoxCell from './BoxCell';

interface HomeBoxDisplayProps {
  setSelectedMon: (mon: PKM | undefined) => void;
}

const HomeBoxDisplay = (props: HomeBoxDisplayProps) => {
  const data = useHomeData();
  const theme = useTheme();
  const { setSelectedMon } = props;

  const dispatch = useAppDispatch();
  const dispatchStartDrag = (source: SaveCoordinates) =>
    dispatch(startDrag(source));
  const dispatchCompleteDrag = (dest: SaveCoordinates) =>
    dispatch(completeDrag(dest));
  const dispatchImportMons = (mons: PKM[], saveCoordinates: SaveCoordinates) =>
    dispatch(importMons({ mons, saveCoordinates }));

  return (
    <Card
      style={{
        borderRadius: 5,
        backgroundColor: theme.palette.secondary.main,
        width: '100%',
        height: 'fit-content',
      }}
    >
      {_.range(10).map((row: number) => (
        <Grid container key={`pc_row_${row}`}>
          {_.range(12).map((rowIndex: number) => {
            const mon =
              data.boxes[data.currentPCBox].pokemon[row * 12 + rowIndex];
            return (
              <Grid item xs={1} style={{ padding: '2px 2px 0px 2px' }}>
                <BoxCell
                  onClick={() => setSelectedMon(mon)}
                  onDragEvent={(cancelled) =>
                    dispatchStartDrag({
                      saveNumber: -1,
                      box: data.currentPCBox,
                      index: row * 12 + rowIndex,
                    })
                  }
                  mon={mon}
                  zIndex={10 - row}
                  onDrop={(importedMons) => {
                    if (importedMons) {
                      dispatchImportMons(importedMons, {
                        saveNumber: -1,
                        box: data.currentPCBox,
                        index: row * 12 + rowIndex,
                      });
                    } else {
                      dispatchCompleteDrag({
                        saveNumber: -1,
                        box: data.currentPCBox,
                        index: row * 12 + rowIndex,
                      });
                    }
                  }}
                  disabled={false}
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
