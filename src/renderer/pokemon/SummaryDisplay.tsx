import { Card, Grid } from '@mui/material'
import { useMemo } from 'react'
import { POKEMON_DATA } from '../../consts'
import { PKM } from '../../types/PKMTypes/PKM'
import { getTypes } from '../../types/PKMTypes/util'
import { Styles } from '../../types/types'
import TypeIcon from '../components/TypeIcon'
import { getPublicImageURL } from '../images/images'
import { getPokemonSpritePath } from '../images/pokemon'
import AttributeRow from './AttributeRow'
import { BallsList, getItemIconPath } from '../images/items'

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
} as Styles

const SummaryDisplay = (props: { mon: PKM }) => {
  const { mon } = props

  const itemAltText = useMemo(() => {
    const monData = POKEMON_DATA[mon.dexNum]?.formes[mon.formNum]
    if (!monData) return 'pokemon sprite'
    return `${monData.formeName}${mon.isShiny ? '-shiny' : ''} sprite`
  }, [mon])

  return (
    <Grid container>
      <Grid xs={5}>
        <div style={styles.column}>
          <img
            draggable={false}
            alt={itemAltText}
            style={styles.image}
            src={getPublicImageURL(getPokemonSpritePath(mon))}
          />
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
              src={getPublicImageURL(getItemIconPath(mon.heldItemIndex, mon.format))}
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
          {getTypes(mon)?.map((type) => <TypeIcon type={type} key={`${type}_type_icon`} />)}
        </AttributeRow>
        <AttributeRow label="OT" value={`${mon.trainerName} ${mon.trainerGender ? '♀' : '♂'}`} />
        <AttributeRow
          label="Trainer ID"
          value={`${mon.displayID
            .toString()
            .padStart(['PK7', 'PK8', 'PA8', 'PK9'].includes(mon.format) ? 6 : 5, '0')}`}
        />
        {mon.ability !== undefined && (
          <AttributeRow
            label="Ability"
            value={`${mon.ability} (${mon.abilityNum === 4 ? 'HA' : mon.abilityNum})`}
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
  )
}
export default SummaryDisplay
