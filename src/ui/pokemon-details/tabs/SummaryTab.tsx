import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { PKM } from '@openhome-core/pkm/PKM'
import { getTypes } from '@openhome-core/pkm/util'
import { getDisplayID } from '@openhome-core/util'
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
  genderFromBool,
  Languages,
  MetadataSummaryLookup,
  OriginGames,
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
    dexNum: mon.dexNum,
    formNum: mon.formNum,
    formArgument: mon.formArgument,
    isShiny: mon.isShiny(),
    isFemale: mon.gender === 1,
    format: mon.format,
    extraFormIndex: mon.extraFormIndex,
    heldItemIndex: mon.heldItemIndex,
  })

  const itemAltText = useMemo(() => {
    const monData = MetadataSummaryLookup(mon.dexNum, mon.formNum)

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
              dexNumber={mon.dexNum}
              formIndex={mon.formNum}
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
