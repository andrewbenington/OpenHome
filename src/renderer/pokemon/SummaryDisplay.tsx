import { Card, Grid } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { getTypes } from 'types/PKMTypes/util';
import { StringToStringMap, Styles } from 'types/types';
import { POKEMON_DATA } from '../../consts';
import {
  BW2_TRANSFER_RESTRICTIONS,
  GEN1_TRANSFER_RESTRICTIONS,
  GEN2_TRANSFER_RESTRICTIONS,
  GEN3_TRANSFER_RESTRICTIONS,
  HGSS_TRANSFER_RESTRICTIONS,
  LA_TRANSFER_RESTRICTIONS,
  ORAS_TRANSFER_RESTRICTIONS,
  USUM_TRANSFER_RESTRICTIONS,
} from '../../consts/TransferRestrictions';
import { PKM } from '../../types/PKMTypes/PKM';
import { isRestricted } from '../../types/TransferRestrictions';
import TypeIcon from '../components/TypeIcon';
import { BallsList } from '../images/Images';
import { getItemIconPath, getSpritePath } from '../util/PokemonSprite';
import AttributeRow from './AttributeRow';

const styles = {
  column: {
    height: 200,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    maxWidth: 100,
    maxHeight: 100,
    transform: 'scale(2)',
    imageRendering: 'pixelated',
    objectFit: 'contain',
  },
  attributesList: { textAlign: 'left', width: '30%', marginTop: 10 },
  language: { padding: '5px 10px 5px 10px', marginLeft: 'auto' },
  nicknameRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 10,
  },
} as Styles;

const SummaryDisplay = (props: { mon: PKM }) => {
  const { mon } = props;
  const [monSprites, setMonSprites] = useState<StringToStringMap>();
  const [itemIcon, setItemIcon] = useState<string>();

  const itemAltText = useMemo(() => {
    const monData = POKEMON_DATA[mon.dexNum]?.formes[mon.formNum];
    if (!monData) return 'pokemon sprite';
    return `${monData.formeName}${mon.isShiny ? '-shiny' : ''} sprite`;
  }, [mon]);

  const monSpriteSource = useMemo(
    () => (monSprites ? monSprites[mon.format] : ''),
    [mon.format, monSprites]
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
    <Grid container>
      <Grid xs={5}>
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
        <div style={styles.nicknameRow}>
          {mon.ball ? (
            <img
              draggable={false}
              alt="poke ball type"
              style={{ width: 24, height: 24 }}
              src={BallsList[mon.ball ?? 3]}
            />
          ) : (
            <div />
          )}
          <p style={{ fontWeight: 'bold' }}>
            {mon.nickname}
            {mon.affixedRibbonTitle ? ` ${mon.affixedRibbonTitle}` : ''}
          </p>
          <Card style={styles.language}>{mon.language}</Card>
        </div>
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
      <Grid xs={7} style={styles.attributesList}>
        <AttributeRow
          label="Name"
          value={`${POKEMON_DATA[mon.dexNum]?.formes[mon.formNum]?.formeName} ${
            ['♂', '♀', ''][mon.gender]
          }`}
        />
        <AttributeRow label="Dex No." value={`${mon.dexNum}`} />
        <AttributeRow label="Type">
          {getTypes(mon)?.map((type) => (
            <TypeIcon type={type} key={`${type}_type_icon`} />
          ))}
        </AttributeRow>
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
        {mon.ability !== undefined && (
          <AttributeRow
            label="Ability"
            value={`${mon.ability} (${
              mon.abilityNum === 4 ? 'HA' : mon.abilityNum
            })`}
          />
        )}
        <AttributeRow label="Level" justifyEnd>
          {mon.level}
        </AttributeRow>
        <AttributeRow label="EXP" justifyEnd>
          {mon.exp}
        </AttributeRow>
      </Grid>
    </Grid>
  );
};
export default SummaryDisplay;
