import useBackend from '@openhome-core/backend/useBackend'
import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { SAV } from '@openhome-core/save/interfaces'
import { monSupportedBySave } from '@openhome-core/save/util'
import { $R, Option, R, range, Result } from '@openhome-core/util/functional'
import { $O } from '@openhome-core/util/option'
import { isThenable, NowOrLater } from '@openhome-core/util/promise'
import { filterUndefined } from '@openhome-core/util/sort'
import AttributeRow from '@openhome-ui/components/AttributeRow'
import AttributeRowExpand from '@openhome-ui/components/AttributeRowExpand'
import { Item, OpenHomeCtxMenu, Submenu } from '@openhome-ui/components/context-menu'
import PromptDialog from '@openhome-ui/components/dialog/PromptDialog'
import Fallback from '@openhome-ui/components/Fallback'
import OhoFlex from '@openhome-ui/components/OhoFlex'
import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import SearchFields from '@openhome-ui/components/search/SearchFields'
import PokemonSearchModal from '@openhome-ui/components/search/SearchModal'
import useDisplayError from '@openhome-ui/hooks/displayError'
import PokemonDetailsModal from '@openhome-ui/pokemon/PokemonDetailsModal'
import { useCanSwapWithDragging } from '@openhome-ui/state-zustand/drag-and-drop/dragStore'
import { ErrorContext } from '@openhome-ui/state/error'
import { useOhpkmStore } from '@openhome-ui/state/ohpkm'
import useOhpkmBatchIdLookup from '@openhome-ui/state/ohpkm/useOhpkmIdBatchLookup'
import useTrackedDataRecovery from '@openhome-ui/state/ohpkm/useTrackedDataRecovery'
import { EMPTY_SLOT, MonLocation, useSaves } from '@openhome-ui/state/saves'
import { colorIsDark } from '@openhome-ui/util/color'
import { MetadataSummaryLookup } from '@pkm-rs/pkg'
import { Button, Dialog, Flex, Grid, Separator } from '@radix-ui/themes'
import { useContext, useMemo, useState } from 'react'
import { MdClose } from 'react-icons/md'
import useMultiSelect from '../../state/drag-and-drop/useMultiSelect'
import { cssClass } from '../../util/style'
import { useBoxNavigator } from '../util'
import ArrowButton from './ArrowButton'
import BoxCellAsync from './BoxCellAsync'

interface OpenSaveDisplayProps {
  saveIndex: number
}

type SlotMetadata = {
  save: SAV
  mon: NowOrLater<Result<Option<PKMInterface>>>
  openhomeId: Option<string> | undefined
  pendingMon: Option<string | symbol | PKMInterface>
}

const OpenSaveDisplay = (props: OpenSaveDisplayProps) => {
  const savesManager = useSaves()
  const { allOpenSaves, importMonsToLocation } = savesManager

  const ohpkmStore = useOhpkmStore()
  const [, dispatchError] = useContext(ErrorContext)
  const [detailsModal, setDetailsModal] = useState(false)
  const { saveIndex } = props
  const { multiSelectState, toggleSelection, isSelected } = useMultiSelect()
  const [selectedMonNotInBoxes, setSelectedMonNotInBoxes] = useState<PKMInterface>()

  const save = useMemo(() => allOpenSaves[saveIndex], [allOpenSaves, saveIndex])
  const displayError = useDisplayError()

  const allSaveMons = save.getAllMons().map((mon) => [mon, save] as const)
  const { batchResults: saveOhpkms } = useOhpkmBatchIdLookup(
    allSaveMons
      .map(([mon]) => mon)
      .map(ohpkmStore.getPotentialOhpkmId)
      .filter(filterUndefined)
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

  const {
    currentSlot: selectedIndex,
    setCurrentSlot: setSelectedIndex,
    navigateNext: navigateRight,
    navigatePrev: navigateLeft,
  } = useBoxNavigator(save, save.currentPCBox, undefined)

  const selectedMon = useMemo(() => {
    if (selectedMonNotInBoxes) return selectedMonNotInBoxes

    if (selectedIndex === undefined || selectedIndex >= save.boxSlotCount) {
      return undefined
    }
    const selectedSlot = save.getMonAt(save.currentPCBox, selectedIndex)
    if (!selectedSlot) return undefined

    const potentialOhpkmId = ohpkmStore.getPotentialOhpkmId(selectedSlot)
    if (!potentialOhpkmId) return selectedSlot

    const lookupResult = saveOhpkms?.get(potentialOhpkmId)
    if (!lookupResult) return selectedSlot

    return R.dropError(lookupResult) ?? selectedSlot
  }, [selectedMonNotInBoxes, selectedIndex, save, ohpkmStore, saveOhpkms])

  const attemptImportMons = async (mons: PKMInterface[], location: MonLocation) => {
    const unsupportedMons = mons.filter((mon) => !monSupportedBySave(save, mon))

    if (unsupportedMons.length) {
      dispatchError({
        type: 'set_message',
        payload: {
          title: 'Import Failed',
          messages: unsupportedMons.map(
            (mon) =>
              `${MetadataSummaryLookup(mon.nationalDex, mon.formIndex)?.formeName} cannot be moved into ${save.gameNameFull}`
          ),
        },
      })
      return
    }

    importMonsToLocation(mons, location)
  }

  const canSwapWithDragging = useCanSwapWithDragging(save)

  const displayData = useMemo(() => save.getDisplayData?.() ?? {}, [save])

  const allCellsDisabled = range(save.boxColumns * save.boxRows)
    .map((index: number) => save.getMonAt(save.currentPCBox, index))
    .every(canSwapWithDragging)

  const slots: SlotMetadata[] = range(save.boxColumns * save.boxRows)
    .map((index: number) => save.tryGetMonAt(save.currentPCBox, index))
    .map((_, index) => {
      const location: MonLocation = {
        isHome: false,
        box: save.currentPCBox,
        boxSlot: index,
        saveIdentifier: save.identifier,
      }

      let mon: NowOrLater<Result<Option<PKMInterface>>> = save.tryGetMonAt(
        location.box,
        location.boxSlot
      )

      if (R.isErr(mon)) {
        return { save, mon, openhomeId: undefined, pendingMon: undefined }
      }

      const openhomeIdBoxed = $O(save.getMonAt(location.box, location.boxSlot)).flatMap(
        ohpkmStore.getPotentialOhpkmId
      )

      let openhomeId = openhomeIdBoxed.get()

      const ohpkm = openhomeIdBoxed
        .flatMap((openhomeId) => saveOhpkms?.get(openhomeId))
        .map(R.dropError) // we expect many "id lookups" to fail, because not all mons are necessarily tracked
        .get()
      mon = ohpkm ? R.Ok(ohpkm) : mon

      // when a pokemon is in the process of being registered (i.e. was just dragged from a different save into
      // this one), use the pending value to avoid visual snaps back and forth
      const pendingMon = savesManager.getPendingMon(location)
      if (pendingMon === EMPTY_SLOT) {
        mon = R.Ok(undefined)
      } else if (pendingMon) {
        if (typeof pendingMon === 'string') {
          openhomeId = pendingMon
          const result = ohpkmStore.getById(openhomeId)
          mon = isThenable(result) ? result.then(R.Ok) : R.Ok(result)
        } else {
          mon = R.Ok(pendingMon)
        }
      }

      return { save, mon, openhomeId, pendingMon }
    })

  return save && save.currentPCBox !== undefined ? (
    <>
      <Flex direction="column" width="100%">
        <div
          className={cssClass('save-box-card')
            .with('save-box-card-disabled')
            .if(allCellsDisabled)
            .with('save-box-small')
            .if(save.boxColumns === 5)
            .else('save-box-standard')
            .build()}
        >
          <SaveHeader save={save} setDetailsModal={setDetailsModal} />
          <Separator />
          <div className="box-navigation pad-x-sm-lg">
            <ArrowButton
              onClick={() => savesManager.saveBoxNavigateLeft(save)}
              dragID={`arrow_left_${save.tid}_${save.sid}`}
              direction="left"
            />
            <div className="box-name">{save.getBoxName(save.currentPCBox)}</div>
            <ArrowButton
              onClick={() => savesManager.saveBoxNavigateRight(save)}
              dragID={`arrow_right_${save.tid}_${save.sid}`}
              direction="right"
            />
          </div>
          <Grid className="box-grid" columns={save.boxColumns.toString()}>
            {slots.map(({ save, mon, openhomeId }, index) => {
              const location: MonLocation = {
                isHome: false,
                box: save.currentPCBox,
                boxSlot: index,
                saveIdentifier: save.identifier,
              }

              const uniqueKey = isThenable(mon)
                ? `${save.currentPCBox}-${index}-${openhomeId}`
                : R.isOk(mon) && mon.data
                  ? `${save.currentPCBox}-${index}-${openhomeId ?? mon.data.encryptionConstant ?? mon.data.personalityValue ?? JSON.stringify(mon.data.dvs)}-${mon.data.nickname}`
                  : `${save.currentPCBox}-${index}`

              const slotMetadata = save.getSlotMetadata?.(save.currentPCBox, index)

              const borderColor =
                !isThenable(mon) && R.isOk(mon) && mon.data instanceof OHPKM
                  ? 'var(--ohpkm-cell-border-color)'
                  : undefined

              return (
                <BoxCellAsync
                  key={uniqueKey}
                  onClick={() => setSelectedIndex(index)}
                  dragID={`${save.tid}_${save.sid}_${save.currentPCBox}_${index}`}
                  location={location}
                  isDisabled={(mon) =>
                    !canSwapWithDragging(mon) || slotMetadata?.isDisabled === true
                  }
                  disabledReason={slotMetadata?.disabledReason}
                  monPromise={mon}
                  onDrop={(importedMons) => {
                    if (importedMons) {
                      attemptImportMons(importedMons, location)
                    }
                  }}
                  multiSelectEnabled={multiSelectState.multiSelectEnabled}
                  isSelected={isSelected(location)}
                  onToggleSelect={() => toggleSelection(location)}
                  contextMenu={
                    mon
                      ? [
                          Item.label(
                            mon instanceof OHPKM
                              ? 'Merge/Recover Tracking Data'
                              : 'Fix Missing Tracking Data'
                          ).action(async () =>
                            $R(await TrackedDataRecovery.startRecovery(location)).mapErr((err) =>
                              displayError('Error starting recovery process', err.message, err.data)
                            )
                          ),
                        ]
                      : []
                  }
                  borderColor={borderColor}
                />
              )
            })}
          </Grid>
        </div>
        <Dialog.Root open={detailsModal} onOpenChange={setDetailsModal}>
          <Dialog.Content className="save-details-modal">
            <AttributeRow label="Game">Pokémon {save.gameNameFull}</AttributeRow>
            <AttributeRow label="Trainer Name">{save.name}</AttributeRow>
            <AttributeRow label="Trainer Display ID">{save.displayID}</AttributeRow>
            <AttributeRow label="Trainer Real ID">
              <code>0x{save.tid.toString(16)}</code>
            </AttributeRow>
            {save.sid !== undefined && (
              <AttributeRow label="Secret ID">
                <code>0x{save.sid.toString(16)}</code>
              </AttributeRow>
            )}
            {save.trainerGender !== undefined && (
              <AttributeRow label="Trainer Gender">
                {save.trainerGender ? 'Female' : 'Male'}
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
            {Object.entries(displayData).map(([label, value]) => (
              <AttributeRow label={label} key={label}>
                {value}
              </AttributeRow>
            ))}
            <AttributeRowExpand summary="Updated Box Slots" value={save.updatedBoxSlots.length}>
              {save.updatedBoxSlots.map(({ box, boxSlot }, i) => (
                <AttributeRow label={String(i + 1)} key={`${box}-${boxSlot}`}>
                  Box {box}, Slot {boxSlot}
                </AttributeRow>
              ))}
            </AttributeRowExpand>
            <OhoFlex.RowCentered>
              {save.getDisplayPkms().map(
                ({ mon, description }) =>
                  mon && (
                    <AttributeRow label={description} key={description}>
                      <button
                        key={description}
                        onClick={() => {
                          setDetailsModal(false)
                          setSelectedMonNotInBoxes(mon)
                        }}
                        className="mon-icon-button"
                      >
                        <PokemonIcon
                          nationalDex={mon.nationalDex}
                          formIndex={mon.formIndex}
                          style={{ height: '1.75rem', width: '1.75rem' }}
                        />
                      </button>
                    </AttributeRow>
                  )
              )}
            </OhoFlex.RowCentered>
          </Dialog.Content>
        </Dialog.Root>
      </Flex>
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
      <Fallback>
        <PokemonDetailsModal
          mon={selectedMon}
          key={`${save.currentPCBox}-${selectedMon?.encryptionConstant ?? selectedMon?.personalityValue ?? JSON.stringify(selectedMon?.dvs)}-${selectedMon?.nickname}`}
          onClose={() => {
            setSelectedIndex(undefined)
            setSelectedMonNotInBoxes(undefined)
          }}
          navigateRight={navigateRight}
          navigateLeft={navigateLeft}
          boxIndicatorProps={
            selectedIndex !== undefined
              ? {
                  currentIndex: selectedIndex,
                  columns: save.boxColumns,
                  rows: save.boxRows,
                  emptyIndexes: range(save.boxColumns * save.boxRows).filter(
                    (index) => !save.getMonAt(save.currentPCBox, index)
                  ),
                }
              : undefined
          }
        />
      </Fallback>
    </>
  ) : (
    <div />
  )
}

type SaveHeaderProps = { save: SAV; setDetailsModal: (open: boolean) => void }

function SaveHeader({ save, setDetailsModal }: SaveHeaderProps) {
  const savesManager = useSaves()
  const backend = useBackend()

  const currentBoxMonCount = save.getBoxMonCount(save.currentPCBox)
  const totalMonCount = save.getPcMonCount()

  const contextElements = [
    Item.label('Details...').action(() => setDetailsModal(true)),
    Item.label('Open file location').action(() => backend.openDirectory(save.filePath.dir)),
    Submenu.label('Move to Bank...')
      .with(
        Item.label(`This Box (${currentBoxMonCount})`).action(() => {
          savesManager.moveBoxToBank(save)
        })
      )
      .with(
        Item.label(`Entire Save (${totalMonCount})`).action(() => {
          savesManager.moveSaveToBank(save)
        })
      ),
  ]

  const gameColorIsDark = colorIsDark(save.gameColor)

  return (
    <OpenHomeCtxMenu elements={contextElements}>
      <div className="save-header-container">
        <div className="save-header-inner">
          <div
            className="save-header-game diagonal-clip"
            style={{
              backgroundColor: save.gameColor,
              color: gameColorIsDark ? 'white' : 'black',
            }}
          >
            <Button
              className="save-close-button mini-button"
              onClick={() => savesManager.removeSave(save)}
              disabled={!!save.updatedBoxSlots.length}
            >
              <MdClose />
            </Button>
            {save.gameNameFull}
          </div>
          {save?.name}
        </div>
      </div>
    </OpenHomeCtxMenu>
  )
}

export default OpenSaveDisplay
