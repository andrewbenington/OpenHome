import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { getMonFileIdentifier } from '@openhome-core/pkm/Lookup'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { SortTypes } from '@openhome-core/pkm/sort'
import { R, range } from '@openhome-core/util/functional'
import OpenHomeCtxMenu from '@openhome-ui/components/context-menu/OpenHomeCtxMenu'
import { ItemBuilder, SubmenuBuilder } from '@openhome-ui/components/context-menu/types'
import {
  AddIcon,
  DevIcon,
  EditIcon,
  MenuIcon,
  MoveIcon,
  RemoveIcon,
} from '@openhome-ui/components/Icons'
import ToggleButton from '@openhome-ui/components/ToggleButton'
import useIsDev from '@openhome-ui/hooks/isDev'
import PokemonDetailsModal from '@openhome-ui/pokemon-details/Modal'
import { ErrorContext } from '@openhome-ui/state/error'
import { useOhpkmStore } from '@openhome-ui/state/ohpkm'
import { HomeMonLocation, MonLocation, MonWithLocation, useSaves } from '@openhome-ui/state/saves'
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
import { ToggleGroup } from 'radix-ui'
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { BsFillGrid3X3GapFill } from 'react-icons/bs'
import { FaSquare } from 'react-icons/fa'
import { includeClass } from 'src/ui/util/style'
import {
  OPENHOME_BOX_COLUMNS,
  OPENHOME_BOX_ROWS,
  OPENHOME_BOX_SLOTS,
  useBanksAndBoxes,
} from '../../state-zustand/banks-and-boxes/store'
import useDragAndDrop from '../../state/drag-and-drop/useDragAndDrop'
import { useOpenHomeBoxNavigator } from '../util'
import AllHomeBoxes from './AllHomeBoxes'
import ArrowButton from './ArrowButton'
import BoxCell from './BoxCell'
import DroppableSpace from './DroppableSpace'
import './style.css'

const COLUMN_COUNT = 12
const ROW_COUNT = 10

type BoxViewMode = 'one' | 'all'

const ALLOW_DUPE_IMPORT = true

export default function HomeBoxDisplay() {
  const [editing, setEditing] = useState(false)
  const [moving, setMoving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [viewMode, setViewMode] = useState<BoxViewMode>('one')
  const [editingBoxName, setEditingBoxName] = useState('')
  const isDev = useIsDev()
  const [debugMode, setDebugMode] = useState(false)
  const {
    addBoxCurrentBank,
    getCurrentBox,
    removeDupesFromHomeBox,
    setBoxNameCurrentBank,
    sortAllHomeBoxes,
    sortHomeBox,
    switchBoxCurrentBank,
    switchToNextBox,
    switchToPreviousBox,
  } = useBanksAndBoxes()

  const currentBox = getCurrentBox()

  return (
    <Card variant="surface" className="home-box-header">
      <Flex direction="row" className="box-navigation">
        <Flex align="center" justify="between" flexGrow="3" width="0">
          <ViewToggle viewMode={viewMode} setViewMode={setViewMode} disabled={editing || moving} />
          <ArrowButton
            className={includeClass('horiz-collapse').if(viewMode !== 'one')}
            onClick={switchToPreviousBox}
            dragID="home-arrow-left"
            direction="left"
            disabled={editing}
          />
        </Flex>
        <div
          className={includeClass('box-name')
            .with('horiz-collapse')
            .if(viewMode !== 'one')}
        >
          {editing ? (
            <TextField.Root
              value={editingBoxName}
              size="1"
              style={{ minWidth: 0, textAlign: 'center' }}
              placeholder={`Box ${currentBox.index + 1}`}
              onChange={(e) => setEditingBoxName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setBoxNameCurrentBank(currentBox.index, editingBoxName)
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
            className={includeClass('horiz-collapse').if(viewMode !== 'one')}
            onClick={switchToNextBox}
            dragID="home-arrow-right"
            direction="right"
            disabled={editing}
          />
          <Flex gap="1">
            {viewMode === 'one' ? (
              <ToggleButton
                state={editing}
                setState={setEditing}
                onSet={() => setEditingBoxName(getCurrentBox().name ?? '')}
                onUnset={() => setBoxNameCurrentBank(currentBox.index, editingBoxName)}
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
                    onClick={() => addBoxCurrentBank('end')}
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
                          onClick={() => sortHomeBox(getCurrentBox().index, sortType)}
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
                      <DropdownMenu.Item key={sortType} onClick={() => sortAllHomeBoxes(sortType)}>
                        By {sortType}
                      </DropdownMenu.Item>
                    ))}
                  </DropdownMenu.SubContent>
                </DropdownMenu.Sub>
                <DropdownMenu.Item onClick={() => removeDupesFromHomeBox(getCurrentBox().index)}>
                  Remove duplicates from this box
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </Flex>
        </Flex>
      </Flex>
      {viewMode === 'one' ? (
        <SingleBoxMonDisplay />
      ) : (
        <AllHomeBoxes
          onBoxSelect={(boxIndex) => {
            switchBoxCurrentBank(boxIndex)
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

function SingleBoxMonDisplay() {
  const ohpkmStore = useOhpkmStore()
  const { importMonsToLocation, saveFromIdentifier } = useSaves()
  const { getCurrentBox, getCurrentBank } = useBanksAndBoxes()
  const [, dispatchError] = useContext(ErrorContext)
  const { dragState } = useDragAndDrop()
  const { sortHomeBox, sortAllHomeBoxes, removeDupesFromHomeBox } = useBanksAndBoxes()
  const {
    currentIndex: selectedIndex,
    setCurrentIndex: setSelectedIndex,
    navigateNext: navigateRight,
    navigatePrev: navigateLeft,
  } = useOpenHomeBoxNavigator()

  const attemptImportMons = useCallback(
    (mons: PKMInterface[], location: MonLocation) => {
      for (const mon of mons) {
        try {
          const identifier = getMonFileIdentifier(new OHPKM(mon))

          if (!identifier) continue

          if (!ALLOW_DUPE_IMPORT && ohpkmStore.monIsStored(identifier)) {
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
      importMonsToLocation(mons, location)
    },
    [dispatchError, importMonsToLocation, ohpkmStore]
  )

  const dragData: MonWithLocation | undefined = useMemo(() => {
    const payload = dragState.payload

    if (payload?.kind === 'mon') {
      return payload.monData
    }
    return undefined
  }, [dragState.payload])

  const sourceSupportsMon = useCallback(
    (dexNum: number, formeNum: number) =>
      !dragData || dragData?.isHome
        ? true
        : saveFromIdentifier(dragData.saveIdentifier).supportsMon(dexNum, formeNum),
    [dragData, saveFromIdentifier]
  )

  const currentBox = getCurrentBox()

  const selectedMon = useMemo(() => {
    if (!currentBox || selectedIndex === undefined || selectedIndex >= OPENHOME_BOX_SLOTS) {
      return undefined
    }
    const selectedMonIdentifier = currentBox.identifiers.get(selectedIndex)
    if (!selectedMonIdentifier) return undefined

    return ohpkmStore.getById(selectedMonIdentifier)
  }, [currentBox, ohpkmStore, selectedIndex])

  const contextElements = useMemo(
    () => [
      ItemBuilder.fromLabel('Remove duplicates from this box').withAction(() =>
        removeDupesFromHomeBox(getCurrentBox().index)
      ),
      SubmenuBuilder.fromLabel('Sort this box...').withBuilders(
        SortTypes.map((sortType) =>
          ItemBuilder.fromLabel(`By ${sortType}`).withAction(() =>
            sortHomeBox(getCurrentBox().index, sortType)
          )
        )
      ),
      SubmenuBuilder.fromLabel('Sort all boxes...').withBuilders(
        SortTypes.map((sortType) =>
          ItemBuilder.fromLabel(`By ${sortType}`).withAction(() => sortAllHomeBoxes(sortType))
        )
      ),
    ],
    [getCurrentBox, removeDupesFromHomeBox, sortAllHomeBoxes, sortHomeBox]
  )

  return (
    <OpenHomeCtxMenu elements={contextElements}>
      <div>
        <Grid columns={COLUMN_COUNT.toString()} gap="1">
          {range(COLUMN_COUNT * ROW_COUNT)
            .map((index: number) => currentBox.identifiers.get(index))
            .map((identifier, index) => {
              const result = identifier ? ohpkmStore.tryLoadFromId(identifier) : undefined
              const currentBankIndex = getCurrentBank().index
              const currentBoxIndex = getCurrentBox().index

              if (result && R.isErr(result)) {
                return <div key={`${currentBoxIndex}-${index}`}>!</div>
              }

              const mon = result?.value

              const thisLocation: HomeMonLocation = {
                bank: currentBankIndex,
                box: currentBoxIndex,
                boxSlot: index,
                isHome: true,
              }

              return (
                <BoxCell
                  key={`${currentBoxIndex}-${index}`}
                  onClick={() => setSelectedIndex(index)}
                  dragID={`home_${currentBoxIndex}_${index}`}
                  location={thisLocation}
                  mon={mon}
                  zIndex={0}
                  onDrop={(importedMons) => {
                    if (importedMons) {
                      attemptImportMons(importedMons, thisLocation)
                    }
                  }}
                  disabled={
                    // don't allow a swap with a pokémon not supported by the source save
                    mon &&
                    dragData &&
                    !dragData.isHome &&
                    !sourceSupportsMon(mon.dexNum, mon.formeNum)
                  }
                  ctxMenuBuilders={contextElements}
                />
              )
            })}
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
                  columns: OPENHOME_BOX_COLUMNS,
                  rows: OPENHOME_BOX_ROWS,
                  emptyIndexes: range(OPENHOME_BOX_SLOTS).filter(
                    (boxSlot) => !currentBox.identifiers.has(boxSlot)
                  ),
                }
              : undefined
          }
        />
      </div>
    </OpenHomeCtxMenu>
  )
}

type ViewToggleProps = {
  viewMode: BoxViewMode
  setViewMode: (mode: BoxViewMode) => void
  disabled?: boolean
}

const DRAG_OVER_COOLDOWN_MS = 500

// necessary for incompatibility between Node and web api
type TimeoutType = ReturnType<typeof setTimeout>

function ViewToggle(props: ViewToggleProps) {
  const { viewMode, setViewMode, disabled } = props
  const { dragState } = useDragAndDrop()
  const [timer, setTimer] = useState<TimeoutType>()
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
      <ToggleGroup.Item
        value="one"
        className="ToggleGroupItem"
        disabled={Boolean(dragState.payload)}
      >
        <FaSquare />
      </ToggleGroup.Item>
      <ToggleGroup.Item value="all" className="ToggleGroupItem">
        <DroppableSpace
          dropID={'all-boxes-toggle'}
          onOver={onAllViewModeDragOver}
          onNotOver={onNotDragOver}
        >
          <BsFillGrid3X3GapFill />
        </DroppableSpace>
      </ToggleGroup.Item>
    </ToggleGroup.Root>
  )
}
