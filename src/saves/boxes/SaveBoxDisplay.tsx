import { MetadataLookup } from '@pkm-rs/pkg'
import { Button, Card, Dialog, Flex, Grid } from '@radix-ui/themes'
import lodash, { range } from 'lodash'
import { useContext, useMemo, useState } from 'react'
import { MdClose } from 'react-icons/md'
import { BackendContext } from 'src/backend/backendContext'
import Fallback from 'src/components/Fallback'
import { MenuIcon } from 'src/components/Icons'
import AttributeRow from 'src/pokemon-details/components/AttributeRow'
import PokemonDetailsModal from 'src/pokemon-details/Modal'
import { ErrorContext } from 'src/state/error'
import { MonLocation } from 'src/state/saves/reducer'
import { PKMInterface } from 'src/types/interfaces'
import { OHPKM } from 'src/types/pkm/OHPKM'
import { getMonFileIdentifier } from 'src/util/Lookup'
import { DragMonContext } from '../../state/dragMon'
import { useOhpkmStore } from '../../state/ohpkm/useOhpkmStore'
import { useSaves } from '../../state/saves/useSaves'
import { colorIsDark } from '../../util/color'
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
  const [dragMonState] = useContext(DragMonContext)
  const backend = useContext(BackendContext)

  const save = useMemo(
    () => savesAndBanks.allOpenSaves[saveIndex],
    [savesAndBanks.allOpenSaves, saveIndex]
  )

  const currentBox = useMemo(
    () => (save.currentPCBox < save.boxes.length ? save.boxes[save.currentPCBox] : undefined),
    [save.boxes, save.currentPCBox]
  )

  const selectedMon = useMemo(() => {
    if (!currentBox || selectedIndex === undefined || selectedIndex >= currentBox.pokemon.length) {
      return undefined
    }
    return currentBox.pokemon[selectedIndex]
  }, [currentBox, selectedIndex])

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

        const inCurrentBox = save.boxes[save.currentPCBox].pokemon.some(
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
    savesAndBanks.importMonsToLocation(mons, location)
  }

  const isDisabled = useMemo(() => {
    const dragPayload = dragMonState?.payload

    if (!dragPayload) return false

    if (dragPayload.kind === 'item') {
      return !save.supportsItem(dragPayload.item.index)
    }

    const dragData = dragPayload.monData

    if (!dragData || Object.entries(dragData).length === 0) return false

    return !save.supportsMon(dragData.mon.dexNum, dragData.mon.formeNum)
  }, [save, dragMonState])

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
        <Card
          className="box-card"
          style={{
            backgroundColor: isDisabled ? '#666' : undefined,
          }}
        >
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
            {lodash
              .range(save.boxColumns * save.boxRows)
              .map((index: number) => currentBox?.pokemon?.[index])
              .map((mon, index) => (
                <BoxCell
                  onClick={() => setSelectedIndex(index)}
                  key={`${save.currentPCBox}-${index}`}
                  dragID={`${save.tid}_${save.sid}_${save.currentPCBox}_${index}`}
                  location={{
                    is_home: false,
                    box: save.currentPCBox,
                    box_slot: index,
                    save,
                  }}
                  disabled={
                    isDisabled || save.getSlotMetadata?.(save.currentPCBox, index)?.isDisabled
                  }
                  disabledReason={save.getSlotMetadata?.(save.currentPCBox, index)?.disabledReason}
                  mon={mon}
                  zIndex={1}
                  onDrop={(importedMons) => {
                    if (importedMons) {
                      attemptImportMons(importedMons, {
                        is_home: false,
                        save,
                        box: save.currentPCBox,
                        box_slot: index,
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
            <AttributeRow label="File">
              <div style={{ overflowWrap: 'break-word', width: '100%' }}>
                {save.filePath.raw}
                <button
                  style={{ padding: 0, marginLeft: 8 }}
                  onClick={() => backend.openDirectory(save.filePath.dir)}
                >
                  Open
                </button>
              </div>
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
                    (index) => !currentBox?.pokemon?.[index]
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

export default OpenSaveDisplay
