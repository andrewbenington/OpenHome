import { fileTypeFromStringNonOhpkm } from '@openhome-core/pkm/FileImport'
import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { OHPKM, originalDataTagToMonFormat } from '@openhome-core/pkm/OHPKM'
import { BackendContext } from '@openhome-ui/backend/backendContext'
import { Dialog } from '@openhome-ui/components/dialog/Dialog'
import Fallback from '@openhome-ui/components/Fallback'
import FileTypeSelect from '@openhome-ui/components/FileTypeSelect'
import HexDisplay from '@openhome-ui/components/HexDisplay'
import { ArrowLeftIcon, ArrowRightIcon } from '@openhome-ui/components/Icons'
import SideTabs from '@openhome-ui/components/side-tabs/SideTabs'
import useDisplayError from '@openhome-ui/hooks/displayError'
import MiniBoxIndicator, { MiniBoxIndicatorProps } from '@openhome-ui/saves/boxes/MiniBoxIndicator'
import { PkmFormat } from '@pkm-rs/pkg/pkm_rs'
import { isRomHackFormat } from '@pokemon-files/pkm/PKM'
import { FileSchemas } from '@pokemon-files/schema'
import { Flex, Switch, VisuallyHidden } from '@radix-ui/themes'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { MdDownload } from 'react-icons/md'
import { GameIndicator } from '../components/pokemon/indicator/GameIndicator'
import PokemonIcon from '../components/PokemonIcon'
import LogsPage from '../pages/logs/LogsPage'
import { useConvertStrategies } from '../state/convert-strategies'
import './style.css'
import DisplayTab from './tabs/DisplayTab'
import MetDataMovesTab from './tabs/MetDataMovesTab'
import NotesDisplay from './tabs/NotesTab'
import OtherDisplay from './tabs/OtherTab'
import RecentSaveTab from './tabs/RecentSaveTab'
import RibbonsDisplay from './tabs/RibbonsTab'
import StatsDisplay from './tabs/StatsTab'
import SummaryDisplay from './tabs/SummaryTab'
import TrainersDisplay from './tabs/TrainersTab'

const PokemonDetailsModal = (props: {
  mon?: PKMInterface
  onClose?: () => void
  navigateLeft?: () => void
  navigateRight?: () => void
  boxIndicatorProps?: MiniBoxIndicatorProps
}) => {
  const {
    mon,
    onClose,
    navigateLeft: navigateLeftProp,
    navigateRight: navigateRightProp,
    boxIndicatorProps,
  } = props
  const [displayMon, setDisplayMon] = useState(mon)
  const [isOriginal, setIsOriginal] = useState(false)
  const [boxIndicatorVisible, setBoxIndicatorVisible] = useState(false)
  const [boxIndicatorTimeout, setBoxIndicatorTimeout] = useState<NodeJS.Timeout>()
  const { defaultConvertStrategy } = useConvertStrategies()
  const backend = useContext(BackendContext)
  const displayError = useDisplayError()

  useEffect(() => {
    setDisplayMon(mon)
    setIsOriginal(false)
  }, [mon])

  const showTemporaryBoxIndicator = useCallback(() => {
    setBoxIndicatorVisible(true)
    if (boxIndicatorTimeout) {
      clearTimeout(boxIndicatorTimeout)
    }
    const timeout = setTimeout(() => setBoxIndicatorVisible(false), 1000)

    setBoxIndicatorTimeout(timeout)
  }, [boxIndicatorTimeout])

  const navigateLeft = useMemo(
    () =>
      navigateLeftProp
        ? () => {
            navigateLeftProp()
            showTemporaryBoxIndicator()
          }
        : undefined,
    [showTemporaryBoxIndicator, navigateLeftProp]
  )

  const navigateRight = useMemo(
    () =>
      navigateRightProp
        ? () => {
            navigateRightProp()
            showTemporaryBoxIndicator()
          }
        : undefined,
    [showTemporaryBoxIndicator, navigateRightProp]
  )

  const handleArrows = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'ArrowLeft') {
        navigateLeft?.()
      } else if (e.key === 'ArrowRight') {
        navigateRight?.()
      }
    },
    [navigateLeft, navigateRight]
  )

  function updateIsOriginal(isOriginal: boolean) {
    setIsOriginal(isOriginal)
    if (isOriginal && mon instanceof OHPKM && mon.originalData) {
      if (isOriginal && mon.originalData) {
        const O = fileTypeFromStringNonOhpkm(originalDataTagToMonFormat(mon.originalData.tag))
        if (O) {
          setDisplayMon(O.fromBytes(mon.originalData.data.buffer as ArrayBuffer))
          return
        }
      }
      switchFormat(originalDataTagToMonFormat(mon.originalData.tag))
    } else if (mon) {
      switchFormat(mon.format)
    }
  }

  function switchFormat(newFormat: PkmFormat | 'OHPKM') {
    if (!mon) return
    if (mon.format === newFormat) {
      setDisplayMon(mon)
      return
    }

    if (newFormat === 'OHPKM') {
      setDisplayMon(mon instanceof OHPKM ? mon : OHPKM.fromMonUnknownSave(mon))
      return
    }

    const P = fileTypeFromStringNonOhpkm(newFormat)

    if (!P) {
      throw `Invalid filetype: ${P}`
    }

    try {
      if (mon instanceof OHPKM) {
        if (
          isOriginal &&
          mon.originalData &&
          originalDataTagToMonFormat(mon.originalData.tag) === newFormat
        ) {
          const O =
            fileTypeFromStringNonOhpkm(originalDataTagToMonFormat(mon.originalData.tag)) ?? P
          setDisplayMon(O.fromBytes(mon.originalData.data.buffer as ArrayBuffer))
        } else {
          setDisplayMon(P.fromOhpkm(mon, defaultConvertStrategy))
        }
      } else {
        setDisplayMon(P.fromOhpkm(OHPKM.fromMonUnknownSave(mon), defaultConvertStrategy))
      }
    } catch (e) {
      console.error(e)
      displayError(`Error converting to ${P.getFormat()}`, `${e}`)
    }
  }

  if (!mon) return null

  return (
    <Dialog.Root open={!!(mon && displayMon)} onOpenChange={(open) => !open && onClose?.()}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup className="pokemon-modal" onKeyDown={handleArrows}>
          <VisuallyHidden>
            <Dialog.Title>Pokémon Details</Dialog.Title>
            <Dialog.Description>Detailed information about the selected Pokémon</Dialog.Description>
          </VisuallyHidden>
          {mon && displayMon && (
            <SideTabs.Root className="pokemon-modal-tabs" defaultValue="summary">
              <SideTabs.TabList>
                <Flex direction="row" gap="var(--padding-radius-sm-lg">
                  <FileTypeSelect
                    baseFormat={mon.format}
                    currentFormat={displayMon.format}
                    color={displayMon.selectColor}
                    formData={mon}
                    disabled={isOriginal}
                    onChange={switchFormat}
                  />
                  <button
                    className="mini-button"
                    onClick={() => {
                      displayMon.refreshChecksum?.()
                      backend.saveLocalFile(
                        new Uint8Array(displayMon.toBytes()),
                        `${displayMon.nickname}.${displayMon.format.toLocaleLowerCase()}`
                      )
                    }}
                  >
                    <MdDownload style={{ color: 'white' }} />
                  </button>
                </Flex>
                <SideTabs.Tab value="summary">Summary</SideTabs.Tab>
                <SideTabs.Tab value="moves_met_data">Moves/Met Data</SideTabs.Tab>
                <SideTabs.Tab value="stats">Stats</SideTabs.Tab>
                <SideTabs.Tab value="ribbons">Ribbons</SideTabs.Tab>
                <SideTabs.Tab value="other">Other</SideTabs.Tab>
                {mon instanceof OHPKM && (
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
                {(isOriginal || (mon instanceof OHPKM && mon.originalData)) && (
                  <Flex className="original-data-switch" align="center" gap="2">
                    <Switch
                      radius="full"
                      size="1"
                      checked={isOriginal}
                      onCheckedChange={updateIsOriginal}
                    />
                    Show Original
                  </Flex>
                )}
              </SideTabs.TabList>
              <Fallback>
                <SideTabs.Panel value="summary">
                  <SummaryDisplay mon={displayMon} />
                </SideTabs.Panel>
                <SideTabs.Panel value="moves_met_data">
                  <MetDataMovesTab mon={displayMon} />
                </SideTabs.Panel>
                <SideTabs.Panel value="stats">
                  <StatsDisplay mon={displayMon} />
                </SideTabs.Panel>
                <SideTabs.Panel value="ribbons">
                  <RibbonsDisplay mon={displayMon} />
                </SideTabs.Panel>
                <SideTabs.Panel value="other">
                  <OtherDisplay mon={displayMon} />
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
                      <DisplayTab mon={mon} key={mon.openhomeId} />
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
                      data={new Uint8Array(displayMon.toBytes({ includeExtraFields: true }))}
                      format={
                        isRomHackFormat(displayMon.format)
                          ? undefined
                          : (displayMon.format as keyof typeof FileSchemas | 'OHPKM')
                      }
                    />
                  </Fallback>
                </SideTabs.Panel>
              </Fallback>
            </SideTabs.Root>
          )}
          <div className="modal-footer">
            <Flex gap="1" align="center" minWidth="7rem">
              <PokemonIcon
                dexNumber={mon.dexNum}
                formeNumber={mon.formNum}
                style={{ width: '1rem', height: '1rem' }}
              />
              {mon.nickname}
            </Flex>
            <Flex gap="1" align="center" minWidth="5rem">
              <GameIndicator
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
          <button className="modal-arrow modal-arrow-left" onClick={navigateLeft}>
            <ArrowLeftIcon />
          </button>
        )}
        {navigateRight && (
          <button className="modal-arrow modal-arrow-right" onClick={navigateRight}>
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

export default PokemonDetailsModal
