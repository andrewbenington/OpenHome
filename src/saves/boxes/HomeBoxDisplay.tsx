import { Button, Card, DropdownMenu, Flex, Grid, Heading, TextField } from '@radix-ui/themes'
import lodash, { range } from 'lodash'
import { ToggleGroup } from 'radix-ui'
import { useCallback, useContext, useMemo, useState } from 'react'
import { BsFillGrid3X3GapFill } from 'react-icons/bs'
import { FaSquare } from 'react-icons/fa'
import { EditIcon, MenuIcon } from 'src/components/Icons'
import PokemonDetailsModal from 'src/pokemon/PokemonDetailsModal'
import { ErrorContext } from 'src/state/error'
import { MonLocation, MonWithLocation, OpenSavesContext } from 'src/state/openSaves'
import { PersistedPkmDataContext } from 'src/state/persistedPkmData'
import { PKMInterface } from 'src/types/interfaces'
import { OHPKM } from 'src/types/pkm/OHPKM'
import { SortTypes } from 'src/types/pkm/sort'
import { getMonFileIdentifier } from 'src/util/Lookup'
import { DragMonContext } from '../../state/dragMon'
import { buildBackwardNavigator, buildForwardNavigator } from '../util'
import ArrowButton from './ArrowButton'
import BoxCell from './BoxCell'
import DroppableSpace from './DroppableSpace'
import './style.css'

const COLUMN_COUNT = 12
const ROW_COUNT = 10

type BoxViewMode = 'one' | 'all'

const ALLOW_DUPE_IMPORT = true

export default function HomeBoxDisplay() {
  const [openSavesState, openSavesDispatch] = useContext(OpenSavesContext)
  const [editing, setEditing] = useState(false)
  const [viewMode, setViewMode] = useState<BoxViewMode>('one')
  const [editingBoxName, setEditingBoxName] = useState('')

  const homeData = openSavesState.homeData

  const currentBox = homeData?.boxes[homeData.currentPCBox]

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
            <Flex align="center" justify="between" flexGrow="3" width="0">
              <ViewToggle viewMode={viewMode} setViewMode={setViewMode} disabled={editing} />
              <ArrowButton
                onClick={() =>
                  openSavesDispatch({
                    type: 'set_home_box',
                    payload: {
                      box:
                        homeData.currentPCBox > 0
                          ? homeData.currentPCBox - 1
                          : homeData.boxes.length - 1,
                    },
                  })
                }
                style={{ visibility: viewMode === 'one' ? 'visible' : 'collapse' }}
                dragID="home-arrow-left"
                direction="left"
                disabled={editing}
              />
            </Flex>
            <div className="box-name">
              {editing ? (
                <TextField.Root
                  value={editingBoxName}
                  size="1"
                  style={{
                    minWidth: 0,
                    textAlign: 'center',
                    visibility: viewMode === 'one' ? 'visible' : 'collapse',
                  }}
                  placeholder={`Box ${currentBox.index + 1}`}
                  onChange={(e) => setEditingBoxName(e.target.value)}
                  autoFocus
                />
              ) : (
                <Heading
                  size="3"
                  style={{ visibility: viewMode === 'one' ? 'visible' : 'collapse' }}
                >
                  {currentBox.name?.trim() || `Box ${currentBox.index + 1}`}
                </Heading>
              )}
            </div>
            <Flex align="center" flexGrow="3" width="0" justify="between">
              <ArrowButton
                onClick={() =>
                  openSavesDispatch({
                    type: 'set_home_box',
                    payload: {
                      box: (currentBox.index + 1) % homeData.boxes.length,
                    },
                  })
                }
                style={{ visibility: viewMode === 'one' ? 'visible' : 'collapse' }}
                dragID="home-arrow-right"
                direction="right"
                disabled={editing}
              />
              <Flex gap="1">
                {viewMode === 'one' && (
                  <Button
                    className="mini-button"
                    style={{ transition: 'none', padding: 0 }}
                    variant={editing ? 'solid' : 'outline'}
                    color={editing ? undefined : 'gray'}
                    onClick={() => {
                      if (editing) {
                        openSavesDispatch({
                          type: 'set_home_box_name',
                          payload: { name: editingBoxName, index: currentBox.index },
                        })
                      } else {
                        setEditingBoxName(homeData.getCurrentBox().name ?? '')
                      }
                      setEditing(!editing)
                    }}
                  >
                    <EditIcon />
                  </Button>
                )}
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger>
                    <Button className="mini-button" variant="outline" color="gray">
                      <MenuIcon />
                    </Button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content>
                    {viewMode === 'one' && (
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
                    )}
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
              </Flex>
            </Flex>
          </Flex>
          {viewMode === 'one' ? (
            <BoxMons />
          ) : (
            <AllBoxes
              onBoxSelect={(boxIndex) => {
                homeData.currentBoxIndex = boxIndex
                setViewMode('one')
              }}
            />
          )}
        </Card>
      </>
    )
  )
}

function BoxMons() {
  const [{ homeMons }] = useContext(PersistedPkmDataContext)
  const [{ homeData }, openSavesDispatch] = useContext(OpenSavesContext)
  const [, dispatchError] = useContext(ErrorContext)
  const [selectedIndex, setSelectedIndex] = useState<number>()
  const [dragMonState] = useContext(DragMonContext)

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

        if (!ALLOW_DUPE_IMPORT && (identifier in homeMons || inCurrentBox)) {
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
    openSavesDispatch({
      type: 'import_mons',
      payload: {
        mons,
        dest: {
          bank: homeData.getCurrentBank().index,
          box: location.box,
          box_slot: location.box_slot,
          is_home: true,
        },
      },
    })
  }

  const dragData: MonWithLocation | undefined = useMemo(() => dragMonState.payload, [dragMonState])

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
        <Grid columns={COLUMN_COUNT.toString()} gap="1">
          {lodash
            .range(COLUMN_COUNT * ROW_COUNT)
            .map((index: number) => currentBox.pokemon[index])
            .map((mon, index) => (
              <BoxCell
                key={`${homeData.currentPCBox}-${index}`}
                onClick={() => setSelectedIndex(index)}
                dragID={`home_${homeData.currentPCBox}_${index}`}
                location={{
                  bank: homeData.currentBankIndex,
                  box: homeData.currentPCBox,
                  box_slot: index,
                  is_home: true,
                }}
                mon={mon}
                zIndex={0}
                onDrop={(importedMons) => {
                  if (importedMons) {
                    attemptImportMons(importedMons, {
                      bank: homeData.currentBankIndex,
                      box: homeData.currentPCBox,
                      box_slot: index,
                      is_home: true,
                    })
                  }
                }}
                disabled={
                  // don't allow a swap with a pokémon not supported by the source save
                  mon &&
                  dragData &&
                  !dragData.is_home &&
                  !dragData.save.supportsMon(mon.dexNum, mon.formeNum)
                }
              />
            ))}
        </Grid>
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

function AllBoxes(props: { onBoxSelect: (index: number) => void }) {
  const { onBoxSelect } = props
  const [{ homeData }] = useContext(OpenSavesContext)

  return (
    <Grid columns="8" gap="1">
      {homeData?.boxes.map((box, boxIndex) => (
        <BoxOverview
          key={box.name ?? `Box ${boxIndex + 1}`}
          boxIndex={boxIndex}
          onBoxSelect={() => onBoxSelect(boxIndex)}
        />
      ))}
    </Grid>
  )
}

type BoxOverviewProps = {
  boxIndex: number
  onBoxSelect: () => void
}

function BoxOverview({ boxIndex, onBoxSelect }: BoxOverviewProps) {
  const [{ homeData }] = useContext(OpenSavesContext)

  const box = useMemo(() => {
    return homeData?.boxes[boxIndex]
  }, [homeData?.boxes, boxIndex])

  if (!homeData || !box) return <div />

  const firstOpenIndex = box.firstOpenIndex()

  return (
    <DroppableSpace
      dropID={`box-${boxIndex}`}
      key={box.name ?? `Box ${boxIndex + 1}`}
      dropData={
        firstOpenIndex !== undefined
          ? {
              is_home: true,
              bank: homeData.currentBankIndex,
              box: boxIndex,
              box_slot: firstOpenIndex,
            }
          : undefined
      }
      disabled={firstOpenIndex === undefined}
    >
      <Button
        variant="soft"
        style={{ height: 'fit-content', padding: '4px 8px' }}
        onClick={onBoxSelect}
      >
        <Flex direction="column">
          <div className="box-icon-mon-container">
            {range(homeData.boxColumns).map((i) => (
              <div className="box-icon-mon-col" key={`pos-display-col-${i}`}>
                {range(homeData.boxRows).map((j) => (
                  <div
                    className={`box-icon-mon-indicator ${!box?.pokemon?.[j * homeData.boxColumns + i] ? 'box-icon-mon-empty' : ''}`}
                    key={`pos-display-cell-${i}-${j}`}
                  />
                ))}
              </div>
            ))}
          </div>
          {box.name ?? `Box ${boxIndex + 1}`}
        </Flex>
      </Button>
    </DroppableSpace>
  )
}

type ViewToggleProps = {
  viewMode: BoxViewMode
  setViewMode: (mode: BoxViewMode) => void
  disabled?: boolean
}

const DRAG_OVER_COOLDOWN_MS = 500

function ViewToggle(props: ViewToggleProps) {
  const { viewMode, setViewMode, disabled } = props
  const [dragMonState] = useContext(DragMonContext)
  const [firstHover, setFirstHover] = useState(true)
  const [hoverCooldown, setHoverCooldown] = useState(false)

  const onAllViewModeDragOver = useCallback(() => {
    if (firstHover) {
      setFirstHover(false)
      setHoverCooldown(true)
      setTimeout(() => {
        setHoverCooldown(false)
      }, DRAG_OVER_COOLDOWN_MS)
      return
    }

    if (hoverCooldown) {
      return
    }
    setHoverCooldown(true)
    setViewMode('all')

    setTimeout(() => {
      setHoverCooldown(false)
    }, DRAG_OVER_COOLDOWN_MS)
  }, [firstHover, hoverCooldown, setViewMode])

  const onNotDragOver = useCallback(() => {
    setFirstHover(true)
  }, [])

  return (
    <ToggleGroup.Root
      className="ToggleGroup"
      value={viewMode}
      type="single"
      onValueChange={(newVal: BoxViewMode) => setViewMode(newVal)}
      disabled={disabled}
    >
      <ToggleGroup.Item value="one" className="ToggleGroupItem" disabled={!!dragMonState.payload}>
        <FaSquare />
      </ToggleGroup.Item>
      <ToggleGroup.Item value="all" className="ToggleGroupItem">
        <DroppableSpace
          dropID={`all-boxes-toggle`}
          onOver={onAllViewModeDragOver}
          onNotOver={onNotDragOver}
        >
          <BsFillGrid3X3GapFill />
        </DroppableSpace>
      </ToggleGroup.Item>
    </ToggleGroup.Root>
  )
}
