import useBackend from '@openhome-core/backend/useBackend'
import { PkmOrOhpkmFormat } from '@openhome-core/pkm'
import { fileTypeFromStringNonOhpkm } from '@openhome-core/pkm/FileImport'
import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { OHPKM, originalDataTagToMonFormat } from '@openhome-core/pkm/OHPKM'
import { isRomHackFormat } from '@openhome-core/pkm/PKM'
import { FileSchemas } from '@openhome-core/pkm/schema'
import { $R, Option, R, Result } from '@openhome-core/util/functional'
import Badge from '@openhome-ui/components/badge/Badge'
import { Dialog } from '@openhome-ui/components/dialog/Dialog'
import Fallback from '@openhome-ui/components/Fallback'
import FileTypeSelect from '@openhome-ui/components/FileTypeSelect'
import HexDisplay from '@openhome-ui/components/HexDisplay'
import { ArrowLeftIcon, ArrowRightIcon } from '@openhome-ui/components/Icons'
import MessageRibbon from '@openhome-ui/components/MessageRibbon'
import SideTabs from '@openhome-ui/components/side-tabs/SideTabs'
import MiniBoxIndicator, { MiniBoxIndicatorProps } from '@openhome-ui/saves/boxes/MiniBoxIndicator'
import { ConvertStrategy, OriginalDataJs, PkmFormat } from '@pkm-rs/pkg'
import { Flex, Switch, VisuallyHidden } from '@radix-ui/themes'
import { useCallback, useEffect, useState } from 'react'
import { MdDownload } from 'react-icons/md'
import PokemonIcon from '../components/PokemonIcon'
import LogsPage from '../pages/logs/LogsPage'
import { useConvertStrategies } from '../state/convert-strategies'
import './style.css'
import DisplayTab from './tabs/DisplayTab'
import MetDataTab from './tabs/MetDataTab'
import MovesTab from './tabs/MovesTab'
import NotesDisplay from './tabs/NotesTab'
import OtherDisplay from './tabs/OtherTab'
import RecentSaveTab from './tabs/RecentSaveTab'
import RibbonsDisplay from './tabs/RibbonsTab'
import StatsDisplay from './tabs/StatsTab'
import SummaryDisplay from './tabs/SummaryTab'
import TrainersDisplay from './tabs/TrainersTab'

export type PokemonDetailsModalProps = {
  mon?: PKMInterface
  onClose?: () => void
  navigateLeft?: () => void
  navigateRight?: () => void
  boxIndicatorProps?: MiniBoxIndicatorProps
}

export default function PokemonDetailsModal(props: PokemonDetailsModalProps) {
  const { mon, onClose, navigateLeft, navigateRight, boxIndicatorProps } = props
  const [boxIndicatorVisible, setBoxIndicatorVisible] = useState(false)
  const [boxIndicatorTimeout, setBoxIndicatorTimeout] = useState<NodeJS.Timeout>()

  const showTemporaryBoxIndicator = useCallback(() => {
    setBoxIndicatorVisible(true)
    if (boxIndicatorTimeout) {
      clearTimeout(boxIndicatorTimeout)
    }
    const timeout = setTimeout(() => setBoxIndicatorVisible(false), 1000)

    setBoxIndicatorTimeout(timeout)
  }, [boxIndicatorTimeout])

  const navigateLeftWithIndicator = useCallback(() => {
    if (navigateLeft) {
      navigateLeft()
      showTemporaryBoxIndicator()
    }
  }, [navigateLeft, showTemporaryBoxIndicator])

  const navigateRightWithIndicator = useCallback(() => {
    if (navigateRight) {
      navigateRight()
      showTemporaryBoxIndicator()
    }
  }, [navigateRight, showTemporaryBoxIndicator])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.stopPropagation()
        navigateLeftWithIndicator?.()
      } else if (e.key === 'ArrowRight') {
        e.stopPropagation()
        navigateRightWithIndicator?.()
      }
    }
    window.addEventListener('keydown', handler, true) // true = capture
    return () => window.removeEventListener('keydown', handler, true)
  }, [navigateLeftWithIndicator, navigateRightWithIndicator])

  if (!mon) return null

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose?.()}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup className="pokemon-modal">
          <VisuallyHidden>
            <Dialog.Title>Pokémon Details</Dialog.Title>
            <Dialog.Description>Detailed information about the selected Pokémon</Dialog.Description>
          </VisuallyHidden>
          <Fallback>
            <ModalContents mon={mon} />
          </Fallback>
          <div className="modal-footer">
            <Flex gap="1" align="center" minWidth="7rem">
              <PokemonIcon
                nationalDex={mon.nationalDex}
                formIndex={mon.formIndex}
                style={{ width: '1rem', height: '1rem' }}
              />
              {mon.nickname}
            </Flex>
            <Flex gap="1" align="center" minWidth="5rem">
              <Badge.Game
                originGame={mon.gameOfOrigin}
                plugin={mon.pluginOrigin}
                style={{ minWidth: 15, height: 15 }}
              />
              {mon.trainerName}
            </Flex>
            {mon.personalityValue && (
              <code>PID {mon.personalityValue.toString(16).padStart(8, '0')}</code>
            )}
            <div>Level {mon.getLevel()}</div>
            <div style={{ flex: 1 }} />
            {mon instanceof OHPKM && (
              <div>Tracked since {mon.startedTrackingTimestamp?.format('MMMM D, YYYY')}</div>
            )}
          </div>
        </Dialog.Popup>
        {navigateLeft && (
          <button className="modal-arrow modal-arrow-left" onClick={navigateLeftWithIndicator}>
            <ArrowLeftIcon />
          </button>
        )}
        {navigateRight && (
          <button className="modal-arrow modal-arrow-right" onClick={navigateRightWithIndicator}>
            <ArrowRightIcon />
          </button>
        )}
        {boxIndicatorProps && (
          <div
            className="modal-box-indicator-wrapper"
            style={{ opacity: boxIndicatorVisible ? 1 : 0, pointerEvents: 'none' }}
          >
            <MiniBoxIndicator {...boxIndicatorProps} />
          </div>
        )}
      </Dialog.Portal>
    </Dialog.Root>
  )
}

type ModalContentsProps = {
  mon: PKMInterface
}

const TAB_QUERY_KEY = 'pokemon-modal-tab'

function ModalContents(props: ModalContentsProps) {
  const { mon } = props
  const backend = useBackend()

  const displayMonController = useDisplayMon(mon)
  const { displayFormat, setDisplayFormat, showOriginal, setShowOriginal } = displayMonController

  const displayMon = $R(displayMonController.displayMon)
  const displayMonOrFallback = displayMon.orElse(mon)

  return (
    <SideTabs.Root className="pokemon-modal-tabs" defaultValue="summary" queryKey={TAB_QUERY_KEY}>
      <SideTabs.TabList>
        <Flex direction="row" gap="var(--padding-radius-sm-lg">
          <FileTypeSelect
            baseFormat={mon.format}
            currentFormat={displayFormat ?? mon.format}
            color={displayMonOrFallback.selectColor}
            formData={mon}
            disabled={showOriginal}
            onChange={setDisplayFormat}
          />
          <button
            className="mini-button"
            onClick={() => {
              displayMonOrFallback.refreshChecksum?.()
              backend.saveLocalFile(
                new Uint8Array(displayMonOrFallback.toBytes()),
                `${displayMonOrFallback.nickname}.${displayMonOrFallback.format.toLocaleLowerCase()}`
              )
            }}
          >
            <MdDownload style={{ color: 'white' }} />
          </button>
        </Flex>
        <SideTabs.Tab value="summary">Summary</SideTabs.Tab>
        <SideTabs.Tab value="moves">Moves</SideTabs.Tab>
        <SideTabs.Tab value="met_data">Met Data</SideTabs.Tab>
        <SideTabs.Tab value="stats">Stats</SideTabs.Tab>
        <SideTabs.Tab value="ribbons">Ribbons</SideTabs.Tab>
        <SideTabs.Tab value="other">Other</SideTabs.Tab>
        {displayMonOrFallback instanceof OHPKM && (
          <>
            <SideTabs.Tab value="trainers">Trainers</SideTabs.Tab>
            <SideTabs.Tab value="notes">Notes</SideTabs.Tab>
            <SideTabs.Tab value="display">Display</SideTabs.Tab>
            <SideTabs.Tab value="recent-save">Recent Save</SideTabs.Tab>
            <SideTabs.Tab value="logs">Logs</SideTabs.Tab>
          </>
        )}
        <SideTabs.Tab value="raw">Raw</SideTabs.Tab>
        <div style={{ flex: 1 }} />
        {(showOriginal || (mon instanceof OHPKM && mon.originalData)) && (
          <Flex className="original-data-switch" align="center" gap="2">
            <Switch
              radius="full"
              size="1"
              checked={showOriginal}
              onCheckedChange={setShowOriginal}
            />
            Show Original
          </Flex>
        )}
      </SideTabs.TabList>
      {displayMon.match(
        (mon) => (
          <Fallback>
            <SideTabs.Panel value="summary">
              <SummaryDisplay mon={mon} />
            </SideTabs.Panel>
            <SideTabs.Panel value="moves">
              <MovesTab mon={mon} />
            </SideTabs.Panel>
            <SideTabs.Panel value="met_data">
              <MetDataTab mon={mon} />
            </SideTabs.Panel>
            <SideTabs.Panel value="stats">
              <StatsDisplay mon={mon} />
            </SideTabs.Panel>
            <SideTabs.Panel value="ribbons">
              <RibbonsDisplay mon={mon} />
            </SideTabs.Panel>
            <SideTabs.Panel value="other">
              <OtherDisplay mon={mon} />
            </SideTabs.Panel>
            {mon instanceof OHPKM && (
              <>
                <SideTabs.Panel value="trainers">
                  <TrainersDisplay mon={mon} />
                </SideTabs.Panel>
                <SideTabs.Panel value="notes">
                  <NotesDisplay mon={mon} />
                </SideTabs.Panel>
                <SideTabs.Panel value="display">
                  <DisplayTab mon={mon} />
                </SideTabs.Panel>
                <SideTabs.Panel value="recent-save">
                  <RecentSaveTab mon={mon} />
                </SideTabs.Panel>
                <SideTabs.Panel value="logs">
                  <LogsPage openhomeIdFilter={mon.openhomeId} />
                </SideTabs.Panel>
              </>
            )}
            <SideTabs.Panel value="raw">
              <Fallback>
                <HexDisplay
                  data={new Uint8Array(mon.toBytes({ includeExtraFields: true }))}
                  format={
                    isRomHackFormat(mon.format)
                      ? undefined
                      : (mon.format as keyof typeof FileSchemas | 'OHPKM')
                  }
                />
              </Fallback>
            </SideTabs.Panel>
          </Fallback>
        ),
        (error) => (
          <MessageRibbon type="error">{error}</MessageRibbon>
        )
      )}
    </SideTabs.Root>
  )
}

type DisplayMonController = {
  displayMon: Result<PKMInterface>
  displayFormat: Option<PkmOrOhpkmFormat>
  showOriginal: boolean
  setShowOriginal: (value: boolean) => void
  setDisplayFormat: (newFormat: PkmOrOhpkmFormat) => void
}

function useDisplayMon(mon: PKMInterface): DisplayMonController {
  // currentFormat should always be undefined if displaying the current data
  const [displayFormat, setDisplayFormat] = useState<Option<PkmOrOhpkmFormat>>()
  const [showOriginal, setShowOriginal] = useState(false)
  const { defaultConvertStrategy } = useConvertStrategies()

  function setDisplayFormatIfDifferent(newFormat: PkmOrOhpkmFormat) {
    setDisplayFormat(newFormat === mon.format ? undefined : newFormat)
  }

  const originalMon = mon instanceof OHPKM ? mon.originalData : undefined

  return {
    displayFormat:
      showOriginal && originalMon ? originalDataTagToMonFormat(originalMon.tag) : displayFormat,
    setDisplayFormat: setDisplayFormatIfDifferent,
    showOriginal,
    setShowOriginal,
    displayMon: getDisplayMon(mon, displayFormat, showOriginal, defaultConvertStrategy),
  }
}

function isOhkmFormat(format: PkmOrOhpkmFormat): format is 'OHPKM' {
  return format === 'OHPKM'
}

function getDisplayMon(
  mon: PKMInterface,
  displayFormat: Option<PkmOrOhpkmFormat>,
  showOriginal: boolean,
  convertStrategy: ConvertStrategy
): Result<PKMInterface> {
  if (showOriginal && mon instanceof OHPKM && mon.originalData) {
    return getDisplayOriginalPkm(mon.originalData)
  }
  if (!displayFormat || mon.format === displayFormat) {
    return R.Ok(mon)
  }

  if (isOhkmFormat(displayFormat)) {
    return R.Ok(OHPKM.fromMonUnknownSave(mon))
  } else if (!(mon instanceof OHPKM)) {
    return R.Err(
      'If mon is not an OHPKM, the display format must either be its current format or OHPKM'
    )
  }

  return getDisplayOhpkm(mon, displayFormat, showOriginal, convertStrategy)
}

function getDisplayOhpkm(
  mon: OHPKM,
  displayFormat: PkmFormat,
  showOriginal: boolean,
  convertStrategy: ConvertStrategy
): Result<PKMInterface> {
  if (showOriginal && mon.originalData) {
    return getDisplayOriginalPkm(mon.originalData)
  }

  const PkmClass = fileTypeFromStringNonOhpkm(displayFormat)

  if (!PkmClass) {
    return R.Err(`Invalid filetype: ${PkmClass}`)
  }

  const ohpkm = mon instanceof OHPKM ? mon : OHPKM.fromMonUnknownSave(mon)

  return $R(PkmClass.fromOhpkm(ohpkm, convertStrategy)).mapErr(
    (error) => `Failed to convert OHPKM to ${PkmClass.getFormat()}: ${error}`
  )
}

function getDisplayOriginalPkm(originalData: OriginalDataJs): Result<PKMInterface> {
  const OriginalPkmClass = fileTypeFromStringNonOhpkm(originalDataTagToMonFormat(originalData.tag))
  if (!OriginalPkmClass) {
    return R.Err(`originalData.tag is an invalid filetype: ${originalData.tag}`)
  }

  const originalDataBytes = originalData.data.buffer as ArrayBuffer

  try {
    return R.Ok(OriginalPkmClass.fromBytes(originalDataBytes))
  } catch (e) {
    console.error(e)
    return R.Err(String(e))
  }
}
