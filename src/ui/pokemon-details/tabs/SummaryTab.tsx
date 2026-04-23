import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { getTypes } from '@openhome-core/pkm/util'
import AttributeRow from '@openhome-ui/components/AttributeRow'
import AttributeTag from '@openhome-ui/components/AttributeTag'
import { ErrorIcon } from '@openhome-ui/components/Icons'
import GenderIcon from '@openhome-ui/components/pokemon/GenderIcon'
import TypeIcon from '@openhome-ui/components/pokemon/TypeIcon'
import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { BallsImageList, getItemIconPath } from '@openhome-ui/images/items'
import { colorIsDark, SHADOW_TYPE_COLOR } from '@openhome-ui/util/color'
import {
  AbilityNumber,
  extraFormDisplayName,
  genderFromBool,
  getPluginColor,
  MetadataSummaryLookup,
  OriginGames,
} from '@pkm-rs/pkg'
import { PKM } from '@pokemon-files/pkm/PKM'
import { getDisplayID } from '@pokemon-files/util'
import { Badge, Button, Flex, Grid, Spinner, Tooltip } from '@radix-ui/themes'
import { useMemo } from 'react'
import { OHPKM } from 'src/core/pkm/OHPKM'
import { useSaves } from 'src/ui/state/saves'
import { MonTag } from 'src/ui/util/tags'
import { TagIcon } from '../../components/TagIcon'
import useMonSprite from '../useMonSprite'

type MonWithManagementData = PKMInterface & {
  tags?: MonTag[]
}

type SummaryDisplayProps = {
  mon: PKMInterface
}

const SummaryDisplay = (props: SummaryDisplayProps) => {
  const { mon } = props
  const tags = useMemo(() => {
    return (mon as MonWithManagementData).tags ?? []
  }, [mon])
  const spriteResult = useMonSprite({
    dexNum: mon.dexNum,
    formNum: mon.formNum,
    formArgument: mon.formArgument,
    isShiny: mon.isShiny(),
    isFemale: mon.gender === 1,
    format: mon.format,
    extraFormIndex: mon.extraFormIndex,
  })

  const itemAltText = useMemo(() => {
    const monData = MetadataSummaryLookup(mon.dexNum, mon.formNum)

    if (!monData) return 'pokemon sprite'
    return `${monData.formeName}${mon.isShiny() ? '-shiny' : ''} sprite`
  }, [mon])
  const { revertMonAbility } = useSaves()

  return (
    <Grid columns="2" width="100%" p="3" gap="2">
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
              dexNumber={mon.dexNum}
              formeNumber={mon.formNum}
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
                style={{ position: 'absolute', bottom: '10%', right: '10%' }}
              >
                <ErrorIcon fontSize={20} />
              </Badge>
            </Tooltip>
          )}
        </div>
        <div className="nickname-row">
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
              src={getPublicImageURL(getItemIconPath(mon.heldItemIndex))}
              style={{ width: 24, height: 24, marginRight: 5 }}
            />
          )}
          <div>{mon.heldItemName}</div>
        </AttributeRow>
        <Flex direction="row" gap="1" align="center" wrap="wrap">
          {tags.length > 0 &&
            tags.map((tag, i) => (
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
        <div>
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
          {mon instanceof OHPKM && mon.unconvertedPkm && (
            <AttributeTag label="Has Unconverted PKM" color="white" backgroundColor="blue" />
          )}
          {mon.isNoble && <AttributeTag label="NOBLE" backgroundColor="#cccc00" color="white" />}
          {'isShadow' in mon && (mon.isShadow as boolean) && (
            <AttributeTag label="SHADOW" backgroundColor={SHADOW_TYPE_COLOR} color="white" />
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
                      ? getPluginColor(mon.pluginOrigin)
                      : OriginGames.color(mon.gameOfOrigin)
                  )
                    ? '#fff'
                    : '#000',
                  backgroundColor: mon.pluginOrigin
                    ? getPluginColor(mon.pluginOrigin)
                    : OriginGames.color(mon.gameOfOrigin),
                }}
              >
                {extraFormDisplayName(mon.extraFormIndex)}
              </span>
            ) : (
              MetadataSummaryLookup(mon.dexNum, mon.formNum)?.formeName
            )}
            <GenderIcon gender={mon.gender} />
          </Flex>
        </AttributeRow>
        <AttributeRow label="Dex No." value={`${mon.dexNum}`} />
        <AttributeRow label="Type">
          {getTypes(mon)?.map((type) => (
            <TypeIcon type={type} key={`${type}_type_icon`} />
          ))}
        </AttributeRow>
        <AttributeRow label="OT">
          <Flex gap="1">
            {mon.trainerName}
            <GenderIcon gender={genderFromBool(mon.trainerGender)} />
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

export default SummaryDisplay
