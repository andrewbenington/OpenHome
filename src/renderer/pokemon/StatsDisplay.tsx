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
import { getStats } from 'pokemon-files'
import { getNatureSummary } from 'pokemon-resources'
import { useEffect, useMemo, useState } from 'react'
import { Radar } from 'react-chartjs-2'
import { hasGen8OnData, hasPLAData } from 'src/types/interfaces/gen8'
import { hasGameBoyData } from 'src/types/interfaces/stats'
import { PKMFile } from 'src/types/pkm/util'
import {
  GEN2_TRANSFER_RESTRICTIONS,
  LA_TRANSFER_RESTRICTIONS,
  LGPE_TRANSFER_RESTRICTIONS,
} from '../../consts/TransferRestrictions'
import { isRestricted } from '../../types/TransferRestrictions'
import { hasGen3OnData } from '../../types/interfaces/gen3'
import { hasLetsGoData } from '../../types/interfaces/gen7'
import { Styles } from '../../types/types'
import SheenStars from '../components/SheenStars'
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
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
  chartContainer: { height: 'calc(100% - 40px)' },
  sheenStars: { padding: 10 },
} as Styles

const getMaxValue = (stat: string, evType?: string): number | undefined => {
  switch (stat) {
    case 'IVs':
      return 31
    case 'DVs':
      return 15
    case 'GVs':
      return 10
    case 'EVs':
      return evType === 'Modern' ? 252 : 65536
    case 'Contest':
      return 255
    default:
      return undefined
  }
}

const StatsDisplay = (props: { mon: PKMFile }) => {
  const { mon } = props
  const [display, setDisplay] = useState('Stats')
  const [evType, setEVType] = useState(hasGen3OnData(mon) ? 'Modern' : 'Game Boy')

  useEffect(() => {
    setEVType(hasGen3OnData(mon) ? 'Modern' : 'Game Boy')
  }, [mon])

  const stats = useMemo(() => (mon.format === 'OHPKM' ? mon.stats : getStats(mon)), [mon])

  const menuItems = useMemo(() => {
    const createMenuItem = (value: string) => {
      return (
        <MenuItem key={value} value={value}>
          {value}
        </MenuItem>
      )
    }
    const items = [createMenuItem('Stats')]
    if (hasGen3OnData(mon) || hasLetsGoData(mon)) {
      items.push(createMenuItem('IVs'))
    }
    if (
      hasGameBoyData(mon) &&
      !isRestricted(GEN2_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formeNum)
    ) {
      items.push(createMenuItem('DVs'))
    }
    items.push(createMenuItem('EVs'))
    if (hasLetsGoData(mon) && !isRestricted(LGPE_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formeNum)) {
      items.push(createMenuItem('AVs'))
    }
    if (hasPLAData(mon) && !isRestricted(LA_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formeNum)) {
      items.push(createMenuItem('GVs'))
    }
    if (hasGen3OnData(mon)) {
      items.push(createMenuItem('Contest'))
    }
    return items
  }, [mon])

  ChartJS.register(RadialLinearScale, PointElement, LineElement, Title, Filler, Tooltip)
  return (
    <div style={styles.container}>
      <div style={styles.selectors}>
        <Select value={display} onChange={(e) => setDisplay(e.target.value)}>
          {menuItems}
        </Select>
        {display === 'EVs' && 'evs' in mon && 'evsG12' in mon ? (
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
            layout: {
              padding: 10,
            },
            scales: {
              r: {
                min: 0,
                max: getMaxValue(display, evType),
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
                    if (!hasGen3OnData(mon)) {
                      return value
                    }
                    let natureSummary: string
                    if (hasGen8OnData(mon) && mon.statNature !== mon.nature) {
                      natureSummary = getNatureSummary(mon.statNature)
                    } else {
                      natureSummary = getNatureSummary(mon.nature)
                    }
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
                : (display === 'EVs' && evType === 'Game Boy') || display === 'DVs'
                ? ['HP', 'Atk', 'Def', 'Spe', 'Spc']
                : ['HP', 'Atk', 'Def', 'Spe', 'SpD', 'SpA'],
            datasets: [
              display === 'Stats' && !('spc' in stats)
                ? {
                    label: 'Stats',
                    data: [stats.hp, stats.atk, stats.def, stats.spe, stats.spd, stats.spa],
                    fill: true,
                    backgroundColor: 'rgba(132, 99, 255, 0.2)',
                    borderColor: 'rgb(132, 99, 255)',
                    pointBackgroundColor: 'rgb(132, 99, 255)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(132, 99, 255)',
                  }
                : display === 'IVs' && hasGen3OnData(mon)
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
                : display === 'DVs' && hasGameBoyData(mon)
                ? {
                    label: 'DVs',
                    data: [mon.dvs.hp, mon.dvs.atk, mon.dvs.def, mon.dvs.spe, mon.dvs.spc],
                    fill: true,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgb(255, 99, 132)',
                    pointBackgroundColor: 'rgb(255, 99, 132)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(255, 99, 132)',
                  }
                : display === 'EVs' && evType === 'Modern' && hasGen3OnData(mon)
                ? {
                    label: 'EVs',
                    data: [
                      mon.evs.hp,
                      mon.evs.atk,
                      mon.evs.def,
                      mon.evs.spe,
                      mon.evs.spd,
                      mon.evs.spa,
                    ],
                    fill: true,
                    backgroundColor: 'rgba(132, 99, 255, 0.2)',
                    borderColor: 'rgb(132, 99, 255)',
                    pointBackgroundColor: 'rgb(132, 99, 255)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(132, 99, 255)',
                  }
                : display === 'EVs' && evType === 'Game Boy' && hasGameBoyData(mon)
                ? {
                    label: 'EVs',
                    data: [
                      mon.evsG12.hp,
                      mon.evsG12.atk,
                      mon.evsG12.def,
                      mon.evsG12.spe,
                      mon.evsG12.spc,
                    ],
                    fill: true,
                    backgroundColor: 'rgba(132, 99, 255, 0.2)',
                    borderColor: 'rgb(132, 99, 255)',
                    pointBackgroundColor: 'rgb(132, 99, 255)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(132, 99, 255)',
                  }
                : display === 'AVs' && hasLetsGoData(mon)
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
                : display === 'GVs' && hasPLAData(mon)
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
                    data:
                      'contest' in mon
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
      {display === 'Contest' && 'contest' in mon && (
        <div style={styles.sheenStars}>
          <SheenStars mon={mon} />
        </div>
      )}
    </div>
  )
}

export default StatsDisplay
