import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { getMonFileIdentifier } from '@openhome-core/pkm/Lookup'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { SAV } from '@openhome-core/save/interfaces'
import { monSupportedBySave } from '@openhome-core/save/util'
import { range } from '@openhome-core/util/functional'
import { BackendContext } from '@openhome-ui/backend/backendContext'
import AttributeRow from '@openhome-ui/components/AttributeRow'
import { ItemBuilder, OpenHomeCtxMenu, SubmenuBuilder } from '@openhome-ui/components/context-menu'
import Fallback from '@openhome-ui/components/Fallback'
import { MenuIcon } from '@openhome-ui/components/Icons'
import PokemonDetailsModal from '@openhome-ui/pokemon-details/Modal'
import { ErrorContext } from '@openhome-ui/state/error'
import { useOhpkmStore } from '@openhome-ui/state/ohpkm'
import { MonLocation, useSaves } from '@openhome-ui/state/saves'
import { colorIsDark } from '@openhome-ui/util/color'
import { MetadataSummaryLookup } from '@pkm-rs/pkg'
import { Button, Card, Dialog, Flex, Grid } from '@radix-ui/themes'

import { useCallback, useContext, useMemo, useState } from 'react'
import { MdClose } from 'react-icons/md'
import useDragAndDrop from '../../state/drag-and-drop/useDragAndDrop'
import { includeClass } from '../../util/style'
import { buildBackwardNavigator, buildForwardNavigator } from '../util'
import ArrowButton from './ArrowButton'
import BoxCell from './BoxCell'

interface OpenSaveDisplayProps {
  saveIndex: number
}

const ALLOW_DUPE_IMPORT = true

const OpenSaveDisplay = (props: OpenSaveDisplayProps) => {
  const savesManager = useSaves()
  const { allOpenSaves, saveFromIdentifier, importMonsToLocation } = savesManager

  const ohpkmStore = useOhpkmStore()
  const [, dispatchError] = useContext(ErrorContext)
  const [detailsModal, setDetailsModal] = useState(false)
  const { saveIndex } = props
  const [selectedIndex, setSelectedIndex] = useState<number>()
  const { dragState, toggleSelection, isSelected } = useDragAndDrop()

  const save = useMemo(() => allOpenSaves[saveIndex], [allOpenSaves, saveIndex])

    if (selectedIndex === undefined || selectedIndex >= save.boxSlotCount) {
      return undefined
    }
    const selectedSlot = save.getMonAt(save.currentPCBox, selectedIndex)
    return selectedSlot ? ohpkmStore.monOrOhpkmIfTracked(selectedSlot) : undefined
  }, [save, ohpkmStore, selectedIndex])

  const attemptImportMons = (mons: PKMInterface[], location: MonLocation) => {
    const unsupportedMons = mons.filter((mon) => !monSupportedBySave(save, mon))

    if (unsupportedMons.length) {
      dispatchError({
        type: 'set_message',
        payload: {
          title: 'Import Failed',
          messages: unsupportedMons.map(
            (mon) =>
              `${MetadataSummaryLookup(mon.dexNum, mon.formeNum)?.formeName} cannot be moved into ${save.gameName}`
          ),
        },
      })
      return
    }

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
  }

  const isDisabled = useCallback(
    (mon?: PKMInterface) => {
      const dragPayload = dragState?.payload

      if (!dragPayload) return false

      if (dragPayload.kind === 'item') {
        return !save.supportsItem(dragPayload.item.index)
      }

      const draggingMons = Array.isArray(dragPayload.monData)
        ? dragPayload.monData
        : [dragPayload.monData]

      for (const monWithLocation of draggingMons) {
        if (!monWithLocation || Object.entries(monWithLocation).length === 0) return false // Handles a glitch that occurs when navigating between boxes and the payload becomes an empty object

        const sourceSave = monWithLocation.isHome
          ? undefined
          : saveFromIdentifier(monWithLocation.saveIdentifier)

        const sourceIsOpenHome = !sourceSave
        const monIsIncompatible =
          !monSupportedBySave(save, monWithLocation.mon) ||
          (mon && !sourceIsOpenHome && !monSupportedBySave(sourceSave, mon))

        if (monIsIncompatible) return true
      }

      return false
    },
    [dragState?.payload, saveFromIdentifier, save]
  )

  const navigateRight = useMemo(
    () => buildForwardNavigator(save, selectedIndex, setSelectedIndex),
    [save, selectedIndex]
  )

  const navigateLeft = useMemo(
    () => buildBackwardNavigator(save, selectedIndex, setSelectedIndex),
    [save, selectedIndex]
  )

  const displayData = useMemo(() => save.getDisplayData?.() ?? {}, [save])

  const allCellsDisabled = range(save.boxColumns * save.boxRows)
    .map((index: number) => save.getMonAt(save.currentPCBox, index))
    .every(isDisabled)

  return save && save.currentPCBox !== undefined ? (
    <>
      <Flex direction="column" width="100%" gap="1">
        <SaveHeader save={save} setDetailsModal={setDetailsModal} />
        <Card className={includeClass('box-card').with('box-card-disabled').if(allCellsDisabled)}>
          <div className="box-navigation">
            <Flex align="center" justify="center" flexGrow="4">
              <ArrowButton
                onClick={() => savesManager.saveBoxNavigateLeft(save)}
                dragID={`arrow_left_${save.tid}_${save.sid}`}
                direction="left"
              />
            </Flex>
            <div className="box-name">{save.getBoxName(save.currentPCBox)}</div>
            <Flex align="center" justify="center" flexGrow="4">
              <ArrowButton
                onClick={() => savesManager.saveBoxNavigateRight(save)}
                dragID={`arrow_right_${save.tid}_${save.sid}`}
                direction="right"
              />
            </Flex>
          </div>
          <Grid columns={save.boxColumns.toString()} gap="1" p="1">
            {range(save.boxColumns * save.boxRows)
              .map((index: number) => save.getMonAt(save.currentPCBox, index))
              .map((_, index) => {
                const location: MonLocation = {
                  isHome: false,
                  box: save.currentPCBox,
                  boxSlot: index,
                  saveIdentifier: save.identifier,
                }
                const mon = save.getMonAt(location.box, location.boxSlot)
                return (
                  <BoxCell
                    onClick={() => setSelectedIndex(index)}
                    key={`${save.currentPCBox}-${index}-${mon?.encryptionConstant ?? mon?.personalityValue ?? mon?.nickname ?? 'empty'}`}
                    dragID={`${save.tid}_${save.sid}_${save.currentPCBox}_${index}`}
                    location={location}
                    disabled={
                      isDisabled(mon) ||
                      save.getSlotMetadata?.(save.currentPCBox, index)?.isDisabled
                    }
                    disabledReason={
                      save.getSlotMetadata?.(save.currentPCBox, index)?.disabledReason
                    }
                    mon={mon ? ohpkmStore.monOrOhpkmIfTracked(mon) : undefined}
                    zIndex={1}
                    onDrop={(importedMons) => {
                      if (importedMons) {
                        attemptImportMons(importedMons, location)
                      }
                    }}
                    multiSelectEnabled={dragState.multiSelectEnabled}
                    isSelected={isSelected(location)}
                    onToggleSelect={() => toggleSelection(location)}
                  />
                )
              })}
          </Grid>
        </Card>
        <Dialog.Root open={detailsModal} onOpenChange={setDetailsModal}>
          <Dialog.Content
            style={{
              minWidth: 800,
              width: '80%',
              maxHeight: 'fit-content',
              height: '95%',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <AttributeRow label="Game">Pokémon {save.gameName}</AttributeRow>
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
          </Dialog.Content>
        </Dialog.Root>
      </Flex>
      <Fallback>
        <PokemonDetailsModal
          mon={selectedMon}
          onClose={() => setSelectedIndex(undefined)}
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
  const backend = useContext(BackendContext)

  const currentBoxMonCount = save.getBoxMonCount(save.currentPCBox)
  const totalMonCount = save.getAllMons().length

  const contextElements = [
    ItemBuilder.fromLabel('Details...').withAction(() => setDetailsModal(true)),
    ItemBuilder.fromLabel('Open file location').withAction(() =>
      backend.openDirectory(save.filePath.dir)
    ),
    SubmenuBuilder.fromLabel('Move to Bank...')
      .withBuilder(
        ItemBuilder.fromLabel(`This Box (${currentBoxMonCount})`).withAction(() => {
          savesManager.moveBoxToBank(save)
        })
      )
      .withBuilder(
        ItemBuilder.fromLabel(`Entire Save (${totalMonCount})`).withAction(() => {
          savesManager.moveSaveToBank(save)
        })
      ),
  ]

  return (
    <OpenHomeCtxMenu elements={contextElements}>
      <Card style={{ padding: 0 }}>
        <div className="save-header">
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
            <div
              className="save-header-game diagonal-clip"
              style={{
                backgroundColor: save.gameColor,
                color: colorIsDark(save.gameColor) ? 'white' : 'black',
              }}
            >
              <Button
                className="save-close-button"
                onClick={() => savesManager.removeSave(save)}
                disabled={!!save.updatedBoxSlots.length}
                color="tomato"
                style={{ padding: 1 }}
              >
                <MdClose />
              </Button>
              {save.gameName}
            </div>
            {save?.name}
          </div>
          <div className="save-menu-buttons-right" style={{ marginRight: 4 }}>
            <Button
              className="mini-button"
              onClick={() => setDetailsModal(true)}
              variant="outline"
              color="gray"
            >
              <MenuIcon />
            </Button>
          </div>
        </div>
      </Card>
    </OpenHomeCtxMenu>
  )
}

export default OpenSaveDisplay
