import { hasGenderDifference } from '@openhome-core/pkm/util/index'
import { FormEntry } from '@openhome-core/tauri/spectaCommands'
import { Option } from '@openhome-core/util/functional'
import { filterUndefined } from '@openhome-core/util/sort'
import Badge, { BadgePropsNoBackground } from '@openhome-ui/components/badge/Badge'
import OhoFlex from '@openhome-ui/components/OhoFlex'
import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import { getPublicImageURL } from '@openhome-ui/images/images'
import useMonSprite from '@openhome-ui/pokemon/useMonSprite'
import { usePokedex } from '@openhome-ui/state/pokedex'
import { Pokedex } from '@openhome-ui/util/pokedex'
import { cssClass } from '@openhome-ui/util/style'
import {
  allMetadataSources,
  canBeAlpha,
  extraFormMetadata,
  ExtraFormMetadata,
  extraFormsByNationalDex,
  FormMetadata,
  Gender,
  hasGigantamaxForm,
  MetadataSource,
  MetadataSources,
  MetadataSummaryLookup,
  NationalDex,
  SpeciesLookup,
  SpeciesMetadata,
} from '@pkm-rs/pkg'
import {
  Button,
  Card,
  Flex,
  Heading,
  Inset,
  Select,
  Separator,
  Spinner,
  Text,
  TextField,
} from '@radix-ui/themes'
import { ReactNode, useEffect, useState } from 'react'
import EvolutionFamily from './EvolutionFamily'
import './pokedex.css'
import { PokedexGames } from './PokedexGames'
import PokedexLearnset from './PokedexLearnset'
import PokedexSidebar from './PokedexSidebar'
import PokedexSummary from './PokedexSummary'
import TooltipPokemonIcon from './TooltipPokemonIcon'
import { getFormPokedexData, isExtraFormMetadata } from './util'

type PokedexView = 'summary' | 'levelup' | 'games'

export const MOST_CURRENT_SOURCE = '$CURRENT'
export type MostCurrentSource = typeof MOST_CURRENT_SOURCE

export default function PokedexPage() {
  const pokedexState = usePokedex()
  const [filter, setFilter] = useState('')
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesMetadata>()
  const [selectedForm, setSelectedForm] = useState<FormMetadata | ExtraFormMetadata>()

  if (!pokedexState.loaded) {
    return <Spinner />
  }

  const pokedex = pokedexState.pokedex
  const caughtCount = Object.values(pokedex.byDexNumber)
    .filter(filterUndefined)
    .filter((entry) =>
      Object.values(entry.forms).some((status) => status?.level.endsWith('Caught'))
    ).length

  const seenCount = new Set(
    Object.keys(pokedex.byDexNumber).filter((v) => parseInt(v) <= NationalDex.Pecharunt)
  ).size

  return (
    <div className="pokedex-page">
      <div className="pokedex-header">
        <h1 className="pokedex-header-title">National Pokédex</h1>
        <div style={{ flex: 1 }} />
        <Text>
          <b>Caught:</b> {caughtCount}
        </Text>
        <Text>
          <b>Seen:</b> {seenCount}
        </Text>
        <TextField.Root
          className="pokedex-filter-field"
          placeholder="Filter..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <Flex style={{ height: 'calc(100% - var(--top-bar-height))' }}>
        <Flex className="pokedex-body" direction="column" width="calc(100% - var(--sidebar-width))">
          {selectedSpecies && selectedForm && (
            <PokedexDetails
              pokedex={pokedex}
              species={selectedSpecies}
              selectedForm={selectedForm}
              setSelectedForm={setSelectedForm}
              setSelectedSpecies={setSelectedSpecies}
            />
          )}
        </Flex>
        <PokedexSidebar
          filter={filter}
          selectedSpecies={selectedSpecies}
          setSelectedSpecies={setSelectedSpecies}
          setSelectedForm={setSelectedForm}
          pokedex={pokedex}
        />
      </Flex>
    </div>
  )
}

type PokedexDetailsProps = {
  pokedex: Pokedex
  species: SpeciesMetadata
  selectedForm: FormMetadata | ExtraFormMetadata
  setSelectedForm: (form?: FormMetadata | ExtraFormMetadata) => void
  setSelectedSpecies: (species?: SpeciesMetadata) => void
}

function PokedexDetails({
  pokedex,
  species,
  selectedForm,
  setSelectedForm,
  setSelectedSpecies,
}: PokedexDetailsProps) {
  const [imageError, setImageError] = useState(false)
  const [showShiny, setShowShiny] = useState(false)
  const [showFemale, setShowFemale] = useState(false)
  const [currentView, setCurrentView] = useState<PokedexView>('summary')
  const [metadataSource, setMetadataSource] = useState<MetadataSource | MostCurrentSource>(
    MOST_CURRENT_SOURCE
  )

  const selectedFormEntry = getFormPokedexData(pokedex, species.nationalDex, selectedForm.formIndex)
  const isCaught = selectedFormEntry?.level?.includes('Caught')

  const isFemale =
    showFemale &&
    hasGenderDifference(species.nationalDex) &&
    selectedFormEntry?.flags.includes('Female')

  const spriteResult = useMonSprite({
    nationalDex: species.nationalDex,
    formIndex: selectedForm.formIndex,
    format: 'OHPKM',
    isShiny: selectedFormEntry?.level === 'ShinyCaught' && showShiny,
    extraFormIndex: isExtraFormMetadata(selectedForm) ? selectedForm.extraFormIndex : undefined,
    isFemale,
  })

  useEffect(() => {
    setImageError(false)
  }, [selectedForm])

  const variantBadges = VARIANTS.filter((variant) =>
    variant.isPossibleFor(selectedForm.nationalDex, selectedForm.formIndex)
  )
    .filter(filterUndefined)
    .map((variant) => variant.render(selectedForm, selectedFormEntry))

  return (
    <Flex direction="row" height="100%" align="center" width="100%" overflow="hidden">
      <Flex
        direction="column"
        align="center"
        justify="center"
        height="100%"
        width="40%"
        maxWidth="30rem"
        gap="2"
        pt="4"
      >
        <Flex direction="column" width="100%" align="center" justify="start" gap="2" mb="auto">
          <Card
            style={{
              padding: '1rem',
              width: 'fit-content',
              maxWidth: '80%',
              borderRadius: 'var(--border-radius-lg)',
            }}
            mb="2"
          >
            <Flex direction="column" height="100%" align="center" justify="start" gap="2">
              <div className="pokedex-image-frame">
                {selectedFormEntry?.level === 'ShinyCaught' && (
                  <button
                    className="pokedex-toggle pokedex-shiny-toggle"
                    style={{
                      backgroundColor: showShiny ? 'var(--accent-9)' : 'var(--gray-9)',
                    }}
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
                {hasGenderDifference(species.nationalDex) && (
                  <button
                    className="pokedex-toggle pokedex-gender-toggle"
                    style={{
                      backgroundColor: showFemale ? 'var(--accent-9)' : 'var(--gray-9)',
                    }}
                    onClick={() => setShowFemale(!showFemale)}
                  >
                    <p>♀</p>
                  </button>
                )}
                {imageError ? (
                  <PokemonIcon
                    nationalDex={species.nationalDex}
                    formIndex={selectedForm.formIndex}
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
                      className="pokedex-image"
                      draggable={false}
                      src={spriteResult.path}
                      onError={() => setImageError(true)}
                      style={{
                        filter: !isCaught ? 'saturate(0%)' : undefined,
                      }}
                    />
                  </>
                ) : (
                  <Spinner style={{ margin: 'auto', height: '2rem' }} />
                )}
              </div>
              <div className="pokedex-caption">{selectedForm.formeName}</div>
              <OhoFlex.RowCentered align="center" p="2" minHeight="3rem">
                {variantBadges}
              </OhoFlex.RowCentered>
            </Flex>
          </Card>
          <h3>Standard Forms</h3>
          <Flex justify="center" gap="2" width="100%" wrap="wrap">
            {species.forms.map((form) => (
              <Button
                className="pokedex-raised-button"
                key={`${species.nationalDex}~${form.formIndex}`} // must include both or it won't update when the species changes
                variant={
                  form.formIndex === selectedForm.formIndex && !isExtraFormMetadata(selectedForm)
                    ? 'solid'
                    : 'soft'
                }
                onClick={() => setSelectedForm(form)}
                size="4"
                style={{ minWidth: 0, padding: 0, aspectRatio: 1 }}
              >
                <TooltipPokemonIcon
                  nationalDex={species.nationalDex}
                  formIndex={form.formIndex}
                  style={{ width: '3rem', height: '3rem' }}
                  silhouette={
                    !getFormPokedexData(
                      pokedex,
                      species.nationalDex,
                      form.formIndex
                    )?.level.includes('Caught')
                  }
                />
              </Button>
            ))}
          </Flex>
          {extraFormsByNationalDex(species.nationalDex).length > 0 && <h3>Extra Forms</h3>}
          <Flex justify="center" gap="2" width="100%" wrap="wrap">
            {extraFormsByNationalDex(species.nationalDex).map((form) => (
              <Button
                className="pokedex-raised-button"
                key={form}
                variant={
                  isExtraFormMetadata(selectedForm) && selectedForm.extraFormIndex === form
                    ? 'solid'
                    : 'soft'
                }
                onClick={() => setSelectedForm(extraFormMetadata(form))}
                size="4"
                style={{ minWidth: 0, padding: 0, aspectRatio: 1 }}
              >
                <TooltipPokemonIcon
                  nationalDex={species.nationalDex}
                  formIndex={0}
                  extraFormIndex={form}
                  style={{ width: '3rem', height: '3rem' }}
                  silhouette={
                    !getFormPokedexData(pokedex, species.nationalDex, 0)?.level.includes('Caught')
                  }
                />
              </Button>
            ))}
          </Flex>
        </Flex>
        <Card mb="4" style={{ height: 'fit-content', padding: '0.5rem 0.75rem' }}>
          <Text weight="bold" size="2">
            Evolution Family
          </Text>
          <Inset side="x" p="0" mx="-2" mt="1">
            <Separator />
          </Inset>
          <div style={{ padding: '1rem 0' }}>
            <EvolutionFamily
              height="fit-content"
              nationalDex={species.nationalDex}
              formNumber={selectedForm.formIndex}
              pokedex={pokedex}
              onClick={(nationalDex, formIndex) => {
                setSelectedSpecies(SpeciesLookup(nationalDex))
                setSelectedForm(MetadataSummaryLookup(nationalDex, formIndex))
              }}
            />
          </div>
        </Card>
      </Flex>
      <Separator orientation="vertical" style={{ height: '100%' }} />
      <Flex direction="column" height="100%" maxHeight="100%" width="60%" overflow="auto">
        <Flex className="pokedex-tab-row">
          <Button
            className={cssClass('pokedex-tab')
              .with('pokedex-tab-selected')
              .if(currentView === 'summary')
              .build()}
            onClick={() => setCurrentView('summary')}
          >
            Summary
          </Button>
          <Button
            className={cssClass('pokedex-tab')
              .with('pokedex-tab-selected')
              .if(currentView === 'levelup')
              .build()}
            onClick={() => setCurrentView('levelup')}
          >
            Levelup Learnset
          </Button>
          <Button
            className={cssClass('pokedex-tab')
              .with('pokedex-tab-selected')
              .if(currentView === 'games')
              .build()}
            onClick={() => setCurrentView('games')}
          >
            Games
          </Button>
          <div style={{ flex: 1 }} />
          {currentView !== 'games' && (
            <Select.Root
              value={metadataSource.toString()}
              onValueChange={(value) =>
                setMetadataSource(
                  value === MOST_CURRENT_SOURCE
                    ? MOST_CURRENT_SOURCE
                    : (parseInt(value) as MetadataSource)
                )
              }
            >
              <Select.Trigger variant="classic" className="pokedex-view-select" />
              <Select.Content position="popper">
                {allMetadataSources().map((source) => (
                  <Select.Item
                    key={source}
                    value={source.toString()}
                    disabled={
                      !MetadataSources.supportsForm(
                        source,
                        selectedForm.nationalDex,
                        selectedForm.formIndex
                      )
                    }
                  >
                    {MetadataSources.display(source)}
                  </Select.Item>
                ))}
                <Select.Item key={MOST_CURRENT_SOURCE} value={MOST_CURRENT_SOURCE}>
                  Current Data
                </Select.Item>
              </Select.Content>
            </Select.Root>
          )}
        </Flex>
        <div style={{ height: '100%', overflow: 'auto', paddingTop: '2.5rem' }}>
          {currentView === 'summary' ? (
            <PokedexSummary
              pokedex={pokedex}
              species={species}
              selectedForm={selectedForm}
              setSelectedForm={setSelectedForm}
              setSelectedSpecies={setSelectedSpecies}
              metadataSource={metadataSource}
            />
          ) : currentView === 'levelup' ? (
            isExtraFormMetadata(selectedForm) ? (
              <Heading size="2" m="3" align="center">
                Extra form learnsets are not yet supported
              </Heading>
            ) : (
              <PokedexLearnset selectedForm={selectedForm} metadataSource={metadataSource} />
            )
          ) : currentView === 'games' ? (
            <PokedexGames selectedForm={selectedForm} />
          ) : null}
        </div>
      </Flex>
    </Flex>
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

  render(form: FormMetadata | ExtraFormMetadata, formDexEntry: Option<FormEntry>): ReactNode {
    const BadgeType = this.badge
    return (
      <BadgeType
        activeIf={formDexEntry && this.isRegistered(formDexEntry)}
        showIf={this.isPossibleFor(form.nationalDex, form.formIndex)}
        size="2"
        tooltip={this.description}
      />
    )
  }
}

const VARIANTS: PokedexVariant[] = [
  PokedexVariant.is(
    'Gigantamax Factor',
    hasGigantamaxForm,
    (data) => data.flags.includes('Gigantamax'),
    Badge.Gigantamax
  ),
  PokedexVariant.is('Alpha', canBeAlpha, (data) => data.flags.includes('Alpha'), Badge.Alpha),
]
