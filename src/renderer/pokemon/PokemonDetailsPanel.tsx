/* eslint-disable no-nested-ternary */
import { Stack, Tab, tabClasses, TabList, TabPanel, Tabs } from '@mui/joy'
import { useMemo, useState } from 'react'
import { ErrorBoundary, FallbackProps } from 'react-error-boundary'
import { MdDownload } from 'react-icons/md'
import { fileTypeFromString } from '../../types/FileImport'
import { PKMInterface } from '../../types/interfaces'
import { OHPKM } from '../../types/pkm/OHPKM'
import FileTypeSelect from './FileTypeSelect'
import JSONDisplay from './JSONDisplay'
import MetDataMovesDisplay from './MetDataMovesDisplay'
import OtherDisplay from './OtherDisplay'
import RawDisplay from './RawDisplay'
import RibbonsDisplay from './RibbonsDisplay'
import StatsDisplay from './StatsDisplay'
import SummaryDisplay from './SummaryDisplay'

const PokemonDetailsPanel = (props: {
  mon: PKMInterface
  tab?: string
  setTab?: (_: string) => void
}) => {
  const { mon, tab, setTab } = props
  const [displayMon, setDisplayMon] = useState(mon)
  const url = useMemo(
    () => window.URL.createObjectURL(new Blob([displayMon.toBytes({ includeExtraFields: true })])),
    [displayMon]
  )

  return (
    <Tabs
      orientation="vertical"
      color="primary"
      value={tab ?? 'summary'}
      style={{ height: '100%', width: '100%' }}
      onChange={(_, val) => setTab && setTab(val as string)}
    >
      <TabList
        disableUnderline
        sx={{
          whiteSpace: 'nowrap',
          p: 0.8,
          gap: 0.5,
          [`& .${tabClasses.root}`]: {
            borderRadius: 'lg',
          },
          [`& .${tabClasses.root}[aria-selected="true"]`]: {
            boxShadow: 'sm',
          },
        }}
        variant="solid"
        color="primary"
      >
        <Stack direction="row">
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
          <button style={{ margin: '8px 0px', padding: '4px 6px' }}>
            <a
              href={url}
              download={`${displayMon.nickname}.${displayMon.format.toLocaleLowerCase()}`}
            >
              <MdDownload style={{ color: 'white' }} />
            </a>
          </button>
        </Stack>
        <Tab value="summary" disableIndicator color="primary" variant="solid">
          Summary
        </Tab>
        <Tab value="moves_met_data" disableIndicator color="primary" variant="solid">
          Moves/Met Data
        </Tab>
        <Tab value="stats" disableIndicator color="primary" variant="solid">
          Stats
        </Tab>
        <Tab value="ribbons" disableIndicator color="primary" variant="solid">
          Ribbons
        </Tab>
        <Tab value="other" disableIndicator color="primary" variant="solid">
          Other
        </Tab>
        <Tab value="json" disableIndicator color="primary" variant="solid">
          JSON
        </Tab>
        <Tab value="raw" disableIndicator color="primary" variant="solid">
          Raw
        </Tab>
      </TabList>
      <ErrorBoundary FallbackComponent={FallbackComponent}>
        <TabPanel value="summary">
          <SummaryDisplay mon={displayMon} />
        </TabPanel>
        <TabPanel value="moves_met_data">
          <MetDataMovesDisplay mon={displayMon} />
        </TabPanel>
        <TabPanel value="stats">
          <StatsDisplay mon={displayMon} />
        </TabPanel>
        <TabPanel value="ribbons">
          <RibbonsDisplay mon={displayMon} />
        </TabPanel>
        <TabPanel value="other">
          <OtherDisplay mon={displayMon} />
        </TabPanel>
        <TabPanel value="json">
          <JSONDisplay mon={displayMon} />
        </TabPanel>
        <TabPanel value="raw">
          <RawDisplay
            bytes={
              displayMon.originalBytes
                ? displayMon.originalBytes
                : new Uint8Array(displayMon.toBytes({ includeExtraFields: true }))
            }
            format={displayMon.pluginIdentifier ? undefined : displayMon.format}
          />
        </TabPanel>
      </ErrorBoundary>
    </Tabs>
  )
}

export default PokemonDetailsPanel

function FallbackComponent(props: FallbackProps) {
  const { error, resetErrorBoundary } = props
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <p>{JSON.stringify(Object.getPrototypeOf(error))}</p>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  )
}
