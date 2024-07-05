/* eslint-disable no-nested-ternary */
import { Download } from '@mui/icons-material'
import { Box, Grid } from '@mui/material'
import { PKM } from 'pokemon-files'
import { useMemo, useState } from 'react'
import { ErrorBoundary, FallbackProps } from 'react-error-boundary'
import { OHPKM } from '../../types/pkm'
import { fileTypeFromString } from '../../types/pkm/FileImport'
import { Styles } from '../../types/types'
import OpenHomeButton from '../components/OpenHomeButton'
import FileTypeSelect from './FileTypeSelect'
import JSONDisplay from './JSONDisplay'
import MetDataMovesDisplay from './MetDataMovesDisplay'
import OtherDisplay from './OtherDisplay'
import RawDisplay from './RawDisplay'
import RibbonsDisplay from './RibbonsDisplay'
import StatsDisplay from './StatsDisplay'
import SummaryDisplay from './SummaryDisplay'

const styles = {
  tabScrollContainer: {
    backgroundColor: '#fff4',
    height: '100%',
    overflow: 'scroll',
  },
  detailsPane: {
    width: '50%',
    height: '100%',
    borderTopRightRadius: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  pokemonDisplay: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    height: '100%',
  },
  pokemonSprite: { width: 24, height: 24, marginRight: 5 },
  tabButton: {
    margin: 0,
    borderRadius: 0,
    fontSize: 16,
    padding: '10px 20px 12px 20px',
  },
  detailsTabCol: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflowY: 'scroll',
  },
  displayContainer: {
    height: '100%',
    overflowY: 'scroll',
  },
  fileTypeChip: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    border: 0,
    margin: 1,
    boxShadow: 'none',
  },
} as Styles

const PokemonDisplay = (props: { mon: PKM | OHPKM; tab: string; setTab: (_: string) => void }) => {
  const { mon, tab, setTab } = props
  const [displayMon, setDisplayMon] = useState(mon)
  const url = useMemo(
    () => window.URL.createObjectURL(new Blob([displayMon.toBytes()])),
    [displayMon]
  )

  return (
    <Grid container style={styles.pokemonDisplay}>
      <Grid item xs={3}>
        <div style={styles.detailsTabCol}>
          <Box display="flex">
            <FileTypeSelect
              baseFormat={mon.format}
              currentFormat={displayMon.format}
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
                <Download sx={{ color: 'white' }} />
              </a>
            </button>
          </Box>
          <OpenHomeButton
            style={{
              ...styles.tabButton,
              backgroundColor: tab === 'summary' ? '#fff4' : '#0000',
            }}
            onClick={() => setTab('summary')}
          >
            Summary
          </OpenHomeButton>
          <OpenHomeButton
            style={{
              ...styles.tabButton,
              backgroundColor: tab === 'metDataMoves' ? '#fff4' : '#0000',
            }}
            onClick={() => setTab('metDataMoves')}
          >
            Moves/Met Data
          </OpenHomeButton>
          <OpenHomeButton
            style={{
              ...styles.tabButton,
              backgroundColor: tab === 'stats' ? '#fff4' : '#0000',
            }}
            onClick={() => setTab('stats')}
          >
            Stats
          </OpenHomeButton>
          <OpenHomeButton
            style={{
              ...styles.tabButton,
              backgroundColor: tab === 'ribbons' ? '#fff4' : '#0000',
            }}
            onClick={() => setTab('ribbons')}
          >
            Ribbons
          </OpenHomeButton>
          <OpenHomeButton
            style={{
              ...styles.tabButton,
              backgroundColor: tab === 'other' ? '#fff4' : '#0000',
            }}
            onClick={() => setTab('other')}
          >
            Other
          </OpenHomeButton>
          <OpenHomeButton
            style={{
              ...styles.tabButton,
              backgroundColor: tab === 'json' ? '#fff4' : '#0000',
            }}
            onClick={() => setTab('json')}
          >
            JSON
          </OpenHomeButton>
          <OpenHomeButton
            style={{
              ...styles.tabButton,
              backgroundColor: tab === 'raw' ? '#fff4' : '#0000',
            }}
            onClick={() => setTab('raw')}
          >
            Raw
          </OpenHomeButton>
        </div>
      </Grid>
      <Grid item xs={9} style={styles.displayContainer}>
        <ErrorBoundary FallbackComponent={FallbackComponent}>
          {tab === 'summary' ? (
            <SummaryDisplay mon={displayMon} />
          ) : tab === 'metDataMoves' ? (
            <MetDataMovesDisplay mon={displayMon} />
          ) : tab === 'stats' ? (
            <StatsDisplay mon={displayMon} />
          ) : tab === 'ribbons' ? (
            <RibbonsDisplay mon={displayMon} />
          ) : tab === 'other' ? (
            <OtherDisplay mon={displayMon} />
          ) : tab === 'json' ? (
            <JSONDisplay mon={displayMon} />
          ) : (
            <RawDisplay
              bytes={
                'bytes' in displayMon ? displayMon.bytes : new Uint8Array(displayMon.toBytes())
              }
            />
          )}
        </ErrorBoundary>
      </Grid>
    </Grid>
  )
}

export default PokemonDisplay
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
