import { useDraggable } from '@dnd-kit/core'
import { Card, Grid } from '@mui/joy'
import lodash from 'lodash'
import { useContext, useMemo, useState } from 'react'
import { EditIcon } from 'src/components/Icons'
import MiniButton from 'src/components/MiniButton'
import { ErrorContext } from 'src/state/error'
import { LookupContext } from 'src/state/lookup'
import { MonLocation, MonWithLocation, OpenSavesContext } from 'src/state/openSaves'
import { PKMInterface } from 'src/types/interfaces'
import { OHPKM } from 'src/types/pkm/OHPKM'
import { getMonFileIdentifier } from 'src/util/Lookup'
import ArrowButton from './ArrowButton'
import BoxCell from './BoxCell'

interface HomeBoxDisplayProps {
  setSelectedMon: (_: PKMInterface | undefined) => void
}

const HomeBoxDisplay = (props: HomeBoxDisplayProps) => {
  const [{ homeData }, openSavesDispatch] = useContext(OpenSavesContext)
  const [{ homeMons }] = useContext(LookupContext)
  const [, dispatchError] = useContext(ErrorContext)
  const { setSelectedMon } = props
  const { active } = useDraggable({ id: '' })
  const [editing, setEditing] = useState(false)

  const attemptImportMons = (mons: PKMInterface[], location: MonLocation) => {
    if (!homeData || !homeMons) {
      dispatchError({
        type: 'set_message',
        payload: {
          title: 'Import Failed',
          messages: ['Home data is not loaded. Something went wrong.'],
        },
      })
      return
    }
    for (const mon of mons) {
      try {
        const identifier = getMonFileIdentifier(new OHPKM(mon))

        if (!identifier) continue

        const inCurrentBox = homeData.boxes[homeData.currentPCBox].pokemon.some(
          (mon) => mon && getMonFileIdentifier(mon) === identifier
        )

        if (identifier in homeMons || inCurrentBox) {
          const message =
            mons.length === 1
              ? 'This Pokémon has been moved into OpenHome before.'
              : 'One or more of these Pokémon has been moved into OpenHome before.'

          dispatchError({
            type: 'set_message',
            payload: { title: 'Import Failed', messages: [message] },
          })
          return
        }
      } catch (e) {
        dispatchError({
          type: 'set_message',
          payload: { title: 'Import Failed', messages: [`${e}`] },
        })
      }
    }
    openSavesDispatch({ type: 'import_mons', payload: { mons, dest: location } })
  }

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
      <Card style={{ padding: 2, width: '100%', height: 'fit-content', gap: 0 }}>
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
                        attemptImportMons(importedMons, {
                          box: homeData.currentPCBox,
                          boxPos: row * 12 + rowIndex,
                          save: homeData,
                        })
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
