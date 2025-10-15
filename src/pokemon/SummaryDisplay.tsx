import { MetadataLookup } from '@pkm-rs-resources/pkg'
import { getDisplayID } from '@pokemon-files/util'
import { Badge, Flex, Grid, Spinner, Tooltip } from '@radix-ui/themes'
import { useMemo } from 'react'
import { ErrorIcon } from 'src/components/Icons'
import PokemonIcon from '../components/PokemonIcon'
import TypeIcon from '../components/TypeIcon'
import { getPublicImageURL } from '../images/images'
import { BallsImageList, getItemIconPath } from '../images/items'
import { PKMInterface } from '../types/interfaces'
import { getTypes } from '../types/pkm/util'
import { Styles } from '../types/types'
import { getTypeColor } from '../util/PokemonSprite'
import AttributeRow from './AttributeRow'
import AttributeTag from './AttributeTag'
import useMonSprite from './useMonSprite'

const styles = {
  column: {
    height: 200,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    maxHeight: 100,
    transform: 'scale(2)',
    imageRendering: 'pixelated',
    objectFit: 'contain',
  },
  nicknameRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
} as Styles

const SummaryDisplay = (props: { mon: PKMInterface }) => {
  const { mon } = props
  const spriteResult = useMonSprite({
    dexNum: mon.dexNum,
    formeNum: mon.formeNum,
    formArgument: mon.formArgument,
    isShiny: mon.isShiny(),
    isFemale: mon.gender === 1,
    format: mon.format,
  })

  const itemAltText = useMemo(() => {
    const monData = MetadataLookup(mon.dexNum, mon.formeNum)

    if (!monData) return 'pokemon sprite'
    return `${monData.formeName}${mon.isShiny() ? '-shiny' : ''} sprite`
  }, [mon])

  return (
    <Grid columns="2" width="100%" p="3" gap="2">
      <div>
        <div style={styles.column}>
          <div
            style={{
              width: '100%',
              height: '100%',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {spriteResult.loading ? (
              <Spinner style={{ margin: 'auto', height: 32 }} />
            ) : spriteResult.path ? (
              <img
                draggable={false}
                alt={itemAltText}
                style={styles.image}
                src={spriteResult.path}
              />
            ) : (
              <PokemonIcon
                dexNumber={mon.dexNum}
                formeNumber={mon.formeNum}
                style={{
                  width: '60%',
                  height: '90%',
                  margin: 'auto',
                  imageRendering: 'pixelated',
                }}
              />
            )}
            {spriteResult.errorMessage && (
              <Tooltip content={spriteResult.errorMessage}>
                <Badge
                  variant="solid"
                  color="tomato"
                  style={{
                    position: 'absolute',
                    bottom: '10%',
                    right: '10%',
                  }}
                >
                  <ErrorIcon fontSize={20} />
                </Badge>
              </Tooltip>
            )}
          </div>
        </div>
        <div style={styles.nicknameRow}>
          {mon.ball ? (
            <img
              draggable={false}
              alt="poke ball type"
              style={{ width: 24, height: 24 }}
              src={BallsImageList[mon.ball]}
            />
          ) : (
            <div />
          )}
          <div style={{ fontWeight: 'bold' }}>{mon.nickname}</div>
          <Badge variant="solid" color="gray" ml="2" size="1">
            {mon.languageString}
          </Badge>
        </div>
        <AttributeRow label="Item" justifyEnd>
          {mon.heldItemName !== 'None' && (
            <img
              alt="item icon"
              src={getPublicImageURL(getItemIconPath(mon.heldItemIndex, mon.format))}
              style={{ width: 24, height: 24, marginRight: 5 }}
            />
          )}
          <div>{mon.heldItemName}</div>
        </AttributeRow>
        <div style={styles.flexRowWrap}>
          {mon.isShiny() && (
            <AttributeTag
              icon={getPublicImageURL('icons/Shiny.png')}
              color="white"
              backgroundColor="#cc0000"
            />
          )}
          {mon.canGigantamax && (
            <AttributeTag
              icon={getPublicImageURL('icons/GMax.png')}
              color="white"
              backgroundColor="#e60040"
            />
          )}
          {mon.isAlpha && (
            <AttributeTag
              icon={getPublicImageURL('icons/Alpha.png')}
              color="white"
              backgroundColor="#f2352d"
            />
          )}
          {mon.isNoble && <AttributeTag label="NOBLE" backgroundColor="#cccc00" color="white" />}
          {'isShadow' in mon && (mon.isShadow as boolean) && (
            <AttributeTag label="SHADOW" backgroundColor={getTypeColor('shadow')} color="white" />
          )}
          {mon.isNsPokemon && (
            <AttributeTag label="N's Pokémon" backgroundColor="green" color="white" />
          )}
        </div>
      </div>
      <Flex direction="column" gap="2px">
        <AttributeRow label="Nickname" value={mon.nickname} />
        <AttributeRow
          label="Species"
          value={`${MetadataLookup(mon.dexNum, mon.formeNum)?.formeName} ${
            mon.gender !== undefined ? ['♂', '♀', ''][mon.gender] : ''
          }`}
        />
        <AttributeRow label="Dex No." value={`${mon.dexNum}`} />
        <AttributeRow label="Type">
          {getTypes(mon)?.map((type) => (
            <TypeIcon type={type} key={`${type}_type_icon`} />
          ))}
        </AttributeRow>
        <AttributeRow label="OT" value={`${mon.trainerName} ${mon.trainerGender ? '♀' : '♂'}`} />
        <AttributeRow label="Trainer ID" value={getDisplayID(mon as any)} />
        {mon.ability !== undefined && (
          <AttributeRow
            label="Ability"
            value={`${mon.ability.name} (${mon.abilityNum === 4 ? 'HA' : mon.abilityNum})`}
          />
        )}
        <AttributeRow label="Level">{mon.getLevel()}</AttributeRow>
        <AttributeRow label="EXP">{mon.exp}</AttributeRow>
      </Flex>
    </Grid>
  )
}

export default SummaryDisplay
