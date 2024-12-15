import { useDraggable } from '@dnd-kit/core'
import { Card, Grid } from '@mui/joy'
import lodash from 'lodash'
import { useCallback, useContext, useMemo, useState } from 'react'
import { EditIcon } from 'src/components/Icons'
import MiniButton from 'src/components/MiniButton'
import { MouseContext } from 'src/state/mouse'
import { MonLocation, MonWithLocation, OpenSavesContext } from 'src/state/openSaves'
import { PKMInterface } from 'src/types/interfaces'
import ArrowButton from './ArrowButton'
import BoxCell from './BoxCell'

interface HomeBoxDisplayProps {
  setSelectedMon: (_: PKMInterface | undefined) => void
}

const HomeBoxDisplay = (props: HomeBoxDisplayProps) => {
  const [{ homeData }, openSavesDispatch] = useContext(OpenSavesContext)
  const [mouseState, mouseDispatch] = useContext(MouseContext)
  const { setSelectedMon } = props
  const { active } = useDraggable({ id: '' })
  const [editing, setEditing] = useState(false)

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
  const dispatchImportMons = (mons: PKMInterface[], location: MonLocation) =>
    openSavesDispatch({ type: 'import_mons', payload: { mons, dest: location } })

  const dragData: MonWithLocation | undefined = useMemo(
    () => active?.data.current as MonWithLocation | undefined,
    [active]
  )

  const currentBox = useMemo(
    () => homeData?.boxes[homeData.currentPCBox],
    [homeData?.boxes, homeData?.currentPCBox]
  )

  return (
    homeData &&
    currentBox && (
      <Card
        style={{
          padding: 2,
          width: '100%',
          height: 'fit-content',
          gap: 0,
        }}
      >
        <Grid container style={{ padding: 4, minHeight: 48 }}>
          <Grid xs={4} display="grid" alignItems="center" justifyContent="end">
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
              dragID="home-arrow-left"
              direction="left"
            />
          </Grid>
          <Grid xs={4} className="box-name">
            {editing ? (
              <input
                value={currentBox.name || ''}
                style={{ minWidth: 0, textAlign: 'center' }}
                placeholder={`Box ${currentBox.index + 1}`}
                onChange={(e) =>
                  openSavesDispatch({
                    type: 'set_box_name',
                    payload: { name: e.target.value ?? undefined, index: currentBox.index },
                  })
                }
                autoFocus
              />
            ) : (
              <div>{currentBox.name?.trim() || `Box ${currentBox.index + 1}`}</div>
            )}
          </Grid>
          <Grid xs={3} display="grid" alignItems="center">
            <ArrowButton
              onClick={() =>
                openSavesDispatch({
                  type: 'set_save_box',
                  payload: {
                    boxNum: (currentBox.index + 1) % homeData.boxes.length,
                    save: homeData,
                  },
                })
              }
              dragID="home-arrow-right"
              direction="right"
            />
          </Grid>
          <Grid xs={1} display="grid" alignItems="center" justifyContent="end">
            <MiniButton
              icon={EditIcon}
              style={{
                margin: 0,
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: editing ? 'transparent' : undefined,
                transition: 'none',
              }}
              color={editing ? 'secondary' : 'neutral'}
              variant={editing ? 'solid' : 'outlined'}
              onClick={() => setEditing(!editing)}
            />
          </Grid>
        </Grid>
        {lodash.range(10).map((row: number) => (
          <Grid container key={`pc_row_${row}`}>
            {lodash.range(12).map((rowIndex: number) => {
              const mon = currentBox.pokemon[row * 12 + rowIndex]

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
                    dragID={`home_${homeData.currentPCBox}_${row * 12 + rowIndex}`}
                    dragData={{
                      box: homeData.currentPCBox,
                      boxPos: row * 12 + rowIndex,
                      save: homeData,
                    }}
                    mon={mon}
                    zIndex={0}
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
                    disabled={
                      // don't allow a swap with a pokémon not supported by the source save
                      mon && dragData && !dragData?.save?.supportsMon(mon.dexNum, mon.formeNum)
                    }
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
