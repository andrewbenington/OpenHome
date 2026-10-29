import useBackend from '@openhome-core/backend/useBackend'
import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { SAV, saveToStringIdentifier } from '@openhome-core/save/interfaces'
import { monSupportedBySave } from '@openhome-core/save/util'
import { FullMetadataLookup } from '@openhome-core/util'
import { $R, Option, R, range, Result } from '@openhome-core/util/functional'
import { $O } from '@openhome-core/util/option'
import { isThenable, NowOrLater } from '@openhome-core/util/promise'
import { filterUndefined } from '@openhome-core/util/sort'
import { Item, OpenHomeCtxMenu, Submenu } from '@openhome-ui/components/context-menu'
import PromptDialog from '@openhome-ui/components/dialog/PromptDialog'
import Fallback from '@openhome-ui/components/Fallback'
import { ExpandArrowIcon } from '@openhome-ui/components/Icons'
import MiniButton from '@openhome-ui/components/MiniButton'
import OhoFlex from '@openhome-ui/components/OhoFlex'
import SearchFields from '@openhome-ui/components/search/SearchFields'
import PokemonSearchModal from '@openhome-ui/components/search/SearchModal'
import { useDisplayError } from '@openhome-ui/hooks/displayError'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { useOpenHomeItemTransfer, useSaveItemTransfer } from '@openhome-ui/items/transferSource'
import PokemonDetailsModal from '@openhome-ui/pokemon/PokemonDetailsModal'
import { useCanSwapWithDragging } from '@openhome-ui/state-zustand/drag-and-drop/dragStore'
import { ErrorContext } from '@openhome-ui/state/error'
import { useItemBag } from '@openhome-ui/state/items'
import { useOhpkmStore } from '@openhome-ui/state/ohpkm'
import useOhpkmBatchIdLookup from '@openhome-ui/state/ohpkm/useOhpkmIdBatchLookup'
import useTrackedDataRecovery from '@openhome-ui/state/ohpkm/useTrackedDataRecovery'
import { EMPTY_SLOT, MonLocation, useSaves } from '@openhome-ui/state/saves'
import { colorIsDark } from '@openhome-ui/util/color'
import { Button, Flex, Grid, Separator } from '@radix-ui/themes'
import { useContext, useMemo, useState } from 'react'
import { MdClose } from 'react-icons/md'
import { SaveItemsModal } from '../../items/ItemTransfer'
import useMultiSelect from '../../state/drag-and-drop/useMultiSelect'
import { cssClass } from '../../util/style'
import { SaveDetailsModal } from '../SaveDetailsModal'
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

type SaveDataModalType = 'details' | 'items'

const OpenSaveDisplay = (props: OpenSaveDisplayProps) => {
  const savesManager = useSaves()
  const { allOpenSaves, importMonsToLocation } = savesManager

  const ohpkmStore = useOhpkmStore()
  const [, dispatchError] = useContext(ErrorContext)
  const [openModal, setOpenModal] = useState<Option<SaveDataModalType>>(undefined)
  const { saveIndex } = props
  const { multiSelectState, toggleSelection, isSelected } = useMultiSelect()
  const [selectedMonNotInBoxes, setSelectedMonNotInBoxes] = useState<PKMInterface>()

  const openhomeItemBag = useItemBag()

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
              `${FullMetadataLookup(mon)?.formName} cannot be moved into ${save.gameNameFull}`
          ),
        },
      })
      return
    }

    return importMonsToLocation(mons, location)
  }

  const canSwapWithDragging = useCanSwapWithDragging(save)

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

  const saveItemTransfer = useSaveItemTransfer(save)
  const openhomeItemTransfer = useOpenHomeItemTransfer()

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
          <SaveHeader save={save} openModal={setOpenModal} />
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
                  dragID={`${saveToStringIdentifier(save)}_${save.currentPCBox}_${index}`}
                  location={location}
                  isDisabled={(mon) =>
                    !canSwapWithDragging(mon) || slotMetadata?.isDisabled === true
                  }
                  disabledReason={slotMetadata?.disabledReason}
                  monPromise={mon}
                  onDrop={async (importedMons) => {
                    if (importedMons) {
                      return await attemptImportMons(importedMons, location)
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
      </Flex>
      <SaveDetailsModal
        open={openModal === 'details'}
        setOpen={(v) => {
          if (v) {
            setOpenModal('details')
          } else if (openModal === 'details') {
            setOpenModal(undefined)
          }
        }}
        save={save}
        setSelectedMon={setSelectedMonNotInBoxes}
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
      {saveItemTransfer !== undefined && (
        <SaveItemsModal
          source1={saveItemTransfer}
          source2={openhomeItemTransfer}
          isOpen={openModal === 'items'}
          onClose={() => {
            if (openModal === 'items') {
              setOpenModal(undefined)
            }
          }}
        />
      )}
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

type SaveHeaderProps = {
  save: SAV
  openModal: (type: SaveDataModalType) => void
}

function SaveHeader({ save, openModal }: SaveHeaderProps) {
  const savesManager = useSaves()
  const backend = useBackend()

  const currentBoxMonCount = save.getBoxMonCount(save.currentPCBox)
  const totalMonCount = save.getPcMonCount()

  const contextElements = [
    Item.label('Details...').action(() => openModal('details')),
    Item.label('Items...').action(() => openModal('items')),
    Item.label('Open file location').action(() => backend.openDirectory(save.filePath.dir)),
    Submenu.label('Move to Bank...')
      .with(
        Item.label(`This Box (${currentBoxMonCount})`).action(() =>
          savesManager.moveBoxToBank(save)
        )
      )
      .with(
        Item.label(`Entire Save (${totalMonCount})`).action(() => savesManager.moveSaveToBank(save))
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
              className="save-close-button"
              onClick={() => savesManager.removeSave(save)}
              disabled={!!save.updatedBoxSlots.length}
            >
              <MdClose />
            </Button>
            {save.gameNameFull}
          </div>
          {save?.name}
          <OhoFlex.RowEnd gap="var(--padding-radius-sm-lg)">
            {save.getItemInventory && (
              <MiniButton
                onClick={() => openModal('items')}
                imageSrc={getPublicImageURL('items/index/0000.png')}
              />
            )}
            <MiniButton onClick={() => openModal('items')} icon={ExpandArrowIcon} />
          </OhoFlex.RowEnd>
        </div>
      </div>
    </OpenHomeCtxMenu>
  )
}

export default OpenSaveDisplay
