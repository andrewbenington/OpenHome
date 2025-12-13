import { FileSchemas } from '@pokemon-files/schema'
import { Dialog, Flex, VisuallyHidden } from '@radix-ui/themes'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { MdDownload } from 'react-icons/md'
import { OHPKM } from 'src/core/pkm/OHPKM'
import MiniBoxIndicator, { MiniBoxIndicatorProps } from 'src/saves/boxes/MiniBoxIndicator'
import { fileTypeFromString } from 'src/types/FileImport'
import { PKMInterface } from 'src/types/interfaces'
import { BackendContext } from 'src/ui/backend/backendContext'
import Fallback from 'src/ui/components/Fallback'
import FileTypeSelect from 'src/ui/components/FileTypeSelect'
import HexDisplay from 'src/ui/components/HexDisplay'
import { ArrowLeftIcon, ArrowRightIcon } from 'src/ui/components/Icons'
import SideTabs from 'src/ui/components/side-tabs/SideTabs'
import './style.css'
import MetDataMovesTab from './tabs/MetDataMovesTab'
import NotesDisplay from './tabs/NotesTab'
import OtherDisplay from './tabs/OtherTab'
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
  const [boxIndicatorVisible, setBoxIndicatorVisible] = useState(false)
  const [boxIndicatorTimeout, setBoxIndicatorTimeout] = useState<NodeJS.Timeout>()
  const backend = useContext(BackendContext)

  useEffect(() => setDisplayMon(mon), [mon])

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

  return (
    <Dialog.Root open={!!(mon && displayMon)} onOpenChange={(open) => !open && onClose?.()}>
      <Dialog.Content
        onKeyDown={handleArrows}
        minWidth="800px"
        maxWidth="80%"
        width="fit-content"
        style={{
          position: 'inherit',
          overflow: 'hidden',
          height: 'fit-content',
        }}
      >
        <VisuallyHidden>
          <Dialog.Title>Pokémon Details</Dialog.Title>
          <Dialog.Description>Detailed information about the selected Pokémon</Dialog.Description>
        </VisuallyHidden>
        {mon && displayMon && (
          <SideTabs.Root className="pokemon-modal-tabs" defaultValue="summary">
            <SideTabs.TabList>
              <Flex direction="row" gap="2" mb="1">
                <FileTypeSelect
                  baseFormat={mon.format}
                  currentFormat={displayMon.format}
                  color={displayMon.selectColor}
                  formData={mon}
                  onChange={(newFormat) => {
                    if (mon.format === newFormat) {
                      setDisplayMon(mon)
                      return
                    }
                    if (newFormat === 'OHPKM') {
                      setDisplayMon(mon instanceof OHPKM ? mon : new OHPKM(mon))
                      return
                    }
                    const P = fileTypeFromString(newFormat)

                    if (!P) {
                      throw `Invalid filetype: ${P}`
                    }
                    if (mon instanceof OHPKM) {
                      setDisplayMon(new P(mon as any))
                    } else {
                      setDisplayMon(new P(new OHPKM(mon) as any))
                    }
                  }}
                />
                <button
                  style={{ padding: '4px 6px 2px 6px' }}
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
                </>
              )}
              <SideTabs.Tab value="raw">Raw</SideTabs.Tab>
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
                </>
              )}
              <SideTabs.Panel value="raw">
                <Fallback>
                  <HexDisplay
                    data={
                      new Uint8Array(displayMon.toBytes({ includeExtraFields: true }))
                      // displayMon.originalBytes
                      //   ? displayMon.originalBytes
                      //   : new Uint8Array(displayMon.toBytes({ includeExtraFields: true }))
                    }
                    format={
                      displayMon.pluginIdentifier
                        ? undefined
                        : (displayMon.format as keyof typeof FileSchemas | 'OHPKM')
                    }
                  />
                </Fallback>
              </SideTabs.Panel>
            </Fallback>
          </SideTabs.Root>
        )}
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
      </Dialog.Content>
    </Dialog.Root>
  )
}

export default PokemonDetailsModal
