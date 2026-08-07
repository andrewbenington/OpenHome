import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { PKM } from '@openhome-core/pkm/PKM'
import { getTypes } from '@openhome-core/pkm/util'
import { getDisplayID } from '@openhome-core/util'
import { pluralize } from '@openhome-core/util/format'
import { Option } from '@openhome-core/util/functional'
import AttributeRow from '@openhome-ui/components/AttributeRow'
import AttributeTag from '@openhome-ui/components/AttributeTag'
import { ErrorIcon } from '@openhome-ui/components/Icons'
import GenderIcon from '@openhome-ui/components/pokemon/GenderIcon'
import TypeIcon from '@openhome-ui/components/pokemon/TypeIcon'
import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { BallsImageList, getItemIconPath } from '@openhome-ui/images/items'
import { useSaves } from '@openhome-ui/state/saves'
import { colorIsDark, SHADOW_TYPE_COLOR } from '@openhome-ui/util/color'
import { formatTitleAndNickname } from '@openhome-ui/util/format'
import {
  AbilityNumber,
  Ball,
  extraFormDisplayName,
  Languages,
  MetadataSummaryLookup,
  OriginGames,
  Pokerus,
} from '@pkm-rs/pkg'
import { Badge, Button, Flex, Grid, Spinner, Tooltip } from '@radix-ui/themes'
import { useMemo } from 'react'
import { TagIcon } from '../../components/TagIcon'
import useMonSprite from '../useMonSprite'
import './SummaryTab.css'

type SummaryDisplayProps = {
  mon: PKMInterface
}

const SummaryDisplay = (props: SummaryDisplayProps) => {
  const { mon } = props

  const spriteResult = useMonSprite({
    nationalDex: mon.nationalDex,
    formIndex: mon.formIndex,
    formArgument: mon.formArgument,
    isShiny: mon.isShiny(),
    isFemale: mon.gender === 1,
    format: mon.format,
    extraFormIndex: mon.extraFormIndex,
    heldItemIndex: mon.heldItemIndex,
  })

  const itemAltText = useMemo(() => {
    const monData = MetadataSummaryLookup(mon.nationalDex, mon.formIndex)

    if (!monData) return 'pokemon sprite'
    return `${monData.formeName}${mon.isShiny() ? '-shiny' : ''} sprite`
  }, [mon])
  const { revertMonAbility } = useSaves()

  return (
    <Grid className="pokemon-modal-content" columns="2" width="100%">
      <Flex direction="column" gap="2">
        <div className="mon-image-container">
          {spriteResult.loading ? (
            <Spinner style={{ margin: 'auto', height: 32 }} />
          ) : spriteResult.path ? (
            <img
              className="summary-image"
              draggable={false}
              alt={itemAltText}
              src={spriteResult.path}
            />
          ) : (
            <PokemonIcon
              nationalDex={mon.nationalDex}
              formIndex={mon.formIndex}
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
                style={{ position: 'absolute', top: '0.5rem', left: '0.5rem' }}
              >
                <ErrorIcon fontSize={20} />
              </Badge>
            </Tooltip>
          )}
        </div>
        <div className="nickname-row">
          <img
            draggable={false}
            alt="poke ball type"
            style={{ width: 24, height: 24 }}
            src={BallsImageList[mon.ball ?? Ball.Poke]}
          />
          <div style={{ fontWeight: 'bold' }}>{formatTitleAndNickname(mon)}</div>
          <Badge variant="solid" color="gray" ml="2" size="1">
            {Languages.stringFromByte(mon.language)}
          </Badge>
        </div>
        <AttributeRow label="Item" justifyEnd>
          {mon.heldItemName !== 'None' && (
            <img
              alt="item icon"
              src={getPublicImageURL(getItemIconPath(mon.heldItemIndex))}
              style={{ width: 24, height: 24, marginRight: 5 }}
            />
          )}
          <div>{mon.heldItemName}</div>
        </AttributeRow>
        <Flex direction="row" gap="1" align="center" wrap="wrap">
          {mon.tags?.map((tag, i) => (
            <Badge
              key={i}
              variant="solid"
              size="1"
              style={{
                backgroundColor: tag.color ?? '#888',
                color: colorIsDark(tag.color ?? '#888') ? '#fff' : '#000',
              }}
            >
              <TagIcon iconName={tag.icon} size={10} />
              {tag.label}
            </Badge>
          ))}
        </Flex>
        <div className="attribute-badges">
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
          <PokerusIndicator pokerusByte={mon.pokerusByte} />
          {mon.isAlpha && (
            <AttributeTag
              icon={getPublicImageURL('icons/Alpha.png')}
              label="Alpha"
              color="white"
              backgroundColor="#f2352d"
            />
          )}
          {mon instanceof OHPKM && mon.unconvertedPkm && (
            <AttributeTag label="Has Unconverted PKM" color="white" backgroundColor="blue" />
          )}
          {mon.isNoble && <AttributeTag label="Noble" backgroundColor="#cccc00" color="white" />}
          {'isShadow' in mon && (mon.isShadow as boolean) && (
            <AttributeTag label="Shadow" backgroundColor={SHADOW_TYPE_COLOR} color="white" />
          )}
          {mon.isNsPokemon && (
            <AttributeTag label="N's Pokémon" backgroundColor="green" color="white" />
          )}
        </div>
      </Flex>
      <Flex direction="column" gap="2px">
        <AttributeRow label="Nickname" value={mon.nickname} />
        <AttributeRow label="Species">
          <Flex gap="1">
            {mon.extraFormIndex ? (
              <span
                className="extra-form-name"
                style={{
                  color: colorIsDark(
                    mon.pluginOrigin
                      ? OriginGames.pluginColor(mon.pluginOrigin)
                      : OriginGames.color(mon.gameOfOrigin)
                  )
                    ? '#fff'
                    : '#000',
                  backgroundColor: mon.pluginOrigin
                    ? OriginGames.pluginColor(mon.pluginOrigin)
                    : OriginGames.color(mon.gameOfOrigin),
                }}
              >
                {extraFormDisplayName(mon.extraFormIndex)}
              </span>
            ) : (
              MetadataSummaryLookup(mon.nationalDex, mon.formIndex)?.formeName
            )}
            <GenderIcon gender={mon.gender} />
          </Flex>
        </AttributeRow>
        <AttributeRow label="Dex No." value={`${mon.nationalDex}`} />
        <AttributeRow label="Type">
          {getTypes(mon)?.map((type) => (
            <TypeIcon type={type} key={`${type}_type_icon`} />
          ))}
        </AttributeRow>
        <AttributeRow label="OT">
          <Flex gap="1">
            {mon.trainerName}
            <GenderIcon gender={mon.trainerGender} />
          </Flex>
        </AttributeRow>
        <AttributeRow label="Trainer ID" value={getDisplayID(mon as PKM)} />
        {mon.ability !== undefined && (
          <AttributeRow label="Ability">
            {mon.ability.name} ({mon.abilityNum === 4 ? 'HA' : mon.abilityNum})
            {mon instanceof OHPKM &&
              mon.abilityWasChanged() &&
              !mon.metadata
                ?.abilityByNum(AbilityNumber.First)
                .equals(mon.metadata?.abilityByNum(AbilityNumber.Second)) && (
                <Button
                  size="1"
                  radius="full"
                  style={{ height: '1rem', marginLeft: 5 }}
                  onClick={() => revertMonAbility(mon.openhomeId)}
                >
                  Revert
                </Button>
              )}
          </AttributeRow>
        )}
        <AttributeRow label="Level">{mon.getLevel()}</AttributeRow>
        <AttributeRow label="EXP">{mon.exp}</AttributeRow>
      </Flex>
    </Grid>
  )
}

function PokerusIndicator(props: { pokerusByte: Option<number> }) {
  const pokerus = Pokerus.fromByte(props.pokerusByte ?? 0)
  switch (pokerus.status()) {
    case 'Uninfected':
      return null
    case 'Infected':
      return (
        <AttributeTag
          icon={getPublicImageURL('icons/pokerus-infected.png')}
          color="white"
          backgroundColor="#eb3cae"
          label={`${pluralize(pokerus.daysRemaining(), 'Day')} Remaining`}
        />
      )
    case 'Cured':
      return (
        <AttributeTag
          icon={getPublicImageURL('icons/pokerus-cured.png')}
          color="white"
          backgroundColor="#eb3cae"
          label="Cured"
        />
      )
  }
}

export default SummaryDisplay
