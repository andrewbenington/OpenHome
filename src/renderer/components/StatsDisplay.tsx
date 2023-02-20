import { Button } from '@mui/material';
import {
  Chart as ChartJS,
  Filler,
  LineElement,
  PointElement,
  RadialLinearScale,
  ScriptableScalePointLabelContext,
  Title,
  Tooltip,
} from 'chart.js';
import _ from 'lodash';
import { useState } from 'react';
import { Radar } from 'react-chartjs-2';
import { getNatureSummary } from '../../consts/Natures';
import { COLOPKM } from '../../pkm/colopkm';
import { PK3 } from '../../pkm/PK3';
import { pkm } from '../../pkm/pkm';
import { xdpkm } from '../../pkm/xdpkm';

const getSheenStars = (mon: pkm) => {
  if (mon instanceof PK3 || mon instanceof COLOPKM || mon instanceof xdpkm) {
    return mon.contest.sheen === 255
      ? 10
      : Math.floor(mon.contest.sheen / 29) + 1;
  } else if (mon.contest.sheen < 22) {
    return 0;
  } else if (mon.contest.sheen < 43) {
    return 1;
  } else if (mon.contest.sheen < 64) {
    return 2;
  } else if (mon.contest.sheen < 86) {
    return 3;
  } else if (mon.contest.sheen < 107) {
    return 4;
  } else if (mon.contest.sheen < 128) {
    return 5;
  } else if (mon.contest.sheen < 150) {
    return 6;
  } else if (mon.contest.sheen < 171) {
    return 7;
  } else if (mon.contest.sheen < 192) {
    return 8;
  } else if (mon.contest.sheen < 214) {
    return 9;
  } else if (mon.contest.sheen < 235) {
    return 10;
  } else if (mon.contest.sheen < 255) {
    return 11;
  } else {
    return 12;
  }
};

const StatsDisplay = (props: { mon: pkm }) => {
  const { mon } = props;
  const [display, setDisplay] = useState('Stats');
  ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Title,
    Filler,
    Tooltip
  );
  return (
    <div
      style={{
        marginLeft: 10,
        padding: 10,
        height: 400,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
      }}
    >
      <div style={{ padding: 20, height: 280 }}>
        <Radar
          options={{
            plugins: {
              tooltip: {
                usePointStyle: true,
                callbacks: {
                  title: () => '',
                  label: (context: { label: any; raw: any }) => {
                    return `${context.label}: ${context.raw}`;
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
                    : display === 'EVs' && mon.evs
                    ? 252
                    : undefined,
                pointLabels: {
                  font: { size: 14, weight: 'bold' },
                  color: (ctx: ScriptableScalePointLabelContext) => {
                    if (display === 'Contest') {
                      return 'white';
                    }
                    return ctx.label.includes('▲')
                      ? '#F58'
                      : ctx.label.includes('▼')
                      ? '#78F'
                      : 'black';
                  },
                  backdropColor: (ctx: ScriptableScalePointLabelContext) => {
                    if (display !== 'Contest') {
                      return undefined;
                    }
                    switch (ctx.label) {
                      case 'Cool':
                        return '#F08030';
                      case 'Beauty':
                        return '#6890F0';
                      case 'Cute':
                        return '#F85888';
                      case 'Smart':
                        return '#78C850';
                      case 'Tough':
                        return '#F8D030';
                      default:
                        return undefined;
                    }
                  },
                  borderRadius: display === 'Contest' ? 12 : 0,
                  backdropPadding: display === 'Contest' ? 4 : 0,
                  callback: (value) => {
                    const natureSummary = getNatureSummary(
                      mon.statNature ?? mon.nature
                    );
                    if (natureSummary?.includes(`-${value}`)) {
                      return `${value}▼`;
                    } else if (natureSummary?.includes(`+${value}`)) {
                      return `${value}▲`;
                    } else {
                      return `${value}`;
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
                : display === 'EVs (GB)' || display === 'DVs'
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
                : display === 'EVs' && (mon.evs || mon.evsG12)
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
                    data: [
                      mon.contest.cool,
                      mon.contest.beauty,
                      mon.contest.cute,
                      mon.contest.smart,
                      mon.contest.tough,
                    ],
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
      {display === 'Contest' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            height: 40,
          }}
        >
          <p>Sheen:</p>
          <div
            style={{
              backgroundColor: '#666',
              borderRadius: 5,
              display: 'flex',
              alignItems: 'center',
              marginLeft: 10,
              marginRight: 10,
              width: mon instanceof PK3 || mon instanceof COLOPKM ? 300 : 360,
            }}
          >
            {_.range(getSheenStars(mon)).map((level: number) => (
              <img
                alt={`sheen star ${level}`}
                src={`${process.env.PUBLIC_URL}/icons/sheen.gif`}
                style={{
                  height: 30,
                  objectFit: 'contain',
                }}
              />
            ))}
          </div>
          ({mon.contest.sheen})
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          position: 'absolute',
          overflowX: 'scroll',
          bottom: 10,
        }}
      >
        <Button
          style={{ marginLeft: 10 }}
          variant="outlined"
          size="small"
          onClick={() => setDisplay('Stats')}
        >
          Stats
        </Button>
        {mon.avs ? (
          <Button
            style={{ marginLeft: 10 }}
            variant="outlined"
            size="small"
            onClick={() => setDisplay('AVs')}
          >
            AVs
          </Button>
        ) : (
          <div />
        )}
        {mon.evs !== undefined ? (
          <Button
            style={{ marginLeft: 10 }}
            variant="outlined"
            size="small"
            onClick={() => setDisplay('EVs')}
          >
            EVs
          </Button>
        ) : (
          <div />
        )}
        {mon.evsG12 !== undefined ? (
          <Button
            style={{ marginLeft: 10 }}
            variant="outlined"
            size="small"
            onClick={() => setDisplay('EVs (GB)')}
          >
            EVs (GB)
          </Button>
        ) : (
          <div />
        )}
        {mon.ivs !== undefined ? (
          <Button
            style={{ marginLeft: 10 }}
            variant="outlined"
            size="small"
            onClick={() => setDisplay('IVs')}
          >
            IVs
          </Button>
        ) : (
          <div />
        )}
        {mon.dvs !== undefined ? (
          <Button
            style={{ marginLeft: 10 }}
            variant="outlined"
            size="small"
            onClick={() => setDisplay('DVs')}
          >
            DVs
          </Button>
        ) : (
          <div />
        )}
        {mon.dvs !== undefined ? (
          <Button
            style={{ marginLeft: 10 }}
            variant="outlined"
            size="small"
            onClick={() => setDisplay('GVs')}
          >
            GVs
          </Button>
        ) : (
          <div />
        )}
        <Button
          style={{ marginLeft: 10 }}
          variant="outlined"
          size="small"
          onClick={() => setDisplay('Contest')}
        >
          Contest
        </Button>
      </div>
    </div>
  );
};

export default StatsDisplay;
