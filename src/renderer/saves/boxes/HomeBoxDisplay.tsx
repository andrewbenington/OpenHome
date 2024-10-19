import { Card, Grid } from '@mui/joy'
import lodash from 'lodash'
import { useCallback, useContext } from 'react'
import { MdArrowBack, MdArrowForward } from 'react-icons/md'
import { MouseContext } from 'src/renderer/state/mouse'
import { MonLocation, OpenSavesContext } from 'src/renderer/state/openSaves'
import { PKMFile } from '../../../types/pkm/util'
import ArrowButton from './ArrowButton'
import BoxCell from './BoxCell'

interface HomeBoxDisplayProps {
  setSelectedMon: (_: PKMFile | undefined) => void
}

const HomeBoxDisplay = (props: HomeBoxDisplayProps) => {
  const [{ homeData }, openSavesDispatch] = useContext(OpenSavesContext)
  const [mouseState, mouseDispatch] = useContext(MouseContext)
  const { setSelectedMon } = props

  const dispatchStartDrag = useCallback(
    (boxPos: number) => {
      if (!homeData) return
      const mon = homeData.getCurrentBox().pokemon[boxPos]
      if (mon) {
        mouseDispatch({
          type: 'set_drag_source',
          payload: { save: homeData, box: homeData.currentPCBox, boxPos, mon },
        })
      }
    },
    [mouseDispatch, homeData]
  )

  const dispatchCancelDrag = () => mouseDispatch({ type: 'set_drag_source', payload: undefined })
  const dispatchCompleteDrag = useCallback(
    (boxPos: number) => {
      mouseState.dragSource &&
        homeData &&
        openSavesDispatch({
          type: 'move_mon',
          payload: {
            dest: { save: homeData, box: homeData.currentPCBox, boxPos },
            source: mouseState.dragSource,
          },
        })
      mouseDispatch({
        type: 'set_drag_source',
        payload: undefined,
      })
    },
    [mouseState.dragSource, homeData, openSavesDispatch, mouseDispatch]
  )
  const dispatchImportMons = (mons: PKMFile[], location: MonLocation) =>
    openSavesDispatch({ type: 'import_mons', payload: { mons, dest: location } })

  return (
    homeData?.boxes[homeData.currentPCBox] && (
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
                openSavesDispatch({
                  type: 'set_save_box',
                  payload: {
                    boxNum:
                      homeData.currentPCBox > 0
                        ? homeData.currentPCBox - 1
                        : homeData.boxes.length - 1,
                    save: homeData,
                  },
                })
              }
            >
              <MdArrowBack fontSize="small" />
            </ArrowButton>
          </Grid>
          <Grid xs={8} className="box-name">
            {homeData.boxes[homeData.currentPCBox]?.name}
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
                openSavesDispatch({
                  type: 'set_save_box',
                  payload: {
                    boxNum: (homeData.currentPCBox + 1) % homeData.boxes.length,
                    save: homeData,
                  },
                })
              }
            >
              <MdArrowForward fontSize="small" />
            </ArrowButton>
          </Grid>
        </Grid>
        {lodash.range(10).map((row: number) => (
          <Grid container key={`pc_row_${row}`}>
            {lodash.range(12).map((rowIndex: number) => {
              const mon = homeData.boxes[homeData.currentPCBox].pokemon[row * 12 + rowIndex]
              return (
                <Grid
                  key={`home_box_row_${rowIndex}`}
                  xs={1}
                  style={{ padding: '2px 2px 0px 2px' }}
                >
                  <BoxCell
                    onClick={() => setSelectedMon(mon)}
                    onDragEvent={(cancel: boolean) =>
                      cancel ? dispatchCancelDrag() : dispatchStartDrag(row * 12 + rowIndex)
                    }
                    mon={mon}
                    zIndex={10 - row}
                    onDrop={(importedMons) => {
                      if (importedMons) {
                        dispatchImportMons(importedMons, {
                          box: homeData.currentPCBox,
                          boxPos: row * 12 + rowIndex,
                          save: homeData,
                        })
                      } else {
                        dispatchCompleteDrag(row * 12 + rowIndex)
                      }
                    }}
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
