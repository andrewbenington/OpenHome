import { Card, Grid } from '@mui/joy'
import lodash from 'lodash'
import { useContext } from 'react'
import { MdArrowBack, MdArrowForward } from 'react-icons/md'
import { OpenSavesContext } from 'src/renderer/state/saves'
import { PKMFile } from '../../../types/pkm/util'
import { SaveCoordinates } from '../../../types/types'
import { useAppDispatch } from '../../redux/hooks'
import {
  cancelDrag,
  completeDrag,
  importMons,
  setHomeBox,
  startDrag,
} from '../../redux/slices/appSlice'
import ArrowButton from './ArrowButton'
import BoxCell from './BoxCell'

interface HomeBoxDisplayProps {
  setSelectedMon: (_: PKMFile | undefined) => void
}

const HomeBoxDisplay = (props: HomeBoxDisplayProps) => {
  const [{ homeData: data }] = useContext(OpenSavesContext)
  const { setSelectedMon } = props

  const dispatch = useAppDispatch()
  const dispatchSetBox = (box: number) => dispatch(setHomeBox({ box }))
  const dispatchStartDrag = (source: SaveCoordinates) => dispatch(startDrag(source))
  const dispatchCancelDrag = () => dispatch(cancelDrag())
  const dispatchCompleteDrag = (dest: SaveCoordinates) => dispatch(completeDrag(dest))
  const dispatchImportMons = (mons: PKMFile[], saveCoordinates: SaveCoordinates) =>
    dispatch(importMons({ mons, saveCoordinates }))

  return (
    data?.boxes[data.currentPCBox] && (
      <Card
        style={{
          padding: 2,
          width: '100%',
          height: 'fit-content',
          gap: 0,
        }}
      >
        <Grid container>
          <Grid
            xs={2}
            style={{
              display: 'grid',
              alignItems: 'center',
            }}
          >
            <ArrowButton
              onClick={() =>
                dispatchSetBox(
                  data.currentPCBox > 0 ? data.currentPCBox - 1 : data.boxes.length - 1
                )
              }
            >
              <MdArrowBack fontSize="small" />
            </ArrowButton>
          </Grid>
          <Grid xs={8} className="box-name">
            {data.boxes[data.currentPCBox]?.name}
          </Grid>
          <Grid
            xs={2}
            style={{
              display: 'grid',
              alignItems: 'center',
            }}
          >
            <ArrowButton
              onClick={() => dispatchSetBox((data.currentPCBox + 1) % data.boxes.length)}
            >
              <MdArrowForward fontSize="small" />
            </ArrowButton>
          </Grid>
        </Grid>
        {lodash.range(10).map((row: number) => (
          <Grid container key={`pc_row_${row}`}>
            {lodash.range(12).map((rowIndex: number) => {
              const mon = data.boxes[data.currentPCBox].pokemon[row * 12 + rowIndex]
              return (
                <Grid
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
      </Card>
    )
  )
}

export default HomeBoxDisplay
