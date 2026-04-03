import useIsDarkMode from '@openhome-ui/hooks/darkMode'
import { BaseStats, Stats8, StatsPreSplit } from '@pkm-rs/pkg'
import { Text } from '@radix-ui/themes'
import {
  Chart as ChartJS,
  Filler,
  LineElement,
  PointElement,
  RadialLinearScale,
  Title,
  Tooltip,
} from 'chart.js'
import { Radar } from 'react-chartjs-2'
import StatsTable from '../../components/pokemon/StatsTable'

export type BaseStatsChartProps = {
  stats: BaseStats
}

export default function BaseStatsChart({ stats }: BaseStatsChartProps) {
  return 'Modern' in stats ? (
    <BaseStatsChartModern stats={stats.Modern} />
  ) : 'PreSplit' in stats ? (
    <BaseStatsChartPreSplit stats={stats.PreSplit} />
  ) : null
}

type BaseStatsChartModernProps = {
  stats: Stats8
}

function BaseStatsChartModern({ stats }: BaseStatsChartModernProps) {
  ChartJS.register(RadialLinearScale, PointElement, LineElement, Title, Filler, Tooltip)
  const isDarkMode = useIsDarkMode()

  return (
    <div className="base-stats-container">
      <Text weight="bold">Base Stats</Text>
      <Radar
        style={{ maxHeight: 220 }}
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
          layout: { padding: 8 },
          scales: {
            r: {
              min: 0,
              max: 200,
              pointLabels: {
                font: { size: 12, weight: 'bold' },
                color: isDarkMode ? 'white' : 'black',
              },
              grid: {
                color: isDarkMode ? 'white' : 'black',
                lineWidth: 0.5,
              },
              angleLines: {
                color: isDarkMode ? 'white' : 'black',
                lineWidth: 0.5,
              },
            },
          },
          backgroundColor: 'orange',
          color: 'white',
          borderColor: 'white',
        }}
        data={{
          labels: ['HP', 'Atk', 'Def', 'Spe', 'SpD', 'SpA'],
          datasets: [
            {
              label: 'Base Stats',
              data: [stats.hp, stats.atk, stats.def, stats.spe, stats.spd, stats.spa],
              fill: true,
              backgroundColor: 'rgba(132, 99, 255, 0.8)',
              borderColor: 'rgb(132, 99, 255)',
              pointBackgroundColor: 'rgb(132, 99, 255)',
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: 'rgb(132, 99, 255)',
            },
          ],
        }}
      />
      <StatsTable.Standard stats={stats} />
    </div>
  )
}

type BaseStatsChartPreSplitProps = {
  stats: StatsPreSplit
}
function BaseStatsChartPreSplit({ stats }: BaseStatsChartPreSplitProps) {
  ChartJS.register(RadialLinearScale, PointElement, LineElement, Title, Filler, Tooltip)
  const isDarkMode = useIsDarkMode()

  return (
    <div className="base-stats-container">
      <Text weight="bold">Base Stats</Text>
      <Radar
        style={{ maxHeight: 220 }}
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
          layout: { padding: 8 },
          scales: {
            r: {
              min: 0,
              max: 200,
              pointLabels: {
                font: { size: 12, weight: 'bold' },
                color: isDarkMode ? 'white' : 'black',
              },
              grid: {
                color: isDarkMode ? 'white' : 'black',
                lineWidth: 0.5,
              },
              angleLines: {
                color: isDarkMode ? 'white' : 'black',
                lineWidth: 0.5,
              },
            },
          },
          backgroundColor: 'orange',
          color: 'white',
          borderColor: 'white',
        }}
        data={{
          labels: ['HP', 'Atk', 'Def', 'Spe', 'Spc'],
          datasets: [
            {
              label: 'Base Stats',
              data: [stats.hp, stats.atk, stats.def, stats.spe, stats.spe, stats.spc],
              fill: true,
              backgroundColor: 'rgba(132, 99, 255, 0.8)',
              borderColor: 'rgb(132, 99, 255)',
              pointBackgroundColor: 'rgb(132, 99, 255)',
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: 'rgb(132, 99, 255)',
            },
          ],
        }}
      />
      <StatsTable.GameBoy stats={stats} />
    </div>
  )
}
