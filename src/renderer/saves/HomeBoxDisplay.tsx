import { Grid, Paper, useTheme } from '@mui/material'
import _ from 'lodash'
import { PKM } from '../../types/PKMTypes/PKM'
import { SaveCoordinates } from '../../types/types'
import { useAppDispatch } from '../redux/hooks'
import { useHomeData } from '../redux/selectors'
import { cancelDrag, completeDrag, importMons, startDrag } from '../redux/slices/appSlice'
import BoxCell from './BoxCell'

interface HomeBoxDisplayProps {
  setSelectedMon: (_: PKM | undefined) => void
}

const HomeBoxDisplay = (props: HomeBoxDisplayProps) => {
  const data = useHomeData()
  const { setSelectedMon } = props

  const dispatch = useAppDispatch()
  const dispatchStartDrag = (source: SaveCoordinates) => dispatch(startDrag(source))
  const dispatchCancelDrag = () => dispatch(cancelDrag())
  const dispatchCompleteDrag = (dest: SaveCoordinates) => dispatch(completeDrag(dest))
  const dispatchImportMons = (mons: PKM[], saveCoordinates: SaveCoordinates) =>
    dispatch(importMons({ mons, saveCoordinates }))

  return (
    data.boxes[0] && (
      <Paper
        style={{
          padding: 2,
          width: '100%',
          height: 'fit-content',
        }}
      >
        {_.range(10).map((row: number) => (
          <Grid container key={`pc_row_${row}`}>
            {_.range(12).map((rowIndex: number) => {
              const mon = data.boxes[data.currentPCBox].pokemon[row * 12 + rowIndex]
              return (
                <Grid
                  item
                  key={`home_box_row_${rowIndex}`}
                  xs={1}
                  style={{ padding: '2px 2px 0px 2px' }}
                >
                  <BoxCell
                    onClick={() => setSelectedMon(mon)}
                    onDragEvent={(cancel: boolean) =>
                      cancel
                        ? dispatchCancelDrag()
                        : dispatchStartDrag({
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
                        })
                      } else {
                        dispatchCompleteDrag({
                          saveNumber: -1,
                          box: data.currentPCBox,
                          index: row * 12 + rowIndex,
                        })
                      }
                    }}
                    disabled={false}
                  />
                </Grid>
              )
            })}
          </Grid>
        ))}
      </Paper>
    )
  )
}

export default HomeBoxDisplay
