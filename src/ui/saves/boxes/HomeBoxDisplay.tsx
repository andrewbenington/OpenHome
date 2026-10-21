import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import { SortTypes } from '@openhome-core/pkm/sort'
import { mapToObject } from '@openhome-core/util'
import { $R, Option, R, range } from '@openhome-core/util/functional'
import { isThenable } from '@openhome-core/util/promise'
import OpenHomeCtxMenu from '@openhome-ui/components/context-menu/OpenHomeCtxMenu'
import { Item, Separator, Submenu } from '@openhome-ui/components/context-menu/types'
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
import SearchFields from '@openhome-ui/components/search/SearchFields'
import PokemonSearchModal from '@openhome-ui/components/search/SearchModal'
import ToggleButton from '@openhome-ui/components/ToggleButton'
import useDisplayError from '@openhome-ui/hooks/displayError'
import PokemonDetailsModal from '@openhome-ui/pokemon/PokemonDetailsModal'
import {
  useDragSourceSupportsMon,
  useIsDraggingActive,
} from '@openhome-ui/state-zustand/drag-and-drop/dragStore'
import { useOhpkmStore } from '@openhome-ui/state/ohpkm'
import useTrackedDataRecovery from '@openhome-ui/state/ohpkm/useTrackedDataRecovery'
import { EMPTY_SLOT, HomeMonLocation, useSaves } from '@openhome-ui/state/saves'
import { cssClass } from '@openhome-ui/util/style'
import { Button, Card, DropdownMenu, Flex, Heading, TextField, Tooltip } from '@radix-ui/themes'
import { ToggleGroup } from 'radix-ui'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BsFillGrid3X3GapFill } from 'react-icons/bs'
import { FaSquare } from 'react-icons/fa'
import {
  OPENHOME_BOX_COLUMNS,
  OPENHOME_BOX_ROWS,
  OPENHOME_BOX_SLOTS,
  useBanksAndBoxes,
} from '../../state-zustand/banks-and-boxes/store'
import useMultiSelect from '../../state/drag-and-drop/useMultiSelect'
import { useOpenHomeBoxNavigator } from '../util'
import AllHomeBoxes from './AllHomeBoxes'
import ArrowButton from './ArrowButton'
import BoxCellAsync, { BoxSlotContents } from './BoxCellAsync'
import DroppableSpace from './DroppableSpace'
import './style.css'

export type BoxViewMode = 'one' | 'all'

export default function HomeBoxDisplay() {
  const [editing, setEditing] = useState(false)
  const [moving, setMoving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [viewMode, setViewMode] = useState<BoxViewMode>('one')
  const [editingBoxName, setEditingBoxName] = useState('')
  const [debugMode, setDebugMode] = useState(false)
  const { multiSelectState, toggleMultiSelect } = useMultiSelect()
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
                  disabled={multiSelectState.multiSelectEnabled}
                />
                <ToggleButton
                  state={multiSelectState.multiSelectEnabled}
                  setState={toggleMultiSelect}
                  icon={SelectIcon}
                  hint={`Multi-select${multiSelectState.selectedLocations.length > 0 ? ` (${multiSelectState.selectedLocations.length})` : ''}`}
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
        viewMode === 'all' && (
          <AllHomeBoxes
            onBoxSelect={(boxIndex) => {
              switchBoxCurrentBank(boxIndex)
              setViewMode('one')
            }}
            moving={moving}
            deleting={deleting}
            debugMode={debugMode}
          />
        )
      )}
    </Card>
  )
}

type SlotData = {
  monPromise: BoxSlotContents
  location: HomeMonLocation
  identifier: Option<OhpkmIdentifier>
}

function SingleBoxMonDisplay() {
  const ohpkmStore = useOhpkmStore()
  const displayError = useDisplayError()
  const { importMonsToLocation, getPendingMon } = useSaves()
  const { getCurrentBox, getCurrentBank, removeAllHomeDupes } = useBanksAndBoxes()
  const { multiSelectState: dragState, isSelected, toggleSelection } = useMultiSelect()
  const { sortHomeBox, sortAllHomeBoxes } = useBanksAndBoxes()
  const {
    currentIndex: selectedIndex,
    setCurrentIndex: setSelectedIndex,
    navigateNext: navigateRight,
    navigatePrev: navigateLeft,
    selectedMon,
  } = useOpenHomeBoxNavigator()

  const currentBox = getCurrentBox()
  const getById = ohpkmStore.tryLoadFromId
  const lookupOhpkmById = useCallback(
    (identifier: OhpkmIdentifier) => getById(identifier),
    [getById]
  )

  const TrackedDataRecovery = useTrackedDataRecovery()
  const dataRecoverySearchModal = {
    modalOpen: TrackedDataRecovery.state !== 'initial',
    setModalOpen: (open: boolean) => {
      if (!open) {
        TrackedDataRecovery.cancelRecovery()
      }
    },
  }

  const sourceSupportsMon = useDragSourceSupportsMon()

  const contextElements = useMemo(
    () => [
      Submenu.label('Sort this box...').with(
        ...SortTypes.map((sortType) =>
          Item.label(`By ${sortType}`).action(() => sortHomeBox(currentBox.index, sortType))
        )
      ),
      Submenu.label('Sort all boxes...').with(
        ...SortTypes.map((sortType) =>
          Item.label(`By ${sortType}`).action(() => sortAllHomeBoxes(sortType))
        )
      ),
    ],
    [currentBox, sortAllHomeBoxes, sortHomeBox]
  )

  const removeDupesItem = Item.label('Remove duplicates from this box').action(removeAllHomeDupes)

  const currentBankIndex = getCurrentBank().index
  const currentBoxIndex = getCurrentBox().index

  const slots: SlotData[] = useMemo(
    () =>
      range(OPENHOME_BOX_SLOTS)
        .map((index: number) => currentBox.identifiers.get(index))
        .map((storedId, index) => {
          const location: HomeMonLocation = {
            bank: currentBankIndex,
            box: currentBoxIndex,
            boxSlot: index,
            isHome: true,
          }

          let identifier = storedId
          let monPromise: BoxSlotContents = R.Ok(undefined) as BoxSlotContents

          // pendingMon means this slot is in the process of being updated, but needs to wait
          // for the OHPKM data to be registered. In the meantime the pendingMon should be displayed
          // for immediate visual feedback
          const pendingMon = getPendingMon(location)
          if (pendingMon === EMPTY_SLOT) {
            identifier = undefined
          } else if (pendingMon) {
            if (typeof pendingMon === 'string') {
              identifier = pendingMon
            } else {
              identifier = undefined
              monPromise = R.Ok(pendingMon) as BoxSlotContents
            }
          }

          if (identifier) {
            const lookupResult = lookupOhpkmById(identifier)
            if (isThenable(lookupResult)) {
              monPromise = lookupResult
            } else if (lookupResult) {
              monPromise = lookupOhpkmById(identifier)
            }
          }

          return { monPromise, location, identifier }
        }),
    [currentBankIndex, currentBox.identifiers, currentBoxIndex, getPendingMon, lookupOhpkmById]
  )

  return (
    <>
      <OpenHomeCtxMenu sections={[contextElements, [removeDupesItem]]}>
        <div className="home-box-grid">
          {slots.map(({ monPromise, location, identifier }, index) => {
            // if underlying data changes but this key doesn't, the box cell will be stale and may not display the correct species
            let uniqueKey = identifier ?? `${currentBoxIndex}-${index}`

            let monNowOrLater: Option<PKMInterface> = undefined

            // if (monPromise && !isThenable(monPromise) && isResult(monPromise)) {
            //   if (R.isOk(monPromise)) {
            //     monNowOrLater = monPromise.data
            //   } else {
            //     const { identifier } = monPromise.error
            //     console.error(identifier)
            //     return (
            //       <MissingOhpkmIdPrompt
            //         key={uniqueKey}
            //         openhomeId={identifier}
            //         location={location}
            //       />
            //     )
            //   }
            // }

            return (
              <BoxCellAsync
                key={uniqueKey}
                monPlaceholder={!isThenable(monNowOrLater) ? monNowOrLater : undefined}
                monPromise={monPromise}
                onClick={() => setSelectedIndex(index)}
                dragID={`home_${currentBoxIndex}_${index}`}
                location={location}
                openhomeId={identifier}
                onDrop={(importedMons) => {
                  if (importedMons) {
                    importMonsToLocation(importedMons, location)
                  }
                }}
                // don't allow a swap with a pokémon not supported by the source save
                isDisabled={(mon) => mon !== undefined && !sourceSupportsMon(mon)}
                contextMenu={[
                  Item.label('Merge/Recover Tracking Data').action(async () =>
                    $R(await TrackedDataRecovery.startRecovery(location)).mapErr((err) =>
                      displayError('Error starting recovery process', err.message, err.data)
                    )
                  ),
                  Separator,
                  ...contextElements,
                ]}
                multiSelectEnabled={dragState.multiSelectEnabled}
                isSelected={isSelected(location)}
                onToggleSelect={() => toggleSelection(location)}
              />
            )
          })}
        </div>
      </OpenHomeCtxMenu>
      <PokemonDetailsModal
        mon={selectedMon}
        key={selectedMon?.openhomeId}
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
      <PokemonSearchModal
        typeName="Pokémon"
        title={TrackedDataRecovery.selectDataPrompt}
        searchController={TrackedDataRecovery.pokemonSearchController}
        onSelect={(chosen) => TrackedDataRecovery.selectRecoveredDataId(chosen.openhomeId)}
        modalController={dataRecoverySearchModal}
        SearchComponent={SearchFields.Pokemon}
      />
      <PromptDialog
        title={TrackedDataRecovery.confirmPromptTitle}
        description={TrackedDataRecovery.confirmPromptDescription}
        actions={[
          {
            uniqueLabel: 'Cancel',
            action: () => TrackedDataRecovery.goBack(),
            type: 'cancel',
          },
          {
            uniqueLabel: 'Confirm',
            action: async () => {
              $R(await TrackedDataRecovery.confirmRecovery()).mapErr((err) => {
                TrackedDataRecovery.goBack()
                displayError('Error recovering Pokémon data', err.message, err.data)
              })
            },
            type: 'destructive',
          },
        ]}
        open={TrackedDataRecovery.state === 'pending_confirm'}
      />
    </>
  )
}

type ViewToggleProps = {
  viewMode: BoxViewMode
  setViewMode: (mode: BoxViewMode) => void
  disabled?: boolean
}

const DRAG_OVER_COOLDOWN_MS = 1000

// necessary for incompatibility between Node and web api
type TimeoutType = ReturnType<typeof setTimeout>

function ViewToggle(props: ViewToggleProps) {
  const { viewMode, setViewMode, disabled } = props
  const draggingActive = useIsDraggingActive()
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
      <ToggleGroup.Item value="one" className="ToggleGroupItem" disabled={draggingActive}>
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
