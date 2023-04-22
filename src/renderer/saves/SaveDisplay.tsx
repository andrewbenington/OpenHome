import { ArrowBack, ArrowForward, Close } from '@mui/icons-material';
import { Card, Grid, useTheme } from '@mui/material';
import { GameOfOriginData } from 'consts';
import _ from 'lodash';
import { useMemo } from 'react';
import OpenHomeButton from 'renderer/components/OpenHomeButton';
import { useAppDispatch } from 'renderer/redux/hooks';
import { useDragMon, useSaves } from 'renderer/redux/selectors';
import {
  completeDrag,
  importMons,
  removeSaveAt,
  setSaveBox,
  startDrag,
} from 'renderer/redux/slices/appSlice';
import { SaveCoordinates, getSaveTypeString } from 'types/types';
import { PKM } from '../../types/PKMTypes/PKM';
import { isRestricted } from '../../types/TransferRestrictions';
import ArrowButton from './ArrowButton';
import BoxCell from './BoxCell';

interface SaveDisplayProps {
  saveIndex: number;
  setSelectedMon: (_: PKM | undefined) => void;
}

const SaveDisplay = (props: SaveDisplayProps) => {
  const { palette } = useTheme();
  const saves = useSaves();
  const dragMon = useDragMon();
  const { saveIndex, setSelectedMon } = props;
  const dispatch = useAppDispatch();

  const dispatchSetBox = (box: number) =>
    dispatch(setSaveBox({ saveNumber: saveIndex, box }));
  const dispatchStartDrag = (source: SaveCoordinates) =>
    dispatch(startDrag(source));
  const dispatchCompleteDrag = (dest: SaveCoordinates) =>
    dispatch(completeDrag(dest));
  const dispatchRemoveSaveAt = (index: number) => dispatch(removeSaveAt(index));
  const dispatchImportMons = (mons: PKM[], saveCoordinates: SaveCoordinates) =>
    dispatch(importMons({ mons, saveCoordinates }));

  const save = useMemo(() => {
    return saves[saveIndex];
  }, [saves, saveIndex]);

  const isDisabled = useMemo(() => {
    return dragMon
      ? isRestricted(save.transferRestrictions, dragMon.dexNum, dragMon.formNum)
      : false;
  }, [save, dragMon]);
  return save && save.currentPCBox !== undefined ? (
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
              color: save.changedMons.length
                ? palette.text.disabled
                : palette.text.secondary,
              fontWeight: 'bold',
              backgroundColor: palette.secondary.main,
            }}
            onClick={() => dispatchRemoveSaveAt(saveIndex)}
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
            backgroundColor: isDisabled ? '#555' : palette.secondary.main,
            padding: 5,
            margin: 10,
          }}
        >
          <div>
            <Grid container>
              <Grid xs={2} style={{ display: 'grid', alignItems: 'center' }}>
                <ArrowButton
                  onClick={() =>
                    dispatchSetBox(
                      save.currentPCBox > 0
                        ? save.currentPCBox - 1
                        : save.boxes.length - 1
                    )
                  }
                >
                  <ArrowBack fontSize="small" />
                </ArrowButton>
              </Grid>
              <Grid xs={8} style={{ textAlign: 'center', color: 'white' }}>
                {save.boxes[save.currentPCBox]?.name}
              </Grid>
              <Grid
                xs={2}
                style={{
                  display: 'grid',
                  alignItems: 'center',
                }}
              >
                <ArrowButton
                  onClick={() =>
                    dispatchSetBox((save.currentPCBox + 1) % save.boxes.length)
                  }
                >
                  <ArrowForward fontSize="small" />
                </ArrowButton>
              </Grid>
            </Grid>
            {_.range(save.boxRows).map((row: number) => (
              <Grid container key={`pc_row_${row}`}>
                {_.range(save.boxColumns).map((rowIndex: number) => {
                  const mon =
                    save.boxes[save.currentPCBox].pokemon[
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
                        onDragEvent={() => {
                          dispatchStartDrag({
                            saveNumber: saveIndex,
                            box: save.currentPCBox,
                            index: row * save.boxColumns + rowIndex,
                          });
                        }}
                        disabled={isDisabled}
                        mon={mon}
                        zIndex={5 - row}
                        onDrop={(importedMons) => {
                          if (importedMons) {
                            dispatchImportMons(importedMons, {
                              saveNumber: saveIndex,
                              box: save.currentPCBox,
                              index: row * save.boxColumns + rowIndex,
                            });
                          } else {
                            dispatchCompleteDrag({
                              saveNumber: saveIndex,
                              box: save.currentPCBox,
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
    <div />
  );
};

export default SaveDisplay;
