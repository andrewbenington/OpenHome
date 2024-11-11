import { Button, Card, Grid, Modal, ModalDialog, Stack } from '@mui/joy'
import lodash from 'lodash'
import { GameOfOriginData } from 'pokemon-resources'
import { useCallback, useContext, useMemo, useState } from 'react'
import { MdArrowBack, MdArrowForward, MdClose } from 'react-icons/md'
import { MenuIcon } from 'src/renderer/components/Icons'
import AttributeRow from 'src/renderer/pokemon/AttributeRow'
import { MouseContext } from 'src/renderer/state/mouse'
import { MonLocation, OpenSavesContext } from 'src/renderer/state/openSaves'
import { PKMFile } from '../../../types/pkm/util'
import ArrowButton from './ArrowButton'
import BoxCell from './BoxCell'

interface OpenSaveDisplayProps {
  saveIndex: number
  setSelectedMon: (_: PKMFile | undefined) => void
}

const OpenSaveDisplay = (props: OpenSaveDisplayProps) => {
  const [, openSavesDispatch, openSaves] = useContext(OpenSavesContext)
  const [mouseState, mouseDispatch] = useContext(MouseContext)
  const [detailsModal, setDetailsModal] = useState(false)
  const { saveIndex, setSelectedMon } = props
  const save = openSaves[saveIndex]

  const dispatchStartDrag = useCallback(
    (boxPos: number) => {
      const mon = save.getCurrentBox().pokemon[boxPos]
      if (mon) {
        mouseDispatch({
          type: 'set_drag_source',
          payload: { save, box: save.currentPCBox, boxPos, mon },
        })
      }
    },
    [mouseDispatch, save]
  )

  const dispatchCompleteDrag = useCallback(
    (boxPosition: number) => {
      mouseState.dragSource &&
        openSavesDispatch({
          type: 'move_mon',
          payload: {
            dest: { save, box: save.currentPCBox, boxPos: boxPosition },
            source: mouseState.dragSource,
          },
        })
      mouseDispatch({
        type: 'set_drag_source',
        payload: undefined,
      })
    },
    [mouseDispatch, mouseState.dragSource, openSavesDispatch, save]
  )

  const dispatchImportMons = (mons: PKMFile[], location: MonLocation) =>
    openSavesDispatch({ type: 'import_mons', payload: { mons, dest: location } })

  const isDisabled = useMemo(() => {
    return mouseState.dragSource
      ? save.supportsMon(mouseState.dragSource.mon.dexNum, mouseState.dragSource.mon.formeNum)
      : false
  }, [save, mouseState.dragSource])

  return save && save.currentPCBox !== undefined ? (
    <Stack style={{ width: '100%' }}>
      <Card style={{ padding: '8px 0px 0px' }}>
        <div className="save-header">
          <Button
            className="save-close-button"
            onClick={() =>
              openSavesDispatch({
                type: 'remove_save',
                payload: save,
              })
            }
            disabled={!!save.updatedBoxSlots.length}
            color="danger"
            size="sm"
          >
            <MdClose />
          </Button>{' '}
          <div
            style={{
              flex: 1,
            }}
          >
            <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
              Pokémon {GameOfOriginData[save.origin]?.name}
            </div>
            <div style={{ textAlign: 'center' }}>
              {save?.name} ({save?.displayID})
            </div>
          </div>
          <Button
            className="save-menu-button"
            onClick={() => setDetailsModal(true)}
            variant="plain"
            color="neutral"
            size="sm"
          >
            <MenuIcon />
          </Button>
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
                  openSavesDispatch({
                    type: 'set_save_box',
                    payload: {
                      boxNum: save.currentPCBox > 0 ? save.currentPCBox - 1 : save.boxes.length - 1,
                      save,
                    },
                  })
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
                onClick={() =>
                  openSavesDispatch({
                    type: 'set_save_box',
                    payload: {
                      boxNum: (save.currentPCBox + 1) % save.boxes.length,
                      save,
                    },
                  })
                }
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
                        dispatchStartDrag(row * save.boxColumns + rowIndex)
                      }}
                      disabled={isDisabled}
                      mon={mon}
                      zIndex={5 - row}
                      onDrop={(importedMons) => {
                        if (importedMons) {
                          dispatchImportMons(importedMons, {
                            save,
                            box: save.currentPCBox,
                            boxPos: row * save.boxColumns + rowIndex,
                          })
                        } else {
                          dispatchCompleteDrag(row * save.boxColumns + rowIndex)
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
      <Modal open={detailsModal} onClose={() => setDetailsModal(false)}>
        <ModalDialog
          sx={{
            minWidth: 800,
            width: '80%',
            maxHeight: 'fit-content',
            height: '95%',
            overflow: 'hidden',
            gap: 0,
          }}
        >
          <AttributeRow label="Game">Pokémon {GameOfOriginData[save.origin]?.name}</AttributeRow>
          <AttributeRow label="Trainer Name">{save.name}</AttributeRow>
          <AttributeRow label="Trainer ID">{save.displayID}</AttributeRow>
          {save.sid && (
            <AttributeRow label="Secret ID">
              <code>0x{save.sid.toString(16)}</code>
            </AttributeRow>
          )}
          <AttributeRow label="File">
            <div style={{ overflowWrap: 'break-word', width: '100%' }}>{save.filePath.raw}</div>
          </AttributeRow>
          {save.fileCreated && (
            <AttributeRow label="File">
              <div style={{ overflowWrap: 'break-word', width: '100%' }}>
                {save.fileCreated.toDateString()}
              </div>
            </AttributeRow>
          )}
          {save.calculateChecksum && (
            <AttributeRow label="Checksum">
              <code>0x{save.calculateChecksum().toString(16)}</code>
            </AttributeRow>
          )}
        </ModalDialog>
      </Modal>
    </Stack>
  ) : (
    <div />
  )
}

export default OpenSaveDisplay
