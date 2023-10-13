/* eslint-disable no-nested-ternary */
import { Grid, MenuItem, Select } from '@mui/material';
import {
  BW2_TRANSFER_RESTRICTIONS,
  GEN1_TRANSFER_RESTRICTIONS,
  GEN2_TRANSFER_RESTRICTIONS,
  GEN3_TRANSFER_RESTRICTIONS,
  HGSS_TRANSFER_RESTRICTIONS,
  LA_TRANSFER_RESTRICTIONS,
  ORAS_TRANSFER_RESTRICTIONS,
  USUM_TRANSFER_RESTRICTIONS,
} from 'consts/TransferRestrictions';
import { useEffect, useMemo, useState } from 'react';
import TypeIcon from 'renderer/components/TypeIcon';
import { getItemIconPath, getSpritePath } from 'renderer/util/PokemonSprite';
import { StringToStringMap, Styles } from 'types/types';
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
import { isRestricted } from '../../types/TransferRestrictions';
import OpenHomeButton from '../components/OpenHomeButton';
import AttributeRow from './AttributeRow';
import OtherDisplay from './OtherDisplay';
import RawDisplay from './RawDisplay';
import RibbonsDisplay from './RibbonsDisplay';
import StatsDisplay from './StatsDisplay';
import SummaryDisplay from './SummaryDisplay';

const styles = {
  column: {
    height: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    maxWidth: 100,
    maxHeight: 100,
    transform: 'scale(2)',
    imageRendering: 'pixelated',
    objectFit: 'contain',
  },
  attributesList: { textAlign: 'left', width: '30%', marginTop: 10 },
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
    flexDirection: 'row',
    overflowX: 'scroll',
  },
  fileTypeChip: {
    left: 10,
    top: 10,
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
    zIndex: 1,
    borderRadius: 25,
    '& .MuiSelect-select': {
      paddingTop: 0,
      paddingBottom: 0,
    },
    '& .MuiSelect-outlined': {
      paddingTop: 0,
      paddingBottom: 0,
    },
    '& .Mui-focused': {
      border: 0,
    },
    position: 'absolute',
  },
} as Styles;

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
    default:
      return undefined;
  }
};

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
};

const PokemonDisplay = (props: {
  mon: PKM;
  tab: string;
  setTab: (_: string) => void;
}) => {
  const { mon, tab, setTab } = props;
  const [displayMon, setDisplayMon] = useState(mon);
  const [monSprites, setMonSprites] = useState<StringToStringMap>();
  const [itemIcon, setItemIcon] = useState<string>();

  const itemAltText = useMemo(() => {
    const monData = POKEMON_DATA[mon.dexNum]?.formes[mon.formNum];
    if (!monData) return 'pokemon sprite';
    return `${monData.formeName}${mon.isShiny ? '-shiny' : ''} sprite`;
  }, [mon]);

  const monSpriteSource = useMemo(
    () => (monSprites ? monSprites[displayMon.format] : ''),
    [displayMon.format, monSprites]
  );

  useEffect(() => {
    const importIcon = async () => {
      const icon = await import(
        `../images/items/${getItemIconPath(mon.heldItemIndex)}`
      );
      setItemIcon(icon?.default);
    };
    if (mon.heldItemIndex) {
      importIcon();
    }
  }, [mon.heldItem, mon.heldItemIndex]);

  useEffect(() => {
    const sprites: StringToStringMap = {};
    const importSprite = async (format: string) => {
      if (!(format in sprites)) {
        const sprite = await import(
          `../images/sprites/${getSpritePath(mon, format)}`
        );
        sprites[format] = sprite.default;
      }
    };
    const importSprites = async () => {
      // load first sprite first
      await importSprite(mon.format);
      setMonSprites(sprites);
      await Promise.all([
        importSprite('OHPKM'),
        !isRestricted(GEN1_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) &&
          importSprite('PK1'),
        !isRestricted(GEN2_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) &&
          importSprite('PK2'),
        !isRestricted(GEN3_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) &&
          importSprite('PK3'),
        !isRestricted(HGSS_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) &&
          importSprite('PK4'),
        !isRestricted(BW2_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) &&
          importSprite('PK5'),
        !isRestricted(ORAS_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) &&
          importSprite('PK6'),
        !isRestricted(USUM_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) &&
          importSprite('PK7'),
        !isRestricted(LA_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) &&
          importSprite('PA8'),
      ]);
      setMonSprites(sprites);
    };
    importSprites();
  }, [mon]);

  return (
    <Grid container style={styles.pokemonDisplay}>
      <Grid item xs={6}>
        <Grid container>
          <Grid item xs={4}>
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
              !isRestricted(
                GEN1_TRANSFER_RESTRICTIONS,
                mon.dexNum,
                mon.formNum
              ) ? (
                <MenuItem value="PK1">PK1</MenuItem>
              ) : (
                <div />
              )}
              {mon.format === 'OHPKM' &&
              !isRestricted(
                GEN2_TRANSFER_RESTRICTIONS,
                mon.dexNum,
                mon.formNum
              ) ? (
                <MenuItem value="PK2">PK2</MenuItem>
              ) : (
                <div />
              )}
              {mon.format === 'OHPKM' &&
              !isRestricted(
                GEN3_TRANSFER_RESTRICTIONS,
                mon.dexNum,
                mon.formNum
              ) ? (
                <MenuItem value="PK3">PK3</MenuItem>
              ) : (
                <div />
              )}
              {mon.format === 'OHPKM' &&
              !isRestricted(
                HGSS_TRANSFER_RESTRICTIONS,
                mon.dexNum,
                mon.formNum
              ) ? (
                <MenuItem value="PK4">PK4</MenuItem>
              ) : (
                <div />
              )}
              {mon.format === 'OHPKM' &&
              !isRestricted(
                BW2_TRANSFER_RESTRICTIONS,
                mon.dexNum,
                mon.formNum
              ) ? (
                <MenuItem value="PK5">PK5</MenuItem>
              ) : (
                <div />
              )}
              {mon.format === 'OHPKM' &&
              !isRestricted(
                ORAS_TRANSFER_RESTRICTIONS,
                mon.dexNum,
                mon.formNum
              ) ? (
                <MenuItem value="PK6">PK6</MenuItem>
              ) : (
                <div />
              )}
              {mon.format === 'OHPKM' &&
              !isRestricted(
                USUM_TRANSFER_RESTRICTIONS,
                mon.dexNum,
                mon.formNum
              ) ? (
                <MenuItem value="PK7">PK7</MenuItem>
              ) : (
                <div />
              )}
              {mon.format === 'OHPKM' &&
              !isRestricted(
                LA_TRANSFER_RESTRICTIONS,
                mon.dexNum,
                mon.formNum
              ) ? (
                <MenuItem value="PA8">PA8</MenuItem>
              ) : (
                <div />
              )}
            </Select>
          </Grid>
          <Grid xs={8} />
          <Grid xs={4}>
            <div style={styles.column}>
              {monSprites && (
                <img
                  draggable={false}
                  alt={itemAltText}
                  style={styles.image}
                  src={monSpriteSource}
                />
              )}
            </div>
            <AttributeRow label="Level" justifyEnd>
              {mon.level}
            </AttributeRow>
            <AttributeRow label="EXP" justifyEnd>
              {mon.exp}
            </AttributeRow>
            <AttributeRow label="Item" justifyEnd>
              {mon.heldItem !== 'None' && (
                <img
                  alt="item icon"
                  src={itemIcon}
                  style={{ width: 24, height: 24, marginRight: 5 }}
                />
              )}
              <div>{mon.heldItem}</div>
            </AttributeRow>
          </Grid>
          <Grid xs={8} style={styles.attributesList}>
            <AttributeRow
              label="Name"
              value={`${
                POKEMON_DATA[displayMon.dexNum]?.formes[displayMon.formNum]
                  ?.formeName
              } ${
                displayMon.gender === 2
                  ? ''
                  : displayMon.gender === 1
                  ? '♀'
                  : '♂'
              }`}
            />
            <AttributeRow label="Dex No." value={`${displayMon.dexNum}`} />
            <AttributeRow label="Type">
              {getTypes(displayMon)?.map((type) => (
                <TypeIcon type={type} key={`${type}_type_icon`} />
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
                  ['PK7', 'PK8', 'PA8', 'PK9'].includes(displayMon.format)
                    ? 6
                    : 5,
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
          </Grid>
        </Grid>
      </Grid>
      <Grid item xs={6} style={styles.detailsPane}>
        <div className="scroll-no-bar" style={styles.detailsTabRow}>
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
        <div style={styles.tabScrollContainer} className="scroll-no-bar">
          {tab === 'summary' ? (
            <SummaryDisplay mon={displayMon} />
          ) : tab === 'stats' ? (
            <StatsDisplay mon={displayMon} />
          ) : tab === 'ribbons' ? (
            <RibbonsDisplay mon={displayMon} />
          ) : tab === 'other' ? (
            <OtherDisplay mon={displayMon} />
          ) : (
            <RawDisplay bytes={displayMon.bytes} />
          )}
        </div>
      </Grid>
    </Grid>
  );
};

export default PokemonDisplay;
