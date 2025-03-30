import { useDraggable } from '@dnd-kit/core'
import { Button, Card, DropdownMenu, Flex, Grid } from '@radix-ui/themes'
import lodash, { range } from 'lodash'
import { useContext, useMemo, useState } from 'react'
import { EditIcon, MenuIcon } from 'src/components/Icons'
import PokemonDetailsModal from 'src/pokemon/PokemonDetailsModal'
import { ErrorContext } from 'src/state/error'
import { LookupContext } from 'src/state/lookup'
import { MonLocation, MonWithLocation, OpenSavesContext } from 'src/state/openSaves'
import { PKMInterface } from 'src/types/interfaces'
import { OHPKM } from 'src/types/pkm/OHPKM'
import { SortTypes } from 'src/types/pkm/sort'
import { getMonFileIdentifier } from 'src/util/Lookup'
import { buildBackwardNavigator, buildForwardNavigator } from '../util'
import ArrowButton from './ArrowButton'
import BoxCell from './BoxCell'
import './style.css'

const COLUMN_COUNT = 12
const ROW_COUNT = 10

const HomeBoxDisplay = () => {
  const [{ homeData }, openSavesDispatch] = useContext(OpenSavesContext)
  const [{ homeMons }] = useContext(LookupContext)
  const [, dispatchError] = useContext(ErrorContext)
  const [selectedIndex, setSelectedIndex] = useState<number>()
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

  const selectedMon = useMemo(() => {
    if (!currentBox || selectedIndex === undefined || selectedIndex >= currentBox.pokemon.length) {
      return undefined
    }
    return currentBox.pokemon[selectedIndex]
  }, [currentBox, selectedIndex])

  const navigateRight = useMemo(
    () => (homeData ? buildForwardNavigator(homeData, selectedIndex, setSelectedIndex) : undefined),
    [homeData, selectedIndex]
  )

  const navigateLeft = useMemo(
    () =>
      homeData ? buildBackwardNavigator(homeData, selectedIndex, setSelectedIndex) : undefined,
    [homeData, selectedIndex]
  )

  return (
    homeData &&
    currentBox && (
      <>
        <Card
          variant="surface"
          style={{
            padding: 6,
            width: '100%',
            height: 'fit-content',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <Flex direction="row" className="box-navigation">
            <Flex align="center" justify="end" flexGrow="4">
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
            </Flex>
            <div className="box-name">
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
            </div>
            <Flex align="center" flexGrow="3">
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
            </Flex>
            <div className="save-menu-buttons-right">
              <Button
                className="save-button"
                style={{ transition: 'none', padding: 0 }}
                variant={editing ? 'solid' : 'outline'}
                color={editing ? undefined : 'gray'}
                onClick={() => setEditing(!editing)}
              >
                <EditIcon />
              </Button>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                  <Button className="save-button" variant="outline" color="gray">
                    <MenuIcon />
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content>
                  <DropdownMenu.Sub>
                    <DropdownMenu.SubTrigger>Sort this box...</DropdownMenu.SubTrigger>
                    <DropdownMenu.SubContent>
                      {SortTypes.filter((st) => st !== '').map((sortType) => (
                        <DropdownMenu.Item
                          key={sortType}
                          onClick={() =>
                            openSavesDispatch({
                              type: 'sort_current_home_box',
                              payload: { sortType },
                            })
                          }
                        >
                          By {sortType}
                        </DropdownMenu.Item>
                      ))}
                    </DropdownMenu.SubContent>
                  </DropdownMenu.Sub>
                  <DropdownMenu.Sub>
                    <DropdownMenu.SubTrigger>Sort all boxes...</DropdownMenu.SubTrigger>
                    <DropdownMenu.SubContent>
                      {SortTypes.filter((st) => st !== '').map((sortType) => (
                        <DropdownMenu.Item
                          key={sortType}
                          onClick={() =>
                            openSavesDispatch({
                              type: 'sort_all_home_boxes',
                              payload: { sortType },
                            })
                          }
                        >
                          By {sortType}
                        </DropdownMenu.Item>
                      ))}
                    </DropdownMenu.SubContent>
                  </DropdownMenu.Sub>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </div>
          </Flex>
          <Grid columns={COLUMN_COUNT.toString()} gap="1">
            {lodash
              .range(COLUMN_COUNT * ROW_COUNT)
              .map((index: number) => currentBox.pokemon[index])
              .map((mon, index) => (
                <BoxCell
                  key={`home_display_cell_${index}`}
                  onClick={() => setSelectedIndex(index)}
                  dragID={`home_${homeData.currentPCBox}_${index}`}
                  dragData={{
                    box: homeData.currentPCBox,
                    boxPos: index,
                    save: homeData,
                  }}
                  mon={mon}
                  zIndex={0}
                  onDrop={(importedMons) => {
                    if (importedMons) {
                      attemptImportMons(importedMons, {
                        box: homeData.currentPCBox,
                        boxPos: index,
                        save: homeData,
                      })
                    }
                  }}
                  disabled={
                    // don't allow a swap with a pokémon not supported by the source save
                    mon && dragData && !dragData?.save?.supportsMon(mon.dexNum, mon.formeNum)
                  }
                />
              ))}
          </Grid>
        </Card>
        <PokemonDetailsModal
          mon={selectedMon}
          onClose={() => setSelectedIndex(undefined)}
          navigateRight={navigateRight}
          navigateLeft={navigateLeft}
          boxIndicatorProps={
            selectedIndex !== undefined
              ? {
                  currentIndex: selectedIndex,
                  columns: homeData.boxColumns,
                  rows: homeData.boxRows,
                  emptyIndexes: range(homeData.boxColumns * homeData.boxRows).filter(
                    (index) => !currentBox?.pokemon?.[index]
                  ),
                }
              : undefined
          }
        />
      </>
    )
  )
}

export default HomeBoxDisplay
