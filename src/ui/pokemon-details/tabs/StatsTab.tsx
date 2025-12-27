import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { isRestricted } from '@openhome-core/save/util/TransferRestrictions'
import SheenStars from '@openhome-ui/components/pokemon/SheenStars'
import { Stats as PkmRsStats, StatsPreSplit } from '@pkm-rs/pkg'
import {
  GEN2_TRANSFER_RESTRICTIONS,
  LA_TRANSFER_RESTRICTIONS,
  LGPE_TRANSFER_RESTRICTIONS,
} from '@pokemon-resources/consts/TransferRestrictions'
import { Select } from '@radix-ui/themes'
import {
  ChartDataset,
  Chart as ChartJS,
  Filler,
  LineElement,
  PointElement,
  RadialLinearScale,
  ScriptableScalePointLabelContext,
  Title,
  Tooltip,
} from 'chart.js'
import { useEffect, useMemo, useState } from 'react'
import { Radar } from 'react-chartjs-2'
import {
  isContestStats,
  isStandardStats,
  isStatsPreSplit,
  Stats,
} from '../../../../packages/pokemon-files/src'
import StatsTable from '../../components/pokemon/StatsTable'
import { colorIsDark } from '../../util/color'

function getMaxValue(stat: string, evType?: string): number | undefined {
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

type DisplayType = 'Stats' | 'Stored Stats' | 'IVs' | 'DVs' | 'EVs' | 'AVs' | 'GVs' | 'Contest'

export default function StatsDisplay(props: { mon: PKMInterface }) {
  const { mon } = props
  const [display, setDisplay] = useState<DisplayType>('Stats')
  const [evType, setEVType] = useState(mon.evs ? 'Modern' : 'Game Boy')

  useEffect(() => {
    setEVType(mon.evs ? 'Modern' : 'Game Boy')
  }, [mon])

  const stats = useMemo(() => mon.getStats(), [mon])

  const menuItems = useMemo(() => {
    const createMenuItem = (value: string) => {
      return (
        <Select.Item key={value} value={value}>
          {value}
        </Select.Item>
      )
    }
    const items = [createMenuItem('Stats')]

    if (mon.stats) {
      items.push(createMenuItem('Stored Stats'))
    }

    if (mon.ivs) {
      items.push(createMenuItem('IVs'))
    }
    if (mon.dvs && !isRestricted(GEN2_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formeNum)) {
      items.push(createMenuItem('DVs'))
    }
    items.push(createMenuItem('EVs'))
    if ('avs' in mon && !isRestricted(LGPE_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formeNum)) {
      items.push(createMenuItem('AVs'))
    }
    if ('gvs' in mon && !isRestricted(LA_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formeNum)) {
      items.push(createMenuItem('GVs'))
    }
    if (mon.contest) {
      items.push(createMenuItem('Contest'))
    }
    return items
  }, [mon])

  ChartJS.register(RadialLinearScale, PointElement, LineElement, Title, Filler, Tooltip)

  const displayedStats = useMemo(() => {
    switch (display) {
      case 'Stats':
        return stats
      case 'Stored Stats':
        return mon.stats
      case 'IVs':
        return mon.ivs
      case 'DVs':
        return mon.dvs
      case 'EVs':
        if (evType === 'Modern') {
          return mon.evs
        } else {
          return mon.evsG12
        }
      case 'AVs':
        return mon.avs
      case 'GVs':
        return mon.gvs
      case 'Contest':
        return mon.contest
    }
  }, [display, evType, mon, stats])

  const data = useMemo(() => {
    const s = displayedStats
    if (!s) return []
    if (isStandardStats(s)) {
      return [s.hp, s.atk, s.def, s.spe, s.spd, s.spa]
    } else if (isStatsPreSplit(s)) {
      return [s.hp, s.atk, s.def, s.spe, s.spc]
    } else if (isContestStats(s)) {
      return [s.cool, s.beauty, s.cute, s.smart, s.tough]
    } else {
      return []
    }
  }, [displayedStats])

  const dataset: ChartDataset<'radar', number[]> = {
    label: display,
    data,
    fill: true,
    backgroundColor: primaryColor(display),
    borderColor: secondaryColor(display),
    pointBackgroundColor: secondaryColor(display),
    pointBorderColor: '#fff',
    pointHoverBackgroundColor: '#fff',
    pointHoverBorderColor: secondaryColor(display),
  }

  const labels = useMemo(() => {
    switch (display) {
      case 'Contest':
        return ['Cool', 'Beauty', 'Cute', 'Smart', 'Tough']
      case 'EVs':
        return evType === 'Game Boy'
          ? ['HP', 'Atk', 'Def', 'Spe', 'Spc']
          : ['HP', 'Atk', 'Def', 'Spe', 'SpD', 'SpA']
      case 'DVs':
        return ['HP', 'Atk', 'Def', 'Spe', 'Spc']
      default:
        return ['HP', 'Atk', 'Def', 'Spe', 'SpD', 'SpA']
    }
  }, [display, evType])

  const plugins = {
    tooltip: {
      usePointStyle: true,
      callbacks: {
        title: () => '',
        label: (context: { label: any; raw: any }) => {
          return `${context.label}: ${context.raw}`
        },
      },
    },
  }

  return (
    <div className="stats-container">
      <div className="stats-selectors">
        <Select.Root
          size="1"
          value={display}
          onValueChange={(val: DisplayType) => val && setDisplay(val)}
        >
          <Select.Trigger />
          <Select.Content position="popper">{menuItems}</Select.Content>
        </Select.Root>
        {display === 'EVs' && mon.evs && mon.evsG12 ? (
          <Select.Root size="1" value={evType} onValueChange={(val) => val && setEVType(val)}>
            <Select.Trigger />
            <Select.Content position="popper">
              <Select.Item value="Modern">Modern</Select.Item>
              <Select.Item value="Game Boy">Game Boy</Select.Item>
            </Select.Content>
          </Select.Root>
        ) : (
          <div />
        )}
      </div>
      <div className="chart-container">
        <Radar
          options={{
            plugins,
            layout: { padding: 10 },
            scales: {
              r: {
                min: 0,
                max: getMaxValue(display, evType),
                pointLabels: {
                  font: { size: 14, weight: 'bold' },
                  color: labelTextColorCallback(display),
                  backdropColor: labelBackdropColorCallback(display),
                  borderRadius: display === 'Contest' ? 12 : 0,
                  backdropPadding: display === 'Contest' ? 4 : 0,
                  callback: labelTextCallback(mon, display),
                },
              },
            },
          }}
          data={{ labels, datasets: [dataset] }}
        />
      </div>
      {isStandardStats(displayedStats) ? (
        <StatsTable.Standard stats={displayedStats as unknown as Stats} />
      ) : isStatsPreSplit(displayedStats) ? (
        <StatsTable.GameBoy stats={displayedStats as unknown as StatsPreSplit} />
      ) : isContestStats(displayedStats) ? (
        <StatsTable.Contest stats={displayedStats} />
      ) : null}
      {display === 'Contest' && 'contest' in mon && (
        <div>
          <SheenStars mon={mon} />
        </div>
      )}
    </div>
  )
}

function primaryColor(display: DisplayType): string {
  const { r, g, b } = displayColorComponents(display)
  return `rgba(${r}, ${g}, ${b}, 0.2)`
}

function secondaryColor(display: DisplayType): string {
  const { r, g, b } = displayColorComponents(display)
  return `rgb(${r}, ${g}, ${b})`
}

function displayColorComponents(display: DisplayType): { r: number; g: number; b: number } {
  switch (display) {
    case 'Stats':
    case 'Stored Stats':
      return { r: 132, g: 99, b: 255 }
    case 'IVs':
    case 'DVs':
      return { r: 255, g: 99, b: 132 }
    default:
      return { r: 132, g: 99, b: 255 }
  }
}

function labelBackdropColor(display: DisplayType, label: string): string | undefined {
  if (display !== 'Contest') {
    return undefined
  }
  switch (label) {
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
}

function labelBackdropColorCallback(display: DisplayType) {
  return (ctx: ScriptableScalePointLabelContext) => {
    return labelBackdropColor(display, ctx.label)
  }
}

function labelTextColorCallback(display: DisplayType) {
  return (ctx: ScriptableScalePointLabelContext) => {
    const backdropColor = labelBackdropColor(display, ctx.label)
    if (backdropColor) {
      return colorIsDark(backdropColor) ? 'white' : 'black'
    }
    return ctx.label.includes('▲') ? '#F58' : ctx.label.includes('▼') ? '#78F' : 'black'
  }
}

function labelTextCallback(mon: PKMInterface, display: DisplayType) {
  return (label: string) => {
    if (display !== 'Stats' && display !== 'Stored Stats') {
      return label
    }

    const stat = PkmRsStats.fromAbbr(label)
    if (!stat || !mon.nature) {
      return label
    }

    if (mon.nature.stats?.decrease === stat) {
      return `${label}▼`
    } else if (mon.nature.stats?.increase === stat) {
      return `${label}▲`
    } else {
      return `${label}`
    }
  }
}
