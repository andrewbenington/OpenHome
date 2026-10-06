import { hasGenderDifference } from '@openhome-core/pkm/util/index'
import { FormEntry, PokedexFlag } from '@openhome-core/tauri/spectaCommands'
import { Option } from '@openhome-core/util/functional'
import { $O } from '@openhome-core/util/option'
import { filterUndefined } from '@openhome-core/util/sort'
import Badge, { BadgePropsNoBackground } from '@openhome-ui/components/badge/Badge'
import OhoFlex from '@openhome-ui/components/OhoFlex'
import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import { getPublicImageURL } from '@openhome-ui/images/images'
import useMonSprite from '@openhome-ui/pokemon/useMonSprite'
import { cssClass } from '@openhome-ui/util/style'
import {
  canBeAlpha,
  canBeNsPokemon,
  canBeTitan,
  extraFormMetadata,
  ExtraFormMetadata,
  extraFormsByNationalDex,
  FormMetadata,
  Gender,
  hasGigantamaxForm,
  MetadataSummaryLookup,
  NationalDex,
  SpeciesLookup,
  totemFormAcquirable,
} from '@pkm-rs/pkg'
import { Button, Card, Flex, Inset, Separator, Spinner, Text } from '@radix-ui/themes'
import { ReactNode, useEffect, useState } from 'react'
import EvolutionFamily from './EvolutionFamily'
import './pokedex.css'
import './PokedexLeftColumn.css'
import { PokedexDetailsProps } from './PokedexPage'
import TooltipPokemonIcon from './TooltipPokemonIcon'
import { getFormPokedexData, isExtraFormMetadata } from './util'

// this component could use a better name
export default function PokedexLeftColumn(props: PokedexDetailsProps) {
  const [imageError, setImageError] = useState(false)
  const [showShiny, setShowShiny] = useState(false)
  const [showFemale, setShowFemale] = useState(false)

  const { pokedex, speciesMetadata, formMetadata } = props

  const selectedFormEntry = getFormPokedexData(
    pokedex,
    speciesMetadata.nationalDex,
    formMetadata.formIndex
  )

  const isCaught = selectedFormEntry?.level?.includes('Caught')
  const isFemale =
    showFemale &&
    hasGenderDifference(speciesMetadata.nationalDex) &&
    selectedFormEntry?.flags.includes('Female')

  const spriteResult = useMonSprite({
    nationalDex: speciesMetadata.nationalDex,
    formIndex: formMetadata.formIndex,
    format: 'OHPKM',
    isShiny: selectedFormEntry?.level === 'ShinyCaught' && showShiny,
    extraFormIndex: isExtraFormMetadata(formMetadata) ? formMetadata.extraFormIndex : undefined,
    isFemale,
  })

  const variantBadges = VARIANTS.filter((variant) =>
    variant.isPossibleFor(formMetadata.nationalDex, formMetadata.formIndex)
  )
    .filter(filterUndefined)
    .map((variant) => variant.render(formMetadata, selectedFormEntry))

  useEffect(() => {
    setImageError(false)
  }, [formMetadata])

  function formIsSelected(form: FormMetadata) {
    return form.formIndex === formMetadata.formIndex && !isExtraFormMetadata(formMetadata)
  }

  function formDexEntry(form: FormMetadata) {
    return getFormPokedexData(pokedex, speciesMetadata.nationalDex, form.formIndex)
  }

  function formIsCaught(form: FormMetadata) {
    return $O(formDexEntry(form)?.level)
      .map((level) => level !== 'Seen')
      .orElse(false)
  }

  return (
    <OhoFlex.ColCentered
      className="pokedex-left-column"
      height="100%"
      width="40%"
      maxWidth="30rem"
      pt="4"
    >
      <OhoFlex.ColCentered id="mon-and-forms" width="100%" gap="2" mb="auto">
        <Card className="pokedex-image-card" mb="2">
          <Flex direction="column" height="100%" align="center" justify="start" gap="2">
            <div className="pokedex-image-frame">
              {selectedFormEntry?.level === 'ShinyCaught' && (
                <button
                  className={cssClass('pokedex-toggle pokedex-shiny-toggle')
                    .with('pokedex-toggle-on')
                    .if(showShiny)
                    .build()}
                  onClick={() => setShowShiny(!showShiny)}
                >
                  <img
                    alt="shiny icon"
                    style={{ width: '100%', height: '100%' }}
                    draggable={false}
                    src={getPublicImageURL('icons/Shiny.png')}
                  />
                </button>
              )}
              {hasGenderDifference(speciesMetadata.nationalDex) && (
                <button
                  className={cssClass('pokedex-toggle pokedex-gender-toggle')
                    .with('pokedex-toggle-on')
                    .if(showFemale)
                    .build()}
                  onClick={() => setShowFemale(!showFemale)}
                >
                  <p>♀</p>
                </button>
              )}
              {imageError ? (
                <PokemonIcon
                  nationalDex={speciesMetadata.nationalDex}
                  formIndex={formMetadata.formIndex}
                  gender={isFemale ? Gender.Female : undefined}
                  style={{ width: '90%', height: 0, paddingBottom: '90%' }}
                  silhouette={!isCaught}
                />
              ) : spriteResult.path ? (
                <>
                  <img
                    className="pokedex-image pokedex-image-shadow"
                    draggable={false}
                    src={spriteResult.path}
                    onError={() => setImageError(true)}
                  />
                  <img
                    className={cssClass('pokedex-image').with('desaturated').if(!isCaught).build()}
                    draggable={false}
                    src={spriteResult.path}
                    onError={() => setImageError(true)}
                  />
                </>
              ) : (
                <Spinner style={{ margin: 'auto', height: '2rem' }} />
              )}
            </div>
            <div className="pokedex-caption">{formMetadata.formeName}</div>
            <OhoFlex.RowCentered align="center" p="2" minHeight="3.25rem">
              {formMetadata.isBattleOnly ? null : variantBadges}
            </OhoFlex.RowCentered>
          </Flex>
        </Card>
        <h3>Standard Forms</h3>
        <Flex justify="center" gap="2" width="100%" wrap="wrap">
          {speciesMetadata.forms.map((form) => (
            <Button
              className="pokedex-raised-button"
              key={`${speciesMetadata.nationalDex}~${form.formIndex}`} // must include both or it won't update when the species changes
              variant={formIsSelected(form) ? 'solid' : 'soft'}
              onClick={() => props.setSelectedForm(form)}
              size="4"
              style={{ minWidth: 0, padding: 0, aspectRatio: 1 }}
            >
              <TooltipPokemonIcon
                nationalDex={speciesMetadata.nationalDex}
                formIndex={form.formIndex}
                style={{ width: '3rem', height: '3rem' }}
                silhouette={!formIsCaught(form)}
              />
            </Button>
          ))}
        </Flex>
        {extraFormsByNationalDex(speciesMetadata.nationalDex).length > 0 && <h3>Extra Forms</h3>}
        <Flex justify="center" gap="2" width="100%" wrap="wrap">
          {extraFormsByNationalDex(speciesMetadata.nationalDex).map((form) => (
            <Button
              className="pokedex-raised-button"
              key={form}
              variant={
                isExtraFormMetadata(formMetadata) && formMetadata.extraFormIndex === form
                  ? 'solid'
                  : 'soft'
              }
              onClick={() => props.setSelectedForm(extraFormMetadata(form))}
              size="4"
              style={{ minWidth: 0, padding: 0, aspectRatio: 1 }}
            >
              <TooltipPokemonIcon
                nationalDex={speciesMetadata.nationalDex}
                formIndex={0}
                extraFormIndex={form}
                style={{ width: '3rem', height: '3rem' }}
                silhouette={
                  !getFormPokedexData(pokedex, speciesMetadata.nationalDex, 0)?.level.includes(
                    'Caught'
                  )
                }
              />
            </Button>
          ))}
        </Flex>
      </OhoFlex.ColCentered>
      <Card className="evo-family-card">
        <Text weight="bold" size="2">
          Evolution Family
        </Text>
        <Inset side="x" p="0" mx="-2" mt="1">
          <Separator />
        </Inset>
        <div style={{ padding: '1rem 0' }}>
          <EvolutionFamily
            key={speciesMetadata.nationalDex}
            height="fit-content"
            nationalDex={speciesMetadata.nationalDex}
            formNumber={formMetadata.formIndex}
            pokedex={pokedex}
            onClick={(nationalDex, formIndex) => {
              props.setSelectedSpecies(SpeciesLookup(nationalDex))
              props.setSelectedForm(MetadataSummaryLookup(nationalDex, formIndex))
            }}
          />
        </div>
      </Card>
    </OhoFlex.ColCentered>
  )
}

type IsPossibleFor = (nationalDex: NationalDex, formIndex: number) => boolean
type IsRegistered = (formDexEntry: FormEntry) => boolean
type BadgeType = (props: BadgePropsNoBackground) => ReactNode

class PokedexVariant<B extends BadgeType = BadgeType> {
  description: string
  isPossibleFor: IsPossibleFor
  isRegistered: IsRegistered
  badge: BadgeType

  private constructor(
    description: string,
    isPossibleFor: IsPossibleFor,
    isRegistered: IsRegistered,
    badge: B
  ) {
    this.description = description
    this.isPossibleFor = isPossibleFor
    this.isRegistered = isRegistered
    this.badge = badge
  }

  static is<B extends BadgeType>(
    description: string,
    isPossibleFor: IsPossibleFor,
    isRegistered: IsRegistered,
    badge: B
  ) {
    return new PokedexVariant<B>(description, isPossibleFor, isRegistered, badge)
  }

  static flag<B extends BadgeType>(
    description: string,
    isPossibleFor: IsPossibleFor,
    flag: PokedexFlag,
    badge: B
  ) {
    const isRegistered: IsRegistered = (data) => data.flags.includes(flag)
    return new PokedexVariant<B>(description, isPossibleFor, isRegistered, badge)
  }

  render(form: FormMetadata | ExtraFormMetadata, formDexEntry: Option<FormEntry>): ReactNode {
    const BadgeType = this.badge
    return (
      <BadgeType
        inactive={!formDexEntry || !this.isRegistered(formDexEntry)}
        showIf={this.isPossibleFor(form.nationalDex, form.formIndex)}
        size="2"
        tooltip={this.description}
      />
    )
  }
}

const VARIANTS: PokedexVariant[] = [
  PokedexVariant.flag('Alpha', canBeAlpha, 'Alpha', Badge.Alpha),
  PokedexVariant.flag('Gigantamax Factor', hasGigantamaxForm, 'Gigantamax', Badge.Gigantamax),
  PokedexVariant.flag('Totem Obtained', totemFormAcquirable, 'Totem', Badge.Totem),
  PokedexVariant.flag('Titan Obtained', canBeTitan, 'Titan', Badge.Titan),
  PokedexVariant.flag("N's Pokémon", canBeNsPokemon, 'NsPokemon', Badge.NsPokemon),
]
