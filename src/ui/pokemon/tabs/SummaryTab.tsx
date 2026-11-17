import { PKMInterface, PKMInterface as PkmInterface } from '@openhome-core/pkm/interfaces'
import { getLocationString, getLocationStringOrOrigin } from '@openhome-core/pkm/MetLocation'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { PKM } from '@openhome-core/pkm/PKM'
import { getCharacteristic, getTypes } from '@openhome-core/pkm/util'
import { SAVClass } from '@openhome-core/save/types'
import { getPluginIdentifier } from '@openhome-core/save/util'
import { FullMetadataLookup, getDisplayID } from '@openhome-core/util'
import { Option } from '@openhome-core/util/functional'
import AttributeRow from '@openhome-ui/components/AttributeRow'
import Badge from '@openhome-ui/components/badge/Badge'
import { ErrorIcon } from '@openhome-ui/components/Icons'
import OhoFlex from '@openhome-ui/components/OhoFlex'
import GenderIcon from '@openhome-ui/components/pokemon/GenderIcon'
import Markings from '@openhome-ui/components/pokemon/Markings'
import TypeIcon from '@openhome-ui/components/pokemon/TypeIcon'
import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import { Tabs } from '@openhome-ui/components/Tabs'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { BallsImageList, getItemIconPath } from '@openhome-ui/images/items'
import { AppInfoContext } from '@openhome-ui/state/appInfo'
import { useOhpkmStore } from '@openhome-ui/state/ohpkm'
import { useSaves } from '@openhome-ui/state/saves'
import { colorIsDark, SHADOW_TYPE_COLOR } from '@openhome-ui/util/color'
import { formatTitleAndNickname } from '@openhome-ui/util/format'
import {
  AbilityNumber,
  Ball,
  BinaryGender,
  extraFormDisplayName,
  ExtraFormMetadata,
  formatMatchesOrigin,
  FormMetadata,
  Language,
  Languages,
  OriginGame,
  OriginGames,
} from '@pkm-rs/pkg'
import { Button, Flex, Badge as RadixBadge, Separator, Spinner, Tooltip } from '@radix-ui/themes'
import { useContext, useMemo, useState } from 'react'
import { TagIcon } from '../../components/TagIcon'
import useMonSprite from '../useMonSprite'
import './SummaryTab.css'

type SummaryDisplayProps = {
  mon: PkmInterface
}

export default function SummaryTab(props: SummaryDisplayProps) {
  const { mon } = props
  const [spriteError, setSpriteError] = useState<string>()

  const monMetadata = FullMetadataLookup(mon)

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
    if (!monMetadata) return 'pokemon sprite'
    return `${monMetadata.formName}${mon.isShiny() ? '-shiny' : ''} sprite`
  }, [mon, monMetadata])

  const errorMessage = spriteError ?? spriteResult.errorMessage

  return (
    <Flex className="pokemon-modal-content" minHeight="100%" width="100%" direction="column">
      <Flex gap="2">
        <Flex
          className="pokemon-modal-card"
          direction="column"
          gap="2"
          width="24rem"
          position="relative"
        >
          <div className="nickname-row">
            <img
              draggable={false}
              alt="poke ball type"
              style={{ width: 24, height: 24 }}
              src={BallsImageList[mon.ball ?? Ball.Poke]}
            />
            <div style={{ fontWeight: 'bold', textWrap: 'nowrap' }}>
              {formatTitleAndNickname(mon)}
            </div>
            <RadixBadge variant="solid" color="gray" ml="2" size="1">
              {Languages.stringFromByte(mon.language)}
            </RadixBadge>
            <OhoFlex.Spacer />
            <div className="item-display">
              <img alt="item icon" src={getPublicImageURL(getItemIconPath(mon.heldItemIndex))} />
              <div>{mon.heldItemIndex ? mon.heldItemName : 'No Item'}</div>
            </div>
          </div>
          <Separator />
          <div className="mon-image-container">
            {spriteResult.loading ? (
              <Spinner style={{ margin: 'auto', height: 32 }} />
            ) : spriteResult.path && !spriteError ? (
              <img
                className="summary-image"
                draggable={false}
                alt={itemAltText}
                src={spriteResult.path}
                onError={() =>
                  setSpriteError(`Could not load image: ${decodeURIComponent(spriteResult.path)}`)
                }
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
            {errorMessage && (
              <Tooltip content={errorMessage}>
                <RadixBadge
                  variant="solid"
                  color="tomato"
                  style={{ position: 'absolute', top: '0.5rem', left: '0.5rem' }}
                >
                  <ErrorIcon fontSize={20} />
                </RadixBadge>
              </Tooltip>
            )}
          </div>
          <div className="attribute-badges">
            {mon.isShiny() && (
              <Badge.Image
                src={getPublicImageURL('icons/Shiny.png')}
                color="white"
                backgroundColor="#cc0000"
              />
            )}
            <Badge.Gigantamax showIf={mon.canGigantamax} showLabel />
            <Badge.Pokerus pokerusByte={mon.pokerusByte} showLabel />
            <Badge.Alpha showIf={mon.isAlpha} showLabel />
            {mon.isNoble && <Badge.Image label="Noble" backgroundColor="#cccc00" color="white" />}
            <Badge.Image
              label="Shadow"
              backgroundColor={SHADOW_TYPE_COLOR}
              color="white"
              showIf={mon.isShadow}
            />
            <Badge.NsPokemon showIf={mon.isNsPokemon} showLabel />
          </div>
        </Flex>
        <SummaryAttributeRows mon={mon} monMetadata={monMetadata} />
      </Flex>
      <div
        className="pokemon-modal-card"
        style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
      >
        {Boolean(mon.tags?.length) && (
          <Flex direction="row" gap="1" align="center" wrap="wrap">
            {mon.tags?.map((tag, i) => (
              <RadixBadge
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
              </RadixBadge>
            ))}
          </Flex>
        )}
        <MetDataDisplay mon={mon} />
      </div>
    </Flex>
  )
}

type SummaryAttributeRowsProps = {
  mon: PkmInterface
  monMetadata: Option<FormMetadata | ExtraFormMetadata>
}

function SummaryAttributeRows(props: SummaryAttributeRowsProps) {
  const { mon, monMetadata } = props
  const { revertMonAbility } = useSaves()

  return (
    <Flex direction="column" gap="2px" flexGrow="1">
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
            monMetadata?.formName
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
      {mon.ability !== undefined && mon instanceof OHPKM && mon.abilityWasChanged() ? (
        <AttributeRow label="Ability">
          {mon.ability.name} ({mon.abilityNum === 4 ? 'HA' : mon.abilityNum})
          {monMetadata &&
            'abilityByNum' in monMetadata &&
            !monMetadata
              .abilityByNum(AbilityNumber.First)
              .equals(monMetadata?.abilityByNum(AbilityNumber.Second)) && (
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
      ) : (
        monMetadata &&
        'abilityByNum' in monMetadata && (
          <AttributeRow label="Ability">
            <ToggleTabs
              options={[
                { id: '1', display: `1. ${monMetadata?.abilityByNum(1).name}` },
                { id: '2', display: `2. ${monMetadata?.abilityByNum(2).name}` },
                { id: '4', display: `HA. ${monMetadata?.abilityByNum(4).name}` },
              ]}
              active={String(mon.abilityNum)}
            />
          </AttributeRow>
        )
      )}
      <AttributeRow label="Level">{mon.getLevel()}</AttributeRow>
      <AttributeRow label="EXP">{mon.exp}</AttributeRow>
    </Flex>
  )
}

type ToggleTabOption = {
  id: string
  display: string
}

type ToggleTabsProps = {
  options: ToggleTabOption[]
  active: string
}

function ToggleTabs(props: ToggleTabsProps) {
  return (
    <Tabs.Root value={props.active} orientation="horizontal" className="toggle-tabs">
      <Tabs.List className="toggle-tabs-list">
        {props.options.map(({ id, display }) => (
          <Tabs.Tab value={id} key={id}>
            {display}
          </Tabs.Tab>
        ))}
        <Tabs.Indicator />
      </Tabs.List>
    </Tabs.Root>
  )
}

const metTimesOfDay = ['in the morning', 'during the daytime', 'in the evening']
const eeveelutions = [133, 134, 135, 136, 196, 197, 470, 471, 720]

const MetDataDisplay = (props: { mon: PKMInterface }) => {
  const { mon } = props
  const [, , getEnabledSaveTypes] = useContext(AppInfoContext)
  const { updateMonMarkings } = useOhpkmStore()

  const eggMessage = useMemo(() => {
    if (!mon.eggLocationIndex || !mon.eggDate || !mon.gameOfOrigin) {
      return undefined
    }
    return `Egg received on ${mon.eggDate.month}/${mon.eggDate.day}/${
      mon.eggDate.year
    } ${getLocationString(mon.gameOfOrigin, mon.eggLocationIndex, mon.nationalDex, mon.trainerID, mon.trainerName, Language.English, true)}.` // todo: i18n
  }, [mon])

  const metMessage = buildMetMessage(mon, getEnabledSaveTypes())

  const natureMessage = useMemo(() => {
    const currentNature = mon.statNature ?? mon.nature
    if (!currentNature || !mon.nature) return undefined

    let message = 'Has a'
    const vowelStart = ['A', 'E', 'I', 'O', 'U'].includes(currentNature.name[0])

    if (vowelStart) {
      message += 'n'
    }
    message += ` ${currentNature.name} nature.`
    if (mon.statNature && !mon.nature?.equals(mon.statNature)) {
      message += ` (originally ${mon.nature.name})`
    }
    return message
  }, [mon])

  // rom hack origin mons will all have an "official origin game" that corresponds to the rom hack's base game. The origin mark will use that base game.
  const markImage = mon.gameOfOrigin ? OriginGames.markPath(mon.gameOfOrigin) : undefined

  return (
    <div style={{ display: 'flex', flexDirection: 'row', flex: 1 }}>
      <div className="met-data-left-side">
        <div className="met-data-text">
          {eggMessage && <p>{eggMessage}</p>}
          <p>{metMessage}</p>
          {natureMessage && <p>{natureMessage}</p>}
          <p>{getCharacteristic(mon)}</p>
        </div>
      </div>
      <Flex direction="column">
        <div className="game-container">
          {mon.gameOfOrigin && (
            <img
              className="game-image"
              draggable={false}
              alt={`${mon.pluginOrigin ?? OriginGames.gameNameFull(mon.gameOfOrigin)} logo`}
              src={
                mon.pluginOrigin
                  ? `logos/${mon.pluginOrigin}.png`
                  : OriginGames.logoPath(mon.gameOfOrigin)
              }
            />
          )}
          {markImage && (
            <img className="origin-mark" draggable={false} alt="origin mark" src={markImage} />
          )}
        </div>
        {mon instanceof OHPKM ? (
          <Markings
            markings={mon.markings}
            onUpdate={(newMarkings) => updateMonMarkings(mon.openhomeId, newMarkings)}
          />
        ) : 'markings' in mon && mon.markings ? (
          <Markings markings={mon.markings} />
        ) : (
          <div />
        )}
      </Flex>
    </div>
  )
}

function buildMetMessage(mon: PKMInterface, enabledSaves: SAVClass[]) {
  if (
    (mon.gameOfOrigin !== OriginGame.ColosseumXd &&
      !OriginGames.isGameboy(mon.gameOfOrigin) &&
      !mon.metLocationIndex) ||
    (OriginGames.isBdsp(mon.gameOfOrigin) && mon.metLocationIndex === 65535) // BDSP Egg
  ) {
    return 'Met location unknown.' // todo: i18n
  }

  if (mon.format === 'PK3' && mon.gameOfOrigin === OriginGame.ColosseumXd) {
    return 'Obtained in a trade.' // todo: i18n
  }

  let isXdStarter =
    mon.gameOfOrigin === OriginGame.ColosseumXd &&
    eeveelutions.includes(mon.nationalDex) &&
    mon.metLocationIndex === 0
  let isGcnMetAt254 = mon.gameOfOrigin === OriginGame.ColosseumXd && mon.metLocationIndex === 254
  let isColoStarter = isGcnMetAt254 && [196, 197].includes(mon.nationalDex)
  let isPalPark =
    mon.format === 'PK4' &&
    !mon.encounterType &&
    (OriginGames.isGba(mon.gameOfOrigin) || mon.gameOfOrigin === OriginGame.ColosseumXd) &&
    mon.metLocationIndex === 0x37
  let isHayleyGift =
    mon.gameOfOrigin === OriginGame.Diamond &&
    mon.trainerName === 'Hayley' &&
    mon.trainerID === 1000 &&
    mon.trainerGender === BinaryGender.Female // My Pokemon Ranch gift

  let message = 'Met'
  if (isXdStarter) {
    if (mon.format === 'XDPKM') return `Obtained from ${mon.trainerName}'s dad.`
    if (mon.format === 'OHPKM') {
      message = `Obtained from ${mon.trainerName}'s dad` // todo: i18n
    }
  }
  if (isColoStarter) {
    if (mon.format === 'COLOPKM') return `${mon.trainerName}'s old friend.`
    if (mon.format === 'OHPKM') {
      message = `${mon.trainerName}'s old friend, met` // todo: i18n
    }
  }
  if (
    (['PK1', 'PK2'].includes(mon.format) && !OriginGames.isGameboy(mon.gameOfOrigin)) ||
    (mon.format === 'PK3' && mon.metLocationIndex === 254)
  ) {
    message = `Obtained in a trade` // todo: i18n
  }
  if (mon.format === 'OHPKM') {
    if (
      !mon.encounterType &&
      // to prevent collisions with other games
      mon.gameOfOrigin >= OriginGame.HeartGold &&
      mon.gameOfOrigin <= OriginGame.Platinum
    ) {
      if (mon.eggLocationIndex) {
        message = 'Hatched' // todo: i18n
      } else if (isHayleyGift) {
        message = 'Received' // todo: i18n
      }
    } else if (mon.encounterType === 12) {
      message = 'Received' // todo: i18n
    } else if (mon.encounterType === 24 && mon.metLocationIndex) {
      if ([0x5e, 0x8c].includes(mon.metLocationIndex)) {
        // met in Oreburgh Museum or Pewter Museum, must have been revived from a fossil
        message = 'Resurrected' // todo: i18n
      } else {
        // most likely received as a gift or in Sinjoh
        message = 'Received' // todo: i18n
      }
    }
  } else if (isPalPark) {
    message = 'Reunited in Pal Park' // todo: i18n
  }

  if (mon.pluginOrigin) {
    const pluginSaveType = enabledSaves.find(
      (saveType) => mon.pluginOrigin === getPluginIdentifier(saveType)
    )

    if (pluginSaveType) {
      message += ` in ${pluginSaveType.saveTypeName}`
    } else {
      message += ` in ${OriginGames.gameNameFull(mon.gameOfOrigin) ?? '(unknown game)'}`
    }
  }

  if (mon.metTimeOfDay) {
    message += ` ${metTimesOfDay[mon.metTimeOfDay - 1]}`
  }
  if (mon.metDate) {
    if (mon.format === 'OHPKM' && (isColoStarter || isXdStarter)) {
      message += ' sometime before'
    } else {
      message += ' on'
    }
    message += ` ${mon.metDate.month}/${mon.metDate.day}/${mon.metDate.year}`
  }

  if (mon.format === 'OHPKM') {
    if (mon.encounterType) {
      if (mon.encounterType === 2) {
        message += ' in the tall grass' // todo: i18n
      } else if ([5, 9].includes(mon.encounterType)) {
        message += ' while exploring' // todo: i18n
      } else if (mon.encounterType === 7) {
        message += ' in the water' // todo: i18n
      } else if (mon.encounterType === 10) {
        message += ' while playing the Safari Game' // todo: i18n
      }
    } else {
      if (
        mon.gameOfOrigin >= OriginGame.HeartGold &&
        mon.gameOfOrigin <= OriginGame.Platinum &&
        !isPalPark &&
        !mon.eggLocationIndex
      ) {
        if (mon.metLocationIndex) {
          if (mon.metLocationIndex >= 3000) {
            message += ' on a special occasion' // todo: i18n
          } else if (isHayleyGift) {
            message += ` from ${mon.trainerName}, who met it` // todo: i18n
          }
        } else if (
          mon.gameOfOrigin >= OriginGame.Diamond &&
          mon.gameOfOrigin <= OriginGame.Platinum
        ) {
          message += ' on a Honey Tree' // todo: i18n
        } else if (
          [OriginGame.HeartGold, OriginGame.SoulSilver].includes(mon.gameOfOrigin) &&
          mon.metLocationIndex !== 0xe9 // Pokewalker
        ) {
          message += ' after headbutting a tree' // todo: i18n
        }
      }
    }
  }

  if (!mon.metLocationIndex) {
    if (OriginGames.isGameboy(mon.gameOfOrigin)) {
      message += ` in the ${OriginGames.gameSettingName(mon.gameOfOrigin)} region` // todo: i18n
    } else if (mon.gameOfOrigin === OriginGame.ColosseumXd) {
      message += ' in a distant land' // todo: i18n
    }
  }
  if (mon.gameOfOrigin && mon.metLocationIndex) {
    if (isPalPark) {
      message += ` after traveling through time from the ${OriginGames.gameSettingName(mon.gameOfOrigin)} region` // todo: i18n
    } else if (
      (mon.format === 'OHPKM' && isColoStarter) ||
      (mon.format === 'PK2' && !OriginGames.isGameboy(mon.gameOfOrigin)) ||
      (mon.format === 'PK3' && mon.metLocationIndex === 254)
    ) {
      // suppress the normal met location, as it's already handled above
      message += ''
    } else {
      try {
        const location = getLocationStringOrOrigin(
          mon.gameOfOrigin,
          mon.metLocationIndex,
          mon.format,
          mon.nationalDex,
          mon.trainerID,
          mon.trainerName,
          Language.English
        )

        message += ` ${location}`
      } catch (e) {
        console.error('Error getting location string', {
          error: e,
          game: mon.gameOfOrigin,
          index: mon.metLocationIndex,
          format: mon.format,
        })
        message += ' at an unknown location'
      }
    }
  }

  if (mon.format === 'PK7' && OriginGames.isGameboy(mon.gameOfOrigin)) {
    message += ' in the good old days'
  }

  if (
    !['PK3', 'COLOPKM', 'XDPKM'].includes(mon.format) &&
    'isFatefulEncounter' in mon &&
    mon.isFatefulEncounter
  ) {
    message += ', where it met its Trainer in a fateful encounter'
  }

  message += '.'

  if (
    ['OHPKM', 'PK8', 'PA8', 'PB8', 'PK9', 'PA9'].includes(mon.format) &&
    OriginGames.isGameboy(mon.gameOfOrigin)
  ) {
    message += ' How nostalgic!'
  }

  if (
    !(
      isGcnMetAt254 ||
      isXdStarter ||
      (mon.format === 'PK3' && mon.gameOfOrigin === OriginGame.ColosseumXd)
    ) &&
    mon.metLevel
  ) {
    if (mon.format !== 'OHPKM' && !formatMatchesOrigin(mon.format, mon.gameOfOrigin)) {
      message += ' When first met,' // todo: i18n
    } else {
      message += ' At the time,' // todo: i18n
    }
    message += ` it was level ${mon.metLevel}.` // todo: i18n
  }

  return message
}
