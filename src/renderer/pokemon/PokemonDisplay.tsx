/* eslint-disable no-nested-ternary */
import { Grid, MenuItem, Select } from '@mui/material'
import { useState } from 'react'
import {
  BW2_TRANSFER_RESTRICTIONS,
  GEN1_TRANSFER_RESTRICTIONS,
  GEN2_TRANSFER_RESTRICTIONS,
  GEN3_TRANSFER_RESTRICTIONS,
  HGSS_TRANSFER_RESTRICTIONS,
  LA_TRANSFER_RESTRICTIONS,
  LGPE_TRANSFER_RESTRICTIONS,
  ORAS_TRANSFER_RESTRICTIONS,
  USUM_TRANSFER_RESTRICTIONS,
} from '../../consts/TransferRestrictions'
import { OHPKM } from '../../types/PKMTypes'
import { isRestricted } from '../../types/TransferRestrictions'
import { StringToStringMap, Styles } from '../../types/types'
import OpenHomeButton from '../components/OpenHomeButton'
import MetDataMovesDisplay from './MetDataMovesDisplay'
import OtherDisplay from './OtherDisplay'
import RawDisplay from './RawDisplay'
import RibbonsDisplay from './RibbonsDisplay'
import StatsDisplay from './StatsDisplay'
import SummaryDisplay from './SummaryDisplay'
import { PKM } from '../../types/PKMTypes/PKM'
import { fileTypeFromString } from '../../types/PKMTypes/GamePKM'

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
  detailsTabRow: {
    display: 'flex',
    flexDirection: 'column',
    overflowX: 'scroll',
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

const fileTypeColors: StringToStringMap = {
  OHPKM: '#748fcd',
  PK1: '#b34',
  PK2: '#b6c',
  PK3: '#9b3',
  COLOPKM: '#93f',
  XDPKM: '#53b',
  PK4: '#f88',
  PK5: '#484',
  PK6: 'blue',
  PK7: 'orange',
  PB7: '#a75',
  PK8: '#6bf',
  PB8: '#6bf',
  PA8: '#8cc',
  PK9: '#f52',
}

const PokemonDisplay = (props: { mon: PKM; tab: string; setTab: (_: string) => void }) => {
  const { mon, tab, setTab } = props
  const [displayMon, setDisplayMon] = useState(mon)

  return (
    <Grid container style={styles.pokemonDisplay}>
      <Grid item xs={3}>
        <div className="scroll-no-bar" style={styles.detailsTabRow}>
          <Select
            value={displayMon.format}
            onChange={(e) => {
              if (mon.format === e.target.value) {
                setDisplayMon(mon)
                return
              }
              if (e.target.value === 'OHPKM') {
                setDisplayMon(new OHPKM(undefined, mon))
                return
              }
              const P = fileTypeFromString(e.target.value)
              if (!P) {
                throw `Invalid filetype: ${P}`
              }
              if (mon instanceof OHPKM) {
                setDisplayMon(new P(undefined, undefined, mon))
              } else {
                setDisplayMon(new P(undefined, undefined, new OHPKM(undefined, mon)))
              }
            }}
            sx={{
              ...styles.fileTypeChip,
              backgroundColor: fileTypeColors[displayMon.format],
            }}
          >
            <MenuItem value="OHPKM">OpenHome</MenuItem>
            {mon.format !== 'OHPKM' ? (
              <MenuItem value={mon.format}>{mon.format}</MenuItem>
            ) : (
              <div />
            )}
            {mon.format === 'OHPKM' &&
            !isRestricted(GEN1_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) ? (
              <MenuItem value="PK1">PK1</MenuItem>
            ) : (
              <div />
            )}
            {mon.format === 'OHPKM' &&
            !isRestricted(GEN2_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) ? (
              <MenuItem value="PK2">PK2</MenuItem>
            ) : (
              <div />
            )}
            {mon.format === 'OHPKM' &&
            !isRestricted(GEN3_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) ? (
              <MenuItem value="PK3">PK3</MenuItem>
            ) : (
              <div />
            )}
            {mon.format === 'OHPKM' &&
            !isRestricted(GEN3_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) ? (
              <MenuItem value="COLOPKM">COLOPKM</MenuItem>
            ) : (
              <div />
            )}
            {mon.format === 'OHPKM' &&
            !isRestricted(GEN3_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) ? (
              <MenuItem value="XDPKM">XDPKM</MenuItem>
            ) : (
              <div />
            )}
            {mon.format === 'OHPKM' &&
            !isRestricted(HGSS_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) ? (
              <MenuItem value="PK4">PK4</MenuItem>
            ) : (
              <div />
            )}
            {mon.format === 'OHPKM' &&
            !isRestricted(BW2_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) ? (
              <MenuItem value="PK5">PK5</MenuItem>
            ) : (
              <div />
            )}
            {mon.format === 'OHPKM' &&
            !isRestricted(ORAS_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) ? (
              <MenuItem value="PK6">PK6</MenuItem>
            ) : (
              <div />
            )}
            {mon.format === 'OHPKM' &&
            !isRestricted(USUM_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) ? (
              <MenuItem value="PK7">PK7</MenuItem>
            ) : (
              <div />
            )}
            {mon.format === 'OHPKM' &&
            !isRestricted(LGPE_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) ? (
              <MenuItem value="PB7">PB7</MenuItem>
            ) : (
              <div />
            )}
            {mon.format === 'OHPKM' && !isRestricted({}, mon.dexNum, mon.formNum) ? (
              <MenuItem value="PK8">PK8</MenuItem>
            ) : (
              <div />
            )}
            {mon.format === 'OHPKM' &&
            !isRestricted(HGSS_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) ? (
              <MenuItem value="PB8">PB8</MenuItem>
            ) : (
              <div />
            )}
            {mon.format === 'OHPKM' &&
            !isRestricted(LA_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) ? (
              <MenuItem value="PA8">PA8</MenuItem>
            ) : (
              <div />
            )}
          </Select>
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
      <Grid item xs={9}>
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
