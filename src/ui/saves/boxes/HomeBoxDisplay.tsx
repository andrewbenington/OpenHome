import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { getMonFileIdentifier, OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { SortTypes } from '@openhome-core/pkm/sort'
import { monSupportedBySave } from '@openhome-core/save/util'
import { mapToObject } from '@openhome-core/util'
import { R, range } from '@openhome-core/util/functional'
import OpenHomeCtxMenu from '@openhome-ui/components/context-menu/OpenHomeCtxMenu'
import { Item, Submenu } from '@openhome-ui/components/context-menu/types'
import { DebugDataDisplay } from '@openhome-ui/components/DebugDataDisplay'
import DebugOnly from '@openhome-ui/components/DebugOnly'
import PromptDialog from '@openhome-ui/components/dialog/PromptDialog'
import {
  AddIcon,
  DevIcon,
  EditIcon,
  MenuIcon,
  MoveIcon,
  RemoveIcon,
  SelectIcon,
} from '@openhome-ui/components/Icons'
import ToggleButton from '@openhome-ui/components/ToggleButton'
import PokemonDetailsModal from '@openhome-ui/pokemon-details/Modal'
import { ErrorContext } from '@openhome-ui/state/error'
import { useOhpkmStore } from '@openhome-ui/state/ohpkm'
import { HomeMonLocation, MonLocation, MonWithLocation, useSaves } from '@openhome-ui/state/saves'
import { cssClass } from '@openhome-ui/util/style'
import { Language, Lookup } from '@pkm-rs/pkg'
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
import {
  BankBoxCoordinates,
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

export type BoxViewMode = 'one' | 'all'

const ALLOW_DUPE_IMPORT = true

export default function HomeBoxDisplay() {
  const [editing, setEditing] = useState(false)
  const [moving, setMoving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [viewMode, setViewMode] = useState<BoxViewMode>('one')
  const [editingBoxName, setEditingBoxName] = useState('')
  const [debugMode, setDebugMode] = useState(false)
  const { dragState, toggleMultiSelect } = useDragAndDrop()
  const {
    addBoxCurrentBank,
    getCurrentBox,
    removeAllHomeDupes,
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
            className={cssClass('horiz-collapse')
              .if(viewMode !== 'one')
              .build()}
            onClick={switchToPreviousBox}
            dragID="home-arrow-left"
            direction="left"
            disabled={editing}
          />
        </Flex>
        <div
          className={cssClass('box-name')
            .with('horiz-collapse')
            .if(viewMode !== 'one')
            .build()}
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
            <Heading
              style={{
                visibility: viewMode === 'one' ? 'visible' : 'collapse',
                fontSize: '1.1rem',
                lineHeight: 1.1,
              }}
            >
              {currentBox.name?.trim() || `Box ${currentBox.index + 1}`}
            </Heading>
          )}
        </div>
        <Flex align="center" flexGrow="3" width="0" justify="between">
          <ArrowButton
            className={cssClass('horiz-collapse')
              .if(viewMode !== 'one')
              .build()}
            onClick={switchToNextBox}
            dragID="home-arrow-right"
            direction="right"
            disabled={editing}
          />
          <Flex gap="1">
            <DebugDataDisplay
              data={{ ...currentBox, identifiers: mapToObject(currentBox.identifiers) }}
            />
            {viewMode === 'one' ? (
              <>
                <ToggleButton
                  state={editing}
                  setState={setEditing}
                  onSet={() => setEditingBoxName(getCurrentBox().name ?? '')}
                  onUnset={() => setBoxNameCurrentBank(currentBox.index, editingBoxName)}
                  icon={EditIcon}
                  hint="Change box name"
                  disabled={dragState.multiSelectEnabled}
                />
                <ToggleButton
                  state={dragState.multiSelectEnabled}
                  setState={toggleMultiSelect}
                  icon={SelectIcon}
                  hint={`Multi-select${dragState.selectedLocations.length > 0 ? ` (${dragState.selectedLocations.length})` : ''}`}
                  disabled={editing}
                />
              </>
            ) : (
              <>
                <DebugOnly>
                  <ToggleButton state={debugMode} setState={setDebugMode} icon={DevIcon} />
                </DebugOnly>
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
                <DropdownMenu.Item onClick={removeAllHomeDupes}>
                  Remove duplicates from all banks + boxes
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

type MissingIdData = {
  id: OhpkmIdentifier
  location: BankBoxCoordinates
}

function SingleBoxMonDisplay() {
  const ohpkmStore = useOhpkmStore()
  const { importMonsToLocation, saveFromIdentifier } = useSaves()
  const { getCurrentBox, getCurrentBank, clearAtHomeLocation, removeAllHomeDupes } =
    useBanksAndBoxes()
  const [missingIdData, setMissingIdData] = useState<MissingIdData>()
  const [, dispatchError] = useContext(ErrorContext)
  const { dragState, isSelected, toggleSelection } = useDragAndDrop()
  const { sortHomeBox, sortAllHomeBoxes } = useBanksAndBoxes()
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
          const identifier = getMonFileIdentifier(OHPKM.fromMonUnknownSave(mon))

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
    (mon: PKMInterface) =>
      !dragData || dragData?.isHome
        ? true
        : monSupportedBySave(saveFromIdentifier(dragData.saveIdentifier), mon),
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
      Submenu.label('Sort this box...').with(
        ...SortTypes.map((sortType) =>
          Item.label(`By ${sortType}`).action(() => sortHomeBox(getCurrentBox().index, sortType))
        )
      ),
      Submenu.label('Sort all boxes...').with(
        ...SortTypes.map((sortType) =>
          Item.label(`By ${sortType}`).action(() => sortAllHomeBoxes(sortType))
        )
      ),
    ],
    [getCurrentBox, sortAllHomeBoxes, sortHomeBox]
  )

  const removeDupesItem = Item.label('Remove duplicates from this box').action(removeAllHomeDupes)

  function dismissMissingIdDialog() {
    setMissingIdData(undefined)
  }

  const missingIdEvoFamily = missingIdData
    ? Lookup.speciesName(parseInt(missingIdData.id.split('-')[0]), Language.English)
    : undefined

  function clearMissingIdSlot() {
    if (missingIdData) clearAtHomeLocation(missingIdData.location)
    dismissMissingIdDialog()
  }

  return (
    <>
      <OpenHomeCtxMenu sections={[contextElements, [removeDupesItem]]}>
        <Grid className="home-box-grid" columns={OPENHOME_BOX_COLUMNS.toString()} gap="1">
          {range(OPENHOME_BOX_SLOTS)
            .map((index: number) => currentBox.identifiers.get(index))
            .map((identifier, index) => {
              const currentBankIndex = getCurrentBank().index
              const currentBoxIndex = getCurrentBox().index

              const thisLocation: HomeMonLocation = {
                bank: currentBankIndex,
                box: currentBoxIndex,
                boxSlot: index,
                isHome: true,
              }

              // if underlying data changes but this key doesn't, the box cell will be stale and may not display the correct species
              const uniqueKey = `${currentBoxIndex}-${index}-${identifier}`

              const result = identifier ? ohpkmStore.tryLoadFromId(identifier) : undefined
              if (result && R.isErr(result)) {
                return (
                  <Tooltip key={uniqueKey} content={identifier}>
                    <Button
                      className="box-slot-missing-id"
                      radius="full"
                      size="1"
                      onClick={() =>
                        identifier && setMissingIdData({ id: identifier, location: thisLocation })
                      }
                    >
                      !
                    </Button>
                  </Tooltip>
                )
              }

              const mon = result?.value

              return (
                <BoxCell
                  key={uniqueKey}
                  onClick={() => setSelectedIndex(index)}
                  dragID={`home_${currentBoxIndex}_${index}`}
                  location={thisLocation}
                  mon={mon}
                  onDrop={(importedMons) => {
                    if (importedMons) {
                      attemptImportMons(importedMons, thisLocation)
                    }
                  }}
                  disabled={
                    // don't allow a swap with a pokémon not supported by the source save
                    mon && dragData && !dragData.isHome && !sourceSupportsMon(mon)
                  }
                  contextMenu={contextElements}
                  multiSelectEnabled={dragState.multiSelectEnabled}
                  isSelected={isSelected(thisLocation)}
                  onToggleSelect={() => toggleSelection(thisLocation)}
                />
              )
            })}
        </Grid>
      </OpenHomeCtxMenu>
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
      <PromptDialog
        title="Tracking Data Missing"
        open={missingIdData !== undefined}
        onClose={dismissMissingIdDialog}
        description={`There is a Pokémon in this box slot, but its tracking data cannot be found. This Pokémon's OpenHome ID was ${missingIdData?.id}, and is was from the ${missingIdEvoFamily} evolution family.`}
        actions={[
          { uniqueLabel: 'Cancel', action: dismissMissingIdDialog, type: 'cancel' },
          { uniqueLabel: 'Clear this slot', action: clearMissingIdSlot, type: 'destructive' },
        ]}
      />
    </>
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
