import { Card, Grid } from '@mui/material'
import { useMemo } from 'react'
import { hasGen5OnlyData } from 'src/types/interfaces/gen5'
import { hasGen8OnlyData, hasPLAData } from 'src/types/interfaces/gen8'
import { POKEMON_DATA } from '../../consts'
import { PKM } from '../../types/PKMTypes/PKM'
import { getTypes } from '../../types/PKMTypes/util'
import { hasGen2OnData } from '../../types/interfaces/gen2'
import { hasGen3OnData, hasOrreData } from '../../types/interfaces/gen3'
import { Styles } from '../../types/types'
import TypeIcon from '../components/TypeIcon'
import { getPublicImageURL } from '../images/images'
import { BallsList, getItemIconPath } from '../images/items'
import { getPokemonSpritePath } from '../images/pokemon'
import { getTypeColor } from '../util/PokemonSprite'
import AttributeRow from './AttributeRow'
import AttributeTag from './AttributeTag'

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
  language: { padding: '5px 10px 5px 10px', marginLeft: 'auto', color: 'white' },
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
      <Grid item xs={5}>
        <div style={styles.column}>
          <img
            draggable={false}
            alt={itemAltText}
            style={styles.image}
            src={getPublicImageURL(getPokemonSpritePath(mon))}
          />
        </div>
        <div style={styles.nicknameRow}>
          {hasGen3OnData(mon) ? (
            <img
              draggable={false}
              alt="poke ball type"
              style={{ width: 24, height: 24 }}
              src={BallsList[mon.ball]}
            />
          ) : (
            <div />
          )}
          <p style={{ fontWeight: 'bold' }}>{mon.nickname}</p>
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
        <div style={styles.flexRowWrap}>
          {mon.isShiny && (
            <AttributeTag
              icon={getPublicImageURL('icons/Shiny.png')}
              color="white"
              backgroundColor="#cc0000"
            />
          )}
          {hasGen8OnlyData(mon) && mon.canGigantamax && (
            <AttributeTag
              icon={getPublicImageURL('icons/GMax.png')}
              color="white"
              backgroundColor="#e60040"
            />
          )}
          {hasPLAData(mon) && (
            <>
              {mon.isAlpha && (
                <AttributeTag
                  icon={getPublicImageURL('icons/Alpha.png')}
                  color="white"
                  backgroundColor="#f2352d"
                />
              )}
              {mon.isNoble && (
                <AttributeTag label="NOBLE" backgroundColor="#cccc00" color="white" />
              )}
            </>
          )}
          {hasOrreData(mon) && mon.isShadow && (
            <AttributeTag label="SHADOW" backgroundColor={getTypeColor('shadow')} color="white" />
          )}
          {hasGen5OnlyData(mon) && mon.isNsPokemon && (
            <AttributeTag label="N's Pokémon" backgroundColor="green" color="white" />
          )}
        </div>
      </Grid>
      <Grid item xs={7} style={styles.attributesList}>
        <AttributeRow
          label="Name"
          value={`${POKEMON_DATA[mon.dexNum]?.formes[mon.formNum]?.formeName} ${
            hasGen2OnData(mon) ? ['♂', '♀', ''][mon.gender] : ''
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
        {hasGen3OnData(mon) && (
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
