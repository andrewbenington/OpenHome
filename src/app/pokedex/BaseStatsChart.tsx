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
import { Forme } from 'src/types/types'

export type BaseStatsChartProps = {
  forme: Forme
}

export default function BaseStatsChart({ forme }: BaseStatsChartProps) {
  ChartJS.register(RadialLinearScale, PointElement, LineElement, Title, Filler, Tooltip)
  return (
    <div style={{ width: 200, margin: 'auto' }}>
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
          layout: { padding: 8 },
          scales: {
            r: { min: 0, max: 200 },
          },
          backgroundColor: 'rgb(132, 99, 255)',
          color: 'rgb(132, 99, 255)',
        }}
        data={{
          labels: ['HP', 'Atk', 'Def', 'Spe', 'SpD', 'SpA'],
          datasets: [
            {
              label: 'Base Stats',
              data: [
                forme.baseStats.hp,
                forme.baseStats.atk,
                forme.baseStats.def,
                forme.baseStats.spe,
                forme.baseStats.spd,
                forme.baseStats.spa,
              ],
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
    </div>
  )
}
