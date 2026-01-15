import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { getMonFileIdentifier } from '@openhome-core/pkm/Lookup'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { SAV } from '@openhome-core/save/interfaces'
import { range } from '@openhome-core/util/functional'
import { BackendContext } from '@openhome-ui/backend/backendContext'
import AttributeRow from '@openhome-ui/components/AttributeRow'
import { ItemBuilder, OpenHomeCtxMenu } from '@openhome-ui/components/context-menu'
import Fallback from '@openhome-ui/components/Fallback'
import { MenuIcon } from '@openhome-ui/components/Icons'
import PokemonDetailsModal from '@openhome-ui/pokemon-details/Modal'
import { ErrorContext } from '@openhome-ui/state/error'
import { useOhpkmStore } from '@openhome-ui/state/ohpkm'
import { MonLocation, useSaves } from '@openhome-ui/state/saves'
import { colorIsDark } from '@openhome-ui/util/color'
import { MetadataLookup } from '@pkm-rs/pkg'
import { Button, Card, Dialog, Flex, Grid } from '@radix-ui/themes'

import { useContext, useMemo, useState } from 'react'
import { MdClose } from 'react-icons/md'
import { isTracked } from 'src/tracker'
import useDragAndDrop from '../../state/drag-and-drop/useDragAndDrop'
import { buildBackwardNavigator, buildForwardNavigator } from '../util'
import ArrowButton from './ArrowButton'
import BoxCell from './BoxCell'

interface OpenSaveDisplayProps {
  saveIndex: number
}

const ALLOW_DUPE_IMPORT = true

const OpenSaveDisplay = (props: OpenSaveDisplayProps) => {
  const savesAndBanks = useSaves()
  const ohpkmStore = useOhpkmStore()
  const [, dispatchError] = useContext(ErrorContext)
  const [detailsModal, setDetailsModal] = useState(false)
  const { saveIndex } = props
  const [selectedIndex, setSelectedIndex] = useState<number>()
  const { dragState } = useDragAndDrop()

  const save = useMemo(
    () => savesAndBanks.allOpenSaves[saveIndex],
    [savesAndBanks.allOpenSaves, saveIndex]
  )

  const currentBox = useMemo(
    () => (save.currentPCBox < save.boxes.length ? save.boxes[save.currentPCBox] : undefined),
    [save.boxes, save.currentPCBox]
  )

  const selectedMon = useMemo(() => {
    if (!currentBox || selectedIndex === undefined || selectedIndex >= currentBox.boxSlots.length) {
      return undefined
    }
    return ohpkmStore.loadOhpkmIfTracked(currentBox.boxSlots[selectedIndex])
  }, [currentBox, ohpkmStore, selectedIndex])

  const attemptImportMons = (mons: PKMInterface[], location: MonLocation) => {
    const unsupportedMons = mons.filter((mon) => !save.supportsMon(mon.dexNum, mon.formeNum))

    if (unsupportedMons.length) {
      dispatchError({
        type: 'set_message',
        payload: {
          title: 'Import Failed',
          messages: unsupportedMons.map(
            (mon) =>
              `${MetadataLookup(mon.dexNum, mon.formeNum)?.formeName} cannot be moved into ${save.gameName}`
          ),
        },
      })
      return
    }

    for (const mon of mons) {
      try {
        const identifier = getMonFileIdentifier(new OHPKM(mon))

        if (!identifier) continue

        const inCurrentBox = save.boxes[save.currentPCBox].boxSlots.some(
          (mon) => mon && isTracked(mon) && mon.identifier === identifier
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
    savesAndBanks.importMonsToLocation(mons, location)
  }

  const isDisabled = useMemo(() => {
    const dragPayload = dragState?.payload

    if (!dragPayload) return false

    if (dragPayload.kind === 'item') {
      return !save.supportsItem(dragPayload.item.index)
    }

    const dragData = dragPayload.monData

    if (!dragData || Object.entries(dragData).length === 0) return false

    return !save.supportsMon(dragData.mon.dexNum, dragData.mon.formeNum)
  }, [save, dragState?.payload])

  const navigateRight = useMemo(
    () => buildForwardNavigator(save, selectedIndex, setSelectedIndex),
    [save, selectedIndex]
  )

  const navigateLeft = useMemo(
    () => buildBackwardNavigator(save, selectedIndex, setSelectedIndex),
    [save, selectedIndex]
  )

  const displayData = useMemo(() => save.getDisplayData?.() ?? {}, [save])

  return save && save.currentPCBox !== undefined ? (
    <>
      <Flex direction="column" width="100%" gap="1">
        <SaveHeader save={save} setDetailsModal={setDetailsModal} />
        <Card className="box-card" style={{ backgroundColor: isDisabled ? '#666' : undefined }}>
          <div className="box-navigation">
            <Flex align="center" justify="center" flexGrow="4">
              <ArrowButton
                onClick={() => savesAndBanks.saveBoxNavigateLeft(save)}
                dragID={`arrow_left_${save.tid}_${save.sid}`}
                direction="left"
              />
            </Flex>
            <div className="box-name">{save.boxes[save.currentPCBox]?.name}</div>
            <Flex align="center" justify="center" flexGrow="4">
              <ArrowButton
                onClick={() => savesAndBanks.saveBoxNavigateRight(save)}
                dragID={`arrow_right_${save.tid}_${save.sid}`}
                direction="right"
              />
            </Flex>
          </div>
          <Grid columns={save.boxColumns.toString()} gap="1" p="1">
            {range(save.boxColumns * save.boxRows)
              .map((index: number) => currentBox?.boxSlots?.[index])
              .map((mon, index) => (
                <BoxCell
                  onClick={() => setSelectedIndex(index)}
                  key={`${save.currentPCBox}-${index}`}
                  dragID={`${save.tid}_${save.sid}_${save.currentPCBox}_${index}`}
                  location={{
                    is_home: false,
                    box: save.currentPCBox,
                    box_slot: index,
                    saveIdentifier: save.identifier,
                  }}
                  disabled={
                    isDisabled || save.getSlotMetadata?.(save.currentPCBox, index)?.isDisabled
                  }
                  disabledReason={save.getSlotMetadata?.(save.currentPCBox, index)?.disabledReason}
                  mon={ohpkmStore.loadOhpkmIfTracked(mon)}
                  zIndex={1}
                  onDrop={(importedMons) => {
                    if (importedMons) {
                      attemptImportMons(importedMons, {
                        is_home: false,
                        box: save.currentPCBox,
                        box_slot: index,
                        saveIdentifier: save.identifier,
                      })
                    }
                  }}
                />
              ))}
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
                    (index) => !currentBox?.boxSlots?.[index]
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
  const savesAndBanks = useSaves()
  const backend = useContext(BackendContext)

  const contextElements = [
    ItemBuilder.fromLabel('Details...').withAction(() => setDetailsModal(true)),
    ItemBuilder.fromLabel('Open file location').withAction(() =>
      backend.openDirectory(save.filePath.dir)
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
                onClick={() => savesAndBanks.removeSave(save)}
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
