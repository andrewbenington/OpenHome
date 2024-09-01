import { Card, Grid } from '@mui/joy'
import lodash from 'lodash'
import { GameOfOriginData } from 'pokemon-resources'
import { useMemo } from 'react'
import { MdArrowBack, MdArrowForward, MdClose } from 'react-icons/md'
import { PKMFile } from '../../types/pkm/util'
import { isRestricted } from '../../types/TransferRestrictions'
import { SaveCoordinates, getSaveTypeString } from '../../types/types'
import { useAppDispatch } from '../redux/hooks'
import { useDragMon, useOpenSaves } from '../redux/selectors'
import {
  completeDrag,
  importMons,
  removeSaveAt,
  setSaveBox,
  startDrag,
} from '../redux/slices/appSlice'
import ArrowButton from './boxes/ArrowButton'
import BoxCell from './boxes/BoxCell'

interface OpenSaveDisplayProps {
  saveIndex: number
  setSelectedMon: (_: PKMFile | undefined) => void
}

const OpenSaveDisplay = (props: OpenSaveDisplayProps) => {
  const saves = useOpenSaves()
  const dragMon = useDragMon()
  const { saveIndex, setSelectedMon } = props
  const dispatch = useAppDispatch()

  const dispatchSetBox = (box: number) => dispatch(setSaveBox({ saveNumber: saveIndex, box }))
  const dispatchStartDrag = (source: SaveCoordinates) => dispatch(startDrag(source))
  const dispatchCompleteDrag = (dest: SaveCoordinates) => dispatch(completeDrag(dest))
  const dispatchRemoveSaveAt = (index: number) => dispatch(removeSaveAt(index))
  const dispatchImportMons = (mons: PKMFile[], saveCoordinates: SaveCoordinates) =>
    dispatch(importMons({ mons, saveCoordinates }))

  const save = useMemo(() => {
    return saves[saveIndex]
  }, [saves, saveIndex])

  const isDisabled = useMemo(() => {
    return dragMon
      ? isRestricted(save.transferRestrictions, dragMon.dexNum, dragMon.formeNum)
      : false
  }, [save, dragMon])
  return save && save.currentPCBox !== undefined ? (
    <div style={{ display: 'flex', width: '100%', flexDirection: 'column' }}>
      <Card className="save-header">
        <button
          className="save-close-button"
          onClick={() => dispatchRemoveSaveAt(saveIndex)}
          disabled={!!save.updatedBoxSlots.length}
        >
          <MdClose />
        </button>
        <div
          style={{
            flex: 1,
          }}
        >
          <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
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
        className="box-card"
        style={{
          backgroundColor: isDisabled ? '#666' : undefined,
        }}
      >
        <div>
          <Grid container className="box-navigation">
            <Grid xs={2} display="grid" alignItems="center">
              <ArrowButton
                onClick={() =>
                  dispatchSetBox(
                    save.currentPCBox > 0 ? save.currentPCBox - 1 : save.boxes.length - 1
                  )
                }
              >
                <MdArrowBack fontSize="small" />
              </ArrowButton>
            </Grid>
            <Grid xs={8} className="box-name">
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
                onClick={() => dispatchSetBox((save.currentPCBox + 1) % save.boxes.length)}
              >
                <MdArrowForward fontSize="small" />
              </ArrowButton>
            </Grid>
          </Grid>
          {lodash.range(save.boxRows).map((row: number) => (
            <Grid container key={`pc_row_${row}`}>
              {lodash.range(save.boxColumns).map((rowIndex: number) => {
                const mon = save.boxes[save.currentPCBox].pokemon[row * save.boxColumns + rowIndex]
                return (
                  <Grid
                    key={`pc_row_${row}_slot_${rowIndex}`}
                    xs={12 / save.boxColumns}
                    style={{ padding: '2px 2px 0px 2px' }}
                  >
                    <BoxCell
                      onClick={() => {
                        setSelectedMon(mon)
                      }}
                      onDragEvent={() => {
                        dispatchStartDrag({
                          saveNumber: saveIndex,
                          box: save.currentPCBox,
                          index: row * save.boxColumns + rowIndex,
                        })
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
                          })
                        } else {
                          dispatchCompleteDrag({
                            saveNumber: saveIndex,
                            box: save.currentPCBox,
                            index: row * save.boxColumns + rowIndex,
                          })
                        }
                      }}
                    />
                  </Grid>
                )
              })}
            </Grid>
          ))}
        </div>
      </Card>
    </div>
  ) : (
    <div />
  )
}

export default OpenSaveDisplay
