import { Box, Card, Tab, Tabs } from '@mui/material';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { MONS_LIST } from '../../consts/Mons';
import Types from '../../consts/Types';
import { PKM } from '../../PKM/PKM';
import { getMonFileIdentifier, getTypes } from '../../PKM/util';
import { getTypeColor } from '../util/PokemonSprite';
import AttributeRow from './AttributeRow';
import AttributeTag from './AttributeTag';
import PokemonWithItem from './PokemonWithItem';
import RibbonsDisplay from './RibbonsDisplay';
import StatsDisplay from './StatsDisplay';
import SummaryDisplay from './SummaryDisplay';

const PokemonDisplay = (props: {
  mon: PKM;
  updateMon: (mon: PKM) => void;
  propTab?: string;
}) => {
  const { mon, updateMon, propTab } = props;
  const [tab, setTab] = useState('summary');
  useEffect(() => {
    setTab(propTab ?? 'summary');
  }, [propTab]);

  return (
    <div style={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
      <PokemonWithItem mon={mon} format={mon.format} style={{ width: '20%' }} />
      <div style={{ textAlign: 'left', width: '30%' }}>
        <AttributeRow
          label="Name"
          value={`${MONS_LIST[mon.dexNum]?.formes[mon.formNum]?.formeName}`}
        />
        <AttributeRow label="Dex No." value={`${mon.dexNum}`} />
        <AttributeRow label="Type">
          {getTypes(mon)?.map((type, i) => (
            <img
              alt={`pokemon type ${i + 1}`}
              style={{ height: 24, width: 24, marginRight: 5 }}
              src={`https://raw.githubusercontent.com/msikma/pokesprite/master/misc/types/gen8/${type.toLocaleLowerCase()}.png`}
            />
          ))}
        </AttributeRow>
        {mon.teraTypeOriginal !== undefined &&
        mon.teraTypeOverride !== undefined ? (
          <AttributeRow label="Tera Type">
            <img
              alt="tera type"
              style={{ height: 24, width: 24, marginRight: 5 }}
              src={`https://raw.githubusercontent.com/msikma/pokesprite/master/misc/types/gen8/${Types[
                mon.teraTypeOverride <= 18
                  ? mon.teraTypeOverride
                  : mon.teraTypeOriginal
              ]?.toLocaleLowerCase()}.png`}
            />
            {mon.teraTypeOverride <= 18 && (
              <>
                <p>(originally </p>
                <img
                  alt="tera type original"
                  style={{ height: 24, width: 24, marginRight: 5 }}
                  src={`https://raw.githubusercontent.com/msikma/pokesprite/master/misc/types/gen8/${Types[
                    mon.teraTypeOriginal
                  ]?.toLocaleLowerCase()}.png`}
                />
                <p>)</p>
              </>
            )}
          </AttributeRow>
        ) : (
          <></>
        )}
        <AttributeRow
          label="OT"
          value={`${mon.trainerName} ${mon.trainerGender ? '♀' : '♂'}`}
        />
        <AttributeRow
          label="Trainer ID"
          value={`${mon.displayID
            .toString()
            .padStart(
              ['PK7', 'PK8', 'PA8', 'PK9'].includes(mon.format) ? 6 : 5,
              '0'
            )}`}
        />
        <AttributeRow
          label="Ability"
          value={`${mon.ability} (${
            mon.abilityNum === 4 ? 'HA' : mon.abilityNum
          })`}
        />
        {mon.dynamaxLevel !== undefined && (
          <AttributeRow label="Dynamax">
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              {_.range(10).map((level: number) => (
                <div
                  key={`dynamax_meter_${level}`}
                  style={{
                    backgroundColor:
                      level < (mon.dynamaxLevel ?? 0)
                        ? `#FF${(40 + ((mon.dynamaxLevel ?? 0) - level) * 20)
                            ?.toString(16)
                            .padStart(2, '0')}00`
                        : 'grey',
                    height: 20,
                    width: 8,
                    marginRight: 4,
                  }}
                ></div>
              ))}
            </div>
          </AttributeRow>
        )}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
          }}
        >
          {mon.canGigantamax && (
            <AttributeTag
              icon="/icons/gmax.png"
              color="white"
              backgroundColor="#e60040"
            />
          )}
          {mon.isAlpha && (
            <AttributeTag
              icon="/icons/alpha.png"
              color="white"
              backgroundColor="#f2352d"
            />
          )}
          {mon.isSquareShiny && (
            <AttributeTag
              label="SQUARE SHINY"
              color="white"
              backgroundColor="black"
            />
          )}
          {mon.isShadow && (
            <AttributeTag
              label="SHADOW"
              backgroundColor={getTypeColor('shadow')}
              color="white"
            />
          )}
        </div>
      </div>

      <Card
        style={{
          width: '50%',
          marginLeft: 10,
          borderTopRightRadius: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tab} style={{ position: 'relative' }}>
            <Tab
              // @ts-ignore
              style={{ marginLeft: 10 }}
              label="Summary"
              value="summary"
              onClick={() => setTab('summary')}
            />
            <Tab
              // @ts-ignore
              style={{ marginLeft: 10 }}
              label="Stats"
              value="stats"
              onClick={() => setTab('stats')}
            />
            <Tab
              // @ts-ignore
              style={{ marginLeft: 10 }}
              label="Ribbons"
              value="ribbons"
              onClick={() => setTab('ribbons')}
            />
            <Tab
              // @ts-ignore
              style={{ marginLeft: 10 }}
              label="Raw"
              value="raw"
              onClick={() => setTab('raw')}
            />
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                backgroundColor: fileTypeColors[mon.format],
                color: 'white',
                fontWeight: 'bold',
                borderRadius: 0,
                fontSize: 20,
              }}
            >
              {mon.format}
            </div>
          </Tabs>
        </Box>
        {tab === 'summary' ? (
          <SummaryDisplay mon={mon} updateMon={updateMon} />
        ) : tab === 'stats' ? (
          <StatsDisplay mon={mon} />
        ) : tab === 'ribbons' ? (
          <RibbonsDisplay mon={mon} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {_.range(mon.bytes.length / 16).map((row: number) => {
              return (
                <code key={`code_row_${row}`}>{`0x${row
                  .toString(16)
                  .padStart(3, '0')}0\t${_.range(16)
                  .map(
                    (byte: number) =>
                      mon.bytes[Math.min(row * 16 + byte, mon.bytes.length - 1)]
                        .toString(16)
                        .padStart(2, '0') + (byte % 2 ? ' ' : '')
                  )
                  .join('')}`}</code>
              );
            })}
            <code>{getMonFileIdentifier(mon)}</code>
          </div>
        )}
      </Card>
    </div>
  );
};

const fileTypeColors: { [key: string]: string } = {
  PK2: '#bbb',
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
