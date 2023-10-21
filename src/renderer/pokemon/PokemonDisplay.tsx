/* eslint-disable no-nested-ternary */
import { Grid } from '@mui/material'
import { useState } from 'react'
import { OHPKM } from '../../types/PKMTypes'
import { fileTypeFromString } from '../../types/PKMTypes/GamePKM'
import { PKM } from '../../types/PKMTypes/PKM'
import { Styles } from '../../types/types'
import OpenHomeButton from '../components/OpenHomeButton'
import FileTypeSelect from './FileTypeSelect'
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
    '.MuiOutlinedInput-notchedOutline': { border: 0 },
  },
} as Styles

const PokemonDisplay = (props: { mon: PKM; tab: string; setTab: (_: string) => void }) => {
  const { mon, tab, setTab } = props
  const [displayMon, setDisplayMon] = useState(mon)

  return (
    <Grid container style={styles.pokemonDisplay}>
      <Grid item xs={3}>
        <div style={styles.detailsTabCol}>
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
                setDisplayMon(mon instanceof OHPKM ? mon : new OHPKM(undefined, mon))
                return
              }
              const P = fileTypeFromString(newFormat)
              if (!P) {
                throw `Invalid filetype: ${P}`
              }
              if (mon instanceof OHPKM) {
                setDisplayMon(new P(undefined, undefined, mon))
              } else {
                setDisplayMon(new P(undefined, undefined, new OHPKM(undefined, mon)))
              }
            }}
          />
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
              backgroundColor: tab === 'raw' ? '#fff4' : '#0000',
            }}
            onClick={() => setTab('raw')}
          >
            Raw
          </OpenHomeButton>
        </div>
      </Grid>
      <Grid item xs={9} style={styles.displayContainer}>
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
        ) : (
          <RawDisplay bytes={displayMon.bytes} />
        )}
      </Grid>
    </Grid>
  )
}

export default PokemonDisplay
