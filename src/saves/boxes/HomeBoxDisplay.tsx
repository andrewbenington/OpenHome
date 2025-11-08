import { CSS } from '@dnd-kit/utilities'
import {
  Button,
  Card,
  DropdownMenu,
  Flex,
  Grid,
  Heading,
  TextField,
  Tooltip,
} from '@radix-ui/themes'
import lodash from 'lodash'
import { ToggleGroup } from 'radix-ui'
import { CSSProperties, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { BsFillGrid3X3GapFill } from 'react-icons/bs'
import { FaSquare } from 'react-icons/fa'
import { AddIcon, DevIcon, EditIcon, MenuIcon, MoveIcon, RemoveIcon } from 'src/components/Icons'
import PokemonDetailsModal from 'src/pokemon/PokemonDetailsModal'
import { ErrorContext } from 'src/state/error'
import { MonLocation, MonWithLocation } from 'src/state/saves/reducer'
import { PKMInterface } from 'src/types/interfaces'
import { OHPKM } from 'src/types/pkm/OHPKM'
import { SortTypes } from 'src/types/pkm/sort'
import { getMonFileIdentifier } from 'src/util/Lookup'
import { DragMonContext } from '../../state/dragMon'
import { buildBackwardNavigator, buildForwardNavigator } from '../util'
import ArrowButton from './ArrowButton'
import BoxCell from './BoxCell'
import DroppableSpace from './DroppableSpace'

import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { range } from 'src/util/Functional'
import ToggleButton from '../../components/ToggleButton'
import useIsDev from '../../hooks/isDev'
import { useOhpkmStore } from '../../state/ohpkm/useOhpkmStore'
import { useSaves } from '../../state/saves/useSaves'
import { HomeBox, HomeData } from '../../types/SAVTypes/HomeData'
import { filterUndefined } from '../../util/Sort'
import './style.css'

const COLUMN_COUNT = 12
const ROW_COUNT = 10

type BoxViewMode = 'one' | 'all'

const ALLOW_DUPE_IMPORT = true

export default function HomeBoxDisplay() {
  const [openSavesState, openSavesDispatch] = useSaves()
  const ohpkmStore = useOhpkmStore()
  const [editing, setEditing] = useState(false)
  const [moving, setMoving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [viewMode, setViewMode] = useState<BoxViewMode>('one')
  const [editingBoxName, setEditingBoxName] = useState('')
  const isDev = useIsDev()
  const [debugMode, setDebugMode] = useState(false)

  const homeData = openSavesState.homeData

  const currentBox = homeData.boxes[homeData.currentPCBox]

  const onArrowLeft = useCallback(
    () =>
      openSavesDispatch({
        type: 'set_home_box',
        payload: {
          box: homeData.currentPCBox > 0 ? homeData.currentPCBox - 1 : homeData.boxes.length - 1,
        },
      }),
    [homeData, openSavesDispatch]
  )

  return (
    <Card
      variant="surface"
      style={{
        padding: 6,
        width: '100%',
        height: 'fit-content',
        maxHeight: '100%',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <Flex direction="row" className="box-navigation">
        <Flex align="center" justify="between" flexGrow="3" width="0">
          <ViewToggle viewMode={viewMode} setViewMode={setViewMode} disabled={editing || moving} />
          <ArrowButton
            onClick={onArrowLeft}
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  openSavesDispatch({
                    type: 'set_home_box_name',
                    payload: { name: editingBoxName, index: currentBox.index },
                  })
                  setEditing(false)
                } else if (e.key === 'Escape') {
                  setEditing(false)
                }
              }}
              autoFocus
            />
          ) : (
            <Heading size="3" style={{ visibility: viewMode === 'one' ? 'visible' : 'collapse' }}>
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
            {viewMode === 'one' ? (
              <ToggleButton
                state={editing}
                setState={setEditing}
                onSet={() => setEditingBoxName(homeData.getCurrentBox().name ?? '')}
                onUnset={() =>
                  openSavesDispatch({
                    type: 'set_home_box_name',
                    payload: { name: editingBoxName, index: currentBox.index },
                  })
                }
                icon={EditIcon}
                hint="Change box name"
              />
            ) : (
              <>
                {isDev && <ToggleButton state={debugMode} setState={setDebugMode} icon={DevIcon} />}
                <Tooltip content="Add box to end">
                  <Button
                    className="mini-button"
                    variant="outline"
                    color="gray"
                    onClick={() =>
                      openSavesDispatch({
                        type: 'add_home_box',
                        payload: { currentBoxCount: homeData.boxes.length },
                      })
                    }
                  >
                    <AddIcon />
                  </Button>
                </Tooltip>
                <ToggleButton
                  state={deleting}
                  setState={setDeleting}
                  disabled={moving}
                  icon={RemoveIcon}
                  hint="Delete boxes..."
                />
                <ToggleButton
                  state={moving}
                  setState={setMoving}
                  disabled={deleting}
                  icon={MoveIcon}
                  hint="Rearrange boxes..."
                />
              </>
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
                              payload: { sortType, getMonById: ohpkmStore.getById },
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
                            payload: { sortType, getMonById: ohpkmStore.getById },
                          })
                        }
                      >
                        By {sortType}
                      </DropdownMenu.Item>
                    ))}
                  </DropdownMenu.SubContent>
                </DropdownMenu.Sub>
                <DropdownMenu.Item
                  onClick={() =>
                    openSavesDispatch({
                      type: 'current_home_box_remove_dupes',
                    })
                  }
                >
                  Remove duplicates from this box
                </DropdownMenu.Item>
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
          moving={moving}
          deleting={deleting}
          debugMode={debugMode}
        />
      )}
    </Card>
  )
}

function BoxMons() {
  const ohpkmStore = useOhpkmStore()
  const [{ homeData }, openSavesDispatch] = useSaves()
  const [, dispatchError] = useContext(ErrorContext)
  const [selectedIndex, setSelectedIndex] = useState<number>()
  const [dragMonState] = useContext(DragMonContext)

  const attemptImportMons = (mons: PKMInterface[], location: MonLocation) => {
    for (const mon of mons) {
      try {
        const identifier = getMonFileIdentifier(new OHPKM(mon))

        if (!identifier) continue

        const inCurrentBox = homeData.boxes[homeData.currentPCBox].pokemon.some(
          (mon) => mon && getMonFileIdentifier(mon) === identifier
        )

        if (!ALLOW_DUPE_IMPORT && (ohpkmStore.monIsStored(identifier) || inCurrentBox)) {
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

  const dragData: MonWithLocation | undefined = useMemo(() => {
    const payload = dragMonState.payload

    if (payload?.kind === 'mon') {
      return payload.monData
    }
    return undefined
  }, [dragMonState])

  const currentBox = homeData.boxes[homeData.currentPCBox]

  const selectedMon = useMemo(() => {
    if (!currentBox || selectedIndex === undefined || selectedIndex >= currentBox.pokemon.length) {
      return undefined
    }
    return currentBox.pokemon[selectedIndex]
  }, [currentBox, selectedIndex])

  const navigateRight = useMemo(
    () => buildForwardNavigator(homeData, selectedIndex, setSelectedIndex),
    [homeData, selectedIndex]
  )

  const navigateLeft = useMemo(
    () => buildBackwardNavigator(homeData, selectedIndex, setSelectedIndex),
    [homeData, selectedIndex]
  )

  return (
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
}

function newOrderFromDragEnd(movedFromIndex: number, movedIntoIndex: number, boxCount: number) {
  if (movedFromIndex >= boxCount || movedIntoIndex >= boxCount) {
    return range(boxCount)
  }

  const movedUp = movedIntoIndex < movedFromIndex

  const before = range(movedIntoIndex).filter((index) => index !== movedFromIndex)
  const after = range(movedIntoIndex + 1, boxCount).filter((index) => index !== movedFromIndex)

  const newOrder = before

  if (movedUp) {
    newOrder.push(movedFromIndex)
    newOrder.push(movedIntoIndex)
  } else {
    newOrder.push(movedIntoIndex)
    newOrder.push(movedFromIndex)
  }
  newOrder.push(...after)

  return newOrder
}

function AllBoxes(props: {
  onBoxSelect: (index: number) => void
  moving?: boolean
  deleting?: boolean
  debugMode?: boolean
}) {
  const { onBoxSelect, moving, deleting, debugMode } = props
  const [{ homeData }, openSavesDispatch] = useSaves()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!active || !over) return

    const activeId = active.id.toString()
    const overId = over.id.toString()

    const activeIndex = homeData.boxes.findIndex((box) => box.id === activeId)
    const overIndex = homeData.boxes.findIndex((box) => box.id === overId)

    const newOrderIndices = newOrderFromDragEnd(activeIndex, overIndex, homeData.boxes.length)
    const newOrderIds = newOrderIndices
      .map((index) => homeData.boxes.find((box) => box.index === index)?.id)
      .filter(filterUndefined)

    openSavesDispatch({
      type: 'reorder_home_boxes',
      payload: {
        idsInNewOrder: newOrderIds,
      },
    })
  }

  return (
    <Grid columns="6" gap="1" overflowY="auto" maxHeight="80%">
      {moving ? (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext
            items={homeData.boxes.map((box) => box.id) ?? []}
            strategy={rectSortingStrategy}
          >
            {homeData.boxes.map((box, boxIndex) => (
              <SortableBoxOverview
                key={box.id}
                box={box}
                onBoxSelect={() => onBoxSelect(boxIndex)}
                debugMode={debugMode}
              />
            ))}
          </SortableContext>
        </DndContext>
      ) : (
        homeData.boxes.map((box, boxIndex) => (
          <BoxOverview
            key={box.id}
            box={box}
            onBoxSelect={() => onBoxSelect(boxIndex)}
            debugMode={debugMode}
            deleting={deleting}
          />
        ))
      )}
    </Grid>
  )
}

type BoxOverviewProps = {
  box: HomeBox
  onBoxSelect: () => void
  debugMode?: boolean
  deleting?: boolean
}

function BoxOverview({ box, onBoxSelect, debugMode, deleting }: BoxOverviewProps) {
  const [{ homeData }, openSavesDispatch] = useSaves()

  const firstOpenIndex = box.firstOpenIndex()

  return (
    <Flex>
      <DroppableSpace
        dropID={`box-${box.id}`}
        key={box.name ?? `Box ${box.index + 1}`}
        dropData={
          firstOpenIndex !== undefined
            ? {
                is_home: true,
                bank: homeData.currentBankIndex,
                box: box.index,
                box_slot: firstOpenIndex,
              }
            : undefined
        }
        disabled={firstOpenIndex === undefined}
        style={{ justifyContent: undefined }}
      >
        <div style={{ position: 'relative' }}>
          <Button
            variant="soft"
            style={{
              height: 'fit-content',
              padding: '4px 8px',
              width: '100%',
              minWidth: '100%',
            }}
            onClick={onBoxSelect}
            disabled={deleting}
          >
            <BoxWithMons box={box} debugMode={debugMode} />
          </Button>
          {deleting && (
            <Button
              className="mini-button"
              style={{
                position: 'absolute',
                zIndex: 1,
                top: 0,
                right: 0,
                backgroundColor: box.getMonCount() > 0 ? 'var(--gray-6)' : undefined,
              }}
              variant="solid"
              color="red"
              radius="full"
              disabled={box.getMonCount() > 0}
              onClick={() => {
                openSavesDispatch({
                  type: 'delete_home_box',
                  payload: { index: box.index, id: box.id },
                })
              }}
            >
              <RemoveIcon />
            </Button>
          )}
        </div>
      </DroppableSpace>
    </Flex>
  )
}

function SortableBoxOverview({ box, debugMode }: BoxOverviewProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, active } =
    useSortable({ id: box.id })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: isDragging ? 1000 : undefined,
  }

  if (!box) return <div />

  return (
    <Flex ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Button
        variant="solid"
        style={{
          height: 'fit-content',
          padding: '4px 8px',
          width: '100%',
          minWidth: '100%',
          cursor: active ? 'grabbing' : 'grab',
        }}
      >
        <BoxWithMons box={box} debugMode={debugMode} />
      </Button>
    </Flex>
  )
}

type BoxMonIconsProps = {
  box: HomeBox
  debugMode?: boolean
}

function BoxWithMons({ box, debugMode }: BoxMonIconsProps) {
  return (
    <Flex direction="column" width="100%">
      <div className="box-icon-mon-container">
        {range(HomeData.BOX_COLUMNS).map((i) => (
          <div className="box-icon-mon-col" key={`pos-display-col-${i}`}>
            {range(HomeData.BOX_ROWS).map((j) => (
              <div
                className={`box-icon-mon-indicator ${!box?.pokemon?.[j * HomeData.BOX_COLUMNS + i] ? 'box-icon-mon-empty' : ''}`}
                key={`pos-display-cell-${i}-${j}`}
              />
            ))}
          </div>
        ))}
      </div>
      {box.name ?? `Box ${box.index + 1}`}
      {debugMode && (
        <div style={{ fontWeight: 'lighter' }}>
          <div>Index: {box.index}</div>
          <div>{box.id.split('-')[0]}</div>
        </div>
      )}
    </Flex>
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
  const [timer, setTimer] = useState<NodeJS.Timeout>()
  const setViewModeRef = useRef(setViewMode)

  useEffect(() => {
    setViewModeRef.current = setViewMode
  }, [setViewMode])

  const onAllViewModeDragOver = useCallback(() => {
    if (timer) {
      clearInterval(timer)
    }

    const newTimer = setInterval(() => {
      setViewMode('all')
    }, DRAG_OVER_COOLDOWN_MS)

    setTimer(newTimer)
  }, [setViewMode, timer])

  const onNotDragOver = useCallback(() => {
    if (timer) {
      clearInterval(timer)
    }
  }, [timer])

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
