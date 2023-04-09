import { MenuItem, Select } from '@mui/material';
import _ from 'lodash';
import { useState } from 'react';
import Themes from 'renderer/app/Themes';
import { G1SAV, G2SAV, G3SAV, G5SAV, HGSSSAV } from 'types/SAVTypes';
import { POKEMON_DATA } from '../../consts/Mons';
import {
  OHPKM,
  PA8,
  PK1,
  PK2,
  PK3,
  PK4,
  PK5,
  PK6,
  PK7,
  PKM,
} from '../../types/PKMTypes';
import { getTypes } from '../../types/PKMTypes/util';
import {
  Gen89RegionalForms,
  isRestricted,
  LA_TRANSFER_RESTRICTIONS,
  RegionalForms,
} from '../../types/TransferRestrictions';
import OpenHomeButton from '../components/OpenHomeButton';
import AttributeRow from './AttributeRow';
import OtherDisplay from './OtherDisplay';
import PokemonWithItem from './PokemonWithItem';
import RibbonsDisplay from './RibbonsDisplay';
import StatsDisplay from './StatsDisplay';
import {
  detailsPaneScrollContainerStyle,
  detailsPaneStyle,
  fileTypeChipStyle,
  tabButtonStyle,
} from './styles';
import SummaryDisplay from './SummaryDisplay';

const getTypeFromString = (type: string) => {
  switch (type) {
    case 'OHPKM':
      return OHPKM;
    case 'PK1':
      return PK1;
    case 'PK2':
      return PK2;
    case 'PK3':
      return PK3;
    case 'PK4':
      return PK4;
    case 'PK5':
      return PK5;
    case 'PK6':
      return PK6;
    case 'PK7':
      return PK7;
    case 'PA8':
      return PA8;
  }
};

const PokemonDisplay = (props: {
  mon: PKM;
  updateMon: (mon: PKM) => void;
  tab: string;
  setTab: (tab: string) => void;
}) => {
  const { mon, updateMon, tab, setTab } = props;
  const [displayMon, setDisplayMon] = useState(mon);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        height: '100%',
        backgroundColor: Themes[0].backgroundColor,
      }}
    >
      <Select
        value={displayMon.format}
        onChange={(e) => {
          const T = getTypeFromString(e.target.value);
          if (mon.format === e.target.value) {
            setDisplayMon(mon);
          } else if (T) {
            setDisplayMon(new T(mon));
          }
        }}
        sx={{
          ...fileTypeChipStyle,
          backgroundColor: fileTypeColors[mon.format],
        }}
      >
        <MenuItem value="OHPKM">OpenHome</MenuItem>
        {mon.format !== 'OHPKM' ? (
          <MenuItem value={mon.format}>{mon.format}</MenuItem>
        ) : (
          <div />
        )}
        {mon.format === 'OHPKM' &&
        !isRestricted(G1SAV.TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) ? (
          <MenuItem value="PK1">PK1</MenuItem>
        ) : (
          <div />
        )}
        {mon.format === 'OHPKM' &&
        !isRestricted(G2SAV.TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) ? (
          <MenuItem value="PK2">PK2</MenuItem>
        ) : (
          <div />
        )}
        {mon.format === 'OHPKM' &&
        !isRestricted(G3SAV.TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) ? (
          <MenuItem value="PK3">PK3</MenuItem>
        ) : (
          <div />
        )}
        {mon.format === 'OHPKM' &&
        !isRestricted(
          HGSSSAV.TRANSFER_RESTRICTIONS,
          mon.dexNum,
          mon.formNum
        ) ? (
          <MenuItem value="PK4">PK4</MenuItem>
        ) : (
          <div />
        )}
        {mon.format === 'OHPKM' &&
        !isRestricted(G5SAV.TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) ? (
          <MenuItem value="PK5">PK5</MenuItem>
        ) : (
          <div />
        )}
        {mon.format === 'OHPKM' &&
        !isRestricted(
          {
            maxDexNum: 721,
            excludedForms: {
              ...RegionalForms,
              483: [1],
              484: [1],
            },
          },
          mon.dexNum,
          mon.formNum
        ) ? (
          <MenuItem value="PK6">PK6</MenuItem>
        ) : (
          <div />
        )}
        {mon.format === 'OHPKM' &&
        !isRestricted(
          {
            maxDexNum: 807,
            excludedForms: {
              ...Gen89RegionalForms,
              483: [1],
              484: [1],
            },
          },
          mon.dexNum,
          mon.formNum
        ) ? (
          <MenuItem value="PK7">PK7</MenuItem>
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
      <PokemonWithItem
        mon={displayMon}
        format={displayMon.format}
        style={{ width: '20%' }}
      />
      <div style={{ textAlign: 'left', width: '30%', marginTop: 10 }}>
        <AttributeRow
          label="Name"
          value={`${
            POKEMON_DATA[displayMon.dexNum]?.formes[displayMon.formNum]
              ?.formeName
          } ${
            displayMon.gender === 2 ? '' : displayMon.gender === 1 ? '♀' : '♂'
          }`}
        />
        <AttributeRow label="Dex No." value={`${displayMon.dexNum}`} />
        <AttributeRow label="Type">
          {getTypes(displayMon)?.map((type, i) => (
            <img
              draggable={false}
              alt={`pokemon type ${i + 1}`}
              style={{ height: 24, width: 24, marginRight: 5 }}
              src={`https://raw.githubusercontent.com/msikma/pokesprite/master/misc/types/gen8/${type.toLocaleLowerCase()}.png`}
            />
          ))}
        </AttributeRow>
        <AttributeRow
          label="OT"
          value={`${displayMon.trainerName} ${
            displayMon.trainerGender ? '♀' : '♂'
          }`}
        />
        <AttributeRow
          label="Trainer ID"
          value={`${displayMon.displayID
            .toString()
            .padStart(
              ['PK7', 'PK8', 'PA8', 'PK9'].includes(displayMon.format) ? 6 : 5,
              '0'
            )}`}
        />
        {displayMon.ability !== undefined && (
          <AttributeRow
            label="Ability"
            value={`${displayMon.ability} (${
              displayMon.abilityNum === 4 ? 'HA' : displayMon.abilityNum
            })`}
          />
        )}
      </div>
      <div style={detailsPaneStyle}>
        <div
          className="scroll-no-bar"
          style={{ display: 'flex', flexDirection: 'row', overflowX: 'scroll' }}
        >
          <OpenHomeButton
            // @ts-ignore
            style={{
              ...tabButtonStyle,
              backgroundColor: tab === 'summary' ? '#fff4' : '#0000',
            }}
            onClick={() => setTab('summary')}
          >
            Summary
          </OpenHomeButton>
          <OpenHomeButton
            // @ts-ignore
            style={{
              ...tabButtonStyle,
              backgroundColor: tab === 'stats' ? '#fff4' : '#0000',
            }}
            onClick={() => setTab('stats')}
          >
            Stats
          </OpenHomeButton>
          <OpenHomeButton
            // @ts-ignore
            style={{
              ...tabButtonStyle,
              backgroundColor: tab === 'ribbons' ? '#fff4' : '#0000',
            }}
            onClick={() => setTab('ribbons')}
          >
            Ribbons
          </OpenHomeButton>
          <OpenHomeButton
            // @ts-ignore
            style={{
              ...tabButtonStyle,
              backgroundColor: tab === 'other' ? '#fff4' : '#0000',
            }}
            onClick={() => setTab('other')}
          >
            Other
          </OpenHomeButton>
          <OpenHomeButton
            // @ts-ignore
            style={{
              ...tabButtonStyle,
              backgroundColor: tab === 'raw' ? '#fff4' : '#0000',
            }}
            onClick={() => setTab('raw')}
          >
            Raw
          </OpenHomeButton>
        </div>
        <div style={detailsPaneScrollContainerStyle} className="scroll-no-bar">
          {tab === 'summary' ? (
            <SummaryDisplay mon={displayMon} updateMon={updateMon} />
          ) : tab === 'stats' ? (
            <StatsDisplay mon={displayMon} />
          ) : tab === 'ribbons' ? (
            <RibbonsDisplay mon={displayMon} />
          ) : tab === 'other' ? (
            <OtherDisplay mon={displayMon} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {_.range(displayMon.bytes.length / 16).map((row: number) => {
                return (
                  <code key={`code_row_${row}`}>{`0x${row
                    .toString(16)
                    .padStart(3, '0')}0\t${_.range(16)
                    .map(
                      (byte: number) =>
                        displayMon.bytes[
                          Math.min(row * 16 + byte, displayMon.bytes.length - 1)
                        ]
                          .toString(16)
                          .padStart(2, '0') + (byte % 2 ? ' ' : '')
                    )
                    .join('')}`}</code>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const fileTypeColors: { [key: string]: string } = {
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
};

export default PokemonDisplay;
