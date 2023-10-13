/* eslint-disable no-nested-ternary */
/* eslint-disable no-else-return */
import { MenuItem, Select } from '@mui/material'
import {
  Chart as ChartJS,
  Filler,
  LineElement,
  PointElement,
  RadialLinearScale,
  ScriptableScalePointLabelContext,
  Title,
  Tooltip,
} from 'chart.js'
import { GEN2_TRANSFER_RESTRICTIONS } from 'consts/TransferRestrictions'
import { useEffect, useState } from 'react'
import { Radar } from 'react-chartjs-2'
import SheenStars from 'renderer/components/SheenStars'
import { isRestricted } from 'types/TransferRestrictions'
import { Styles } from 'types/types'
import { getNatureSummary } from '../../resources/NatureData'
import { PKM } from '../../types/PKMTypes/PKM'

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100% - 20px)',
    padding: 10,
    alignItems: 'center',
    position: 'relative',
  },
  selectors: {
    position: 'absolute',
    right: 10,
    top: 10,
    display: 'flex',
    flexDirection: 'column',
  },
  chartContainer: { padding: 20, height: 280 },
} as Styles

const StatsDisplay = (props: { mon: PKM }) => {
  const { mon } = props
  const [display, setDisplay] = useState('Stats')
  const [evType, setEVType] = useState(!mon.evs ? 'Game Boy' : 'Modern')

  useEffect(() => {
    if (mon.evsG12 && !mon.evs) {
      setEVType('Game Boy')
    } else if (!mon.evsG12) {
      setEVType('Modern')
    }
  }, [mon.evs, mon.evsG12, mon.format])

  ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Title,
    Filler,
    Tooltip
  )
  return (
    <div style={styles.container}>
      <div style={styles.selectors}>
        <Select value={display} onChange={(e) => setDisplay(e.target.value)}>
          <MenuItem value="Stats">Stats</MenuItem>
          {mon.avs ? <MenuItem value="AVs">AVs</MenuItem> : <div />}
          {mon.evs ?? mon.evsG12 !== undefined ? (
            <MenuItem value="EVs">EVs</MenuItem>
          ) : (
            <div />
          )}
          {mon.ivs !== undefined ? (
            <MenuItem value="IVs">IVs</MenuItem>
          ) : (
            <div />
          )}
          {!isRestricted(GEN2_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) &&
          mon.dvs !== undefined ? (
            <MenuItem value="DVs">DVs</MenuItem>
          ) : (
            <div />
          )}
          {mon.dvs !== undefined ? (
            <MenuItem value="GVs">GVs</MenuItem>
          ) : (
            <div />
          )}
          {mon.contest !== undefined ? (
            <MenuItem value="Contest">Contest</MenuItem>
          ) : (
            <div />
          )}
        </Select>
        {display === 'EVs' && mon.format === 'OHPKM' ? (
          <Select value={evType} onChange={(e) => setEVType(e.target.value)}>
            <MenuItem value="Modern">Modern</MenuItem>
            <MenuItem value="Game Boy">Game Boy</MenuItem>
          </Select>
        ) : (
          <div />
        )}
      </div>
      <div style={styles.chartContainer}>
        <Radar
          options={{
            plugins: {
              tooltip: {
                usePointStyle: true,
                callbacks: {
                  title: () => '',
                  label: (context: { label: any; raw: any }) => {
                    return `${context.label}: ${context.raw}`
                  },
                },
              },
            },
            scales: {
              r: {
                min: 0,
                max:
                  display === 'IVs'
                    ? 31
                    : display === 'DVs'
                    ? 15
                    : display === 'GVs'
                    ? 10
                    : display === 'EVs' && evType === 'Modern'
                    ? 252
                    : display === 'EVs' && evType === 'Game Boy'
                    ? 65536
                    : undefined,
                pointLabels: {
                  font: { size: 14, weight: 'bold' },
                  color: (ctx: ScriptableScalePointLabelContext) => {
                    if (display === 'Contest') {
                      return 'white'
                    }
                    return ctx.label.includes('▲')
                      ? '#F58'
                      : ctx.label.includes('▼')
                      ? '#78F'
                      : 'black'
                  },
                  backdropColor: (ctx: ScriptableScalePointLabelContext) => {
                    if (display !== 'Contest') {
                      return undefined
                    }
                    switch (ctx.label) {
                      case 'Cool':
                        return '#F08030'
                      case 'Beauty':
                        return '#6890F0'
                      case 'Cute':
                        return '#F85888'
                      case 'Smart':
                        return '#78C850'
                      case 'Tough':
                        return '#F8D030'
                      default:
                        return undefined
                    }
                  },
                  borderRadius: display === 'Contest' ? 12 : 0,
                  backdropPadding: display === 'Contest' ? 4 : 0,
                  callback: (value) => {
                    const natureSummary = getNatureSummary(
                      mon.statNature ?? mon.nature
                    )
                    if (natureSummary?.includes(`-${value}`)) {
                      return `${value}▼`
                    } else if (natureSummary?.includes(`+${value}`)) {
                      return `${value}▲`
                    } else {
                      return `${value}`
                    }
                  },
                },
              },
            },
          }}
          data={{
            labels:
              display === 'Contest'
                ? ['Cool', 'Beauty', 'Cute', 'Smart', 'Tough']
                : (display === 'EVs' && evType === 'Game Boy') ||
                  display === 'DVs'
                ? ['HP', 'Atk', 'Def', 'Spe', 'Spc']
                : ['HP', 'Atk', 'Def', 'Spe', 'SpD', 'SpA'],
            datasets: [
              display === 'Stats'
                ? {
                    label: 'Stats',
                    data: [
                      mon.stats.hp,
                      mon.stats.atk,
                      mon.stats.def,
                      mon.stats.spe,
                      mon.stats.spd,
                      mon.stats.spa,
                    ],
                    fill: true,
                    backgroundColor: 'rgba(132, 99, 255, 0.2)',
                    borderColor: 'rgb(132, 99, 255)',
                    pointBackgroundColor: 'rgb(132, 99, 255)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(132, 99, 255)',
                  }
                : display === 'IVs' && mon.ivs
                ? {
                    label: 'IVs',
                    data: [
                      mon.ivs.hp,
                      mon.ivs.atk,
                      mon.ivs.def,
                      mon.ivs.spe,
                      mon.ivs.spd,
                      mon.ivs.spa,
                    ],
                    fill: true,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgb(255, 99, 132)',
                    pointBackgroundColor: 'rgb(255, 99, 132)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(255, 99, 132)',
                  }
                : display === 'DVs' && mon.dvs
                ? {
                    label: 'DVs',
                    data: [
                      mon.dvs.hp,
                      mon.dvs.atk,
                      mon.dvs.def,
                      mon.dvs.spe,
                      mon.dvs.spc,
                    ],
                    fill: true,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgb(255, 99, 132)',
                    pointBackgroundColor: 'rgb(255, 99, 132)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(255, 99, 132)',
                  }
                : display === 'EVs' && evType === 'Modern' && mon.evs
                ? {
                    label: 'EVs',
                    data: mon.evs
                      ? [
                          mon.evs.hp,
                          mon.evs.atk,
                          mon.evs.def,
                          mon.evs.spe,
                          mon.evs.spd,
                          mon.evs.spa,
                        ]
                      : mon.evsG12
                      ? [
                          mon.evsG12.hp,
                          mon.evsG12.atk,
                          mon.evsG12.def,
                          mon.evsG12.spe,
                          mon.evsG12.spc,
                        ]
                      : [],
                    fill: true,
                    backgroundColor: 'rgba(132, 99, 255, 0.2)',
                    borderColor: 'rgb(132, 99, 255)',
                    pointBackgroundColor: 'rgb(132, 99, 255)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(132, 99, 255)',
                  }
                : display === 'EVs' && evType === 'Game Boy' && mon.evsG12
                ? {
                    label: 'EVs',
                    data: mon.evs
                      ? [
                          mon.evs.hp,
                          mon.evs.atk,
                          mon.evs.def,
                          mon.evs.spe,
                          mon.evs.spd,
                          mon.evs.spa,
                        ]
                      : mon.evsG12
                      ? [
                          mon.evsG12.hp,
                          mon.evsG12.atk,
                          mon.evsG12.def,
                          mon.evsG12.spe,
                          mon.evsG12.spc,
                        ]
                      : [],
                    fill: true,
                    backgroundColor: 'rgba(132, 99, 255, 0.2)',
                    borderColor: 'rgb(132, 99, 255)',
                    pointBackgroundColor: 'rgb(132, 99, 255)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(132, 99, 255)',
                  }
                : display === 'AVs' && mon.avs
                ? {
                    label: 'AVs',
                    data: [
                      mon.avs.hp,
                      mon.avs.atk,
                      mon.avs.def,
                      mon.avs.spe,
                      mon.avs.spd,
                      mon.avs.spa,
                    ],
                    fill: true,
                    backgroundColor: 'rgba(132, 99, 255, 0.2)',
                    borderColor: 'rgb(132, 99, 255)',
                    pointBackgroundColor: 'rgb(132, 99, 255)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(132, 99, 255)',
                  }
                : display === 'GVs' && mon.gvs
                ? {
                    label: 'GVs',
                    data: [
                      mon.gvs.hp,
                      mon.gvs.atk,
                      mon.gvs.def,
                      mon.gvs.spe,
                      mon.gvs.spd,
                      mon.gvs.spa,
                    ],
                    fill: true,
                    backgroundColor: 'rgba(132, 99, 255, 0.2)',
                    borderColor: 'rgb(132, 99, 255)',
                    pointBackgroundColor: 'rgb(132, 99, 255)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(132, 99, 255)',
                  }
                : {
                    label: 'Contest',
                    data: mon.contest
                      ? [
                          mon.contest.cool,
                          mon.contest.beauty,
                          mon.contest.cute,
                          mon.contest.smart,
                          mon.contest.tough,
                        ]
                      : [],
                    fill: true,
                    backgroundColor: 'rgba(132, 99, 255, 0.2)',
                    borderColor: 'rgb(132, 99, 255)',
                    pointBackgroundColor: 'rgb(132, 99, 255)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(132, 99, 255)',
                  },
            ],
          }}
        />
      </div>
      {display === 'Contest' && mon.contest && <SheenStars mon={mon} />}
    </div>
  )
}

export default StatsDisplay
