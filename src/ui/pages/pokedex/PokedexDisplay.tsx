import AttributeRow from '@openhome-ui/components/AttributeRow'
import TypeIcon from '@openhome-ui/components/pokemon/TypeIcon'
import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import { getPublicImageURL } from '@openhome-ui/images/images'
import useMonSprite from '@openhome-ui/pokemon-details/useMonSprite'
import { usePokedex } from '@openhome-ui/state/pokedex'
import { Pokedex } from '@openhome-ui/util/pokedex'
import {
  allMetadataSources,
  currentMetadataReader,
  FormeMetadata,
  metadataReaderFor,
  MetadataSource,
  MetadataSources,
  MetadataSummaryLookup,
  OriginGames,
  SpeciesLookup,
  SpeciesMetadata,
} from '@pkm-rs/pkg'
import {
  Button,
  Card,
  Flex,
  Heading,
  Select,
  Separator,
  Spinner,
  Text,
  TextField,
} from '@radix-ui/themes'
import { useEffect, useState } from 'react'
import MoveCard from 'src/ui/components/pokemon/MoveCard'
import { includeClass } from 'src/ui/util/style'
import BaseStatsChart from './BaseStatsChart'
import EvolutionFamily from './EvolutionFamily'
import PokedexSidebar from './PokedexSidebar'
import './style.css'
import TooltipPokemonIcon from './TooltipPokemonIcon'
import { getFormeStatus, getPokedexSummary } from './util'

export default function PokedexDisplay() {
  const pokedexState = usePokedex()
  const [filter, setFilter] = useState('')
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesMetadata>()
  const [selectedForme, setSelectedForme] = useState<FormeMetadata>()

  if (!pokedexState.loaded) {
    return <Spinner />
  }

  const pokedex = pokedexState.pokedex
  const caughtCount = Object.values(pokedex.byDexNumber).filter((entry) =>
    Object.values(entry.formes).some((status) => status.endsWith('Caught'))
  ).length

  const seenCount = Object.values(pokedex.byDexNumber).length

  return (
    <Flex direction="column" height="100%" minWidth="940px">
      <div className="pokedex-header">
        <Heading>National Pokédex</Heading>
        <div style={{ flex: 1 }} />
        <Text>
          <b>Caught:</b> {caughtCount}
        </Text>
        <Text>
          <b>Seen:</b> {seenCount}
        </Text>
        <TextField.Root
          size="1"
          placeholder="Filter..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <Flex style={{ height: 'calc(100% - 34px)' }}>
        <Flex className="pokedex-body" direction="column" width="calc(100% - 300px)">
          {selectedSpecies && selectedForme && (
            <PokedexDetails
              pokedex={pokedex}
              species={selectedSpecies}
              selectedForme={selectedForme}
              setSelectedForme={setSelectedForme}
              setSelectedSpecies={setSelectedSpecies}
            />
          )}
        </Flex>
        <PokedexSidebar
          filter={filter}
          selectedSpecies={selectedSpecies}
          setSelectedSpecies={setSelectedSpecies}
          setSelectedForme={setSelectedForme}
          pokedex={pokedex}
        />
      </Flex>
    </Flex>
  )
}

type PokedexDetailsProps = {
  pokedex: Pokedex
  species: SpeciesMetadata
  selectedForme: FormeMetadata
  setSelectedForme: (forme?: FormeMetadata) => void
  setSelectedSpecies: (species?: SpeciesMetadata) => void
}

type PokedexView = 'main' | 'levelup' | 'games'
const MOST_CURRENT_SOURCE = '$CURRENT'

type MostCurrentSource = typeof MOST_CURRENT_SOURCE

function PokedexDetails({
  pokedex,
  species,
  selectedForme,
  setSelectedForme,
  setSelectedSpecies,
}: PokedexDetailsProps) {
  const [imageError, setImageError] = useState(false)
  const [showShiny, setShowShiny] = useState(false)
  const [currentView, setCurrentView] = useState<PokedexView>('main')
  const [metadataSource, setMetadataSource] = useState<MetadataSource | MostCurrentSource>(
    MOST_CURRENT_SOURCE
  )

  const selectedFormeStatus = getFormeStatus(pokedex, species.nationalDex, selectedForme.formeIndex)
  const spriteResult = useMonSprite({
    dexNum: species.nationalDex,
    formeNum: selectedForme.formeIndex,
    format: 'OHPKM',
    isShiny: selectedFormeStatus === 'ShinyCaught' && showShiny,
    extraFormIndex: undefined,
  })

  useEffect(() => {
    setImageError(false)
  }, [selectedForme])

  const selectedFormeCaught = selectedFormeStatus?.includes('Caught')

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
      >
        <Flex direction="column" height="100%" width="100%" align="center" justify="center" gap="2">
          <div className="pokedex-image-frame">
            {selectedFormeStatus === 'ShinyCaught' && (
              <button
                className="pokedex-shiny-toggle"
                style={{
                  backgroundColor: showShiny ? 'var(--accent-9)' : 'var(--gray-9)',
                }}
                onClick={() => setShowShiny(!showShiny)}
              >
                <img
                  alt="shiny icon"
                  style={{ width: 26, height: 26, marginLeft: -4, marginTop: -4 }}
                  draggable={false}
                  src={getPublicImageURL('icons/Shiny.png')}
                />
              </button>
            )}
            {imageError ? (
              <PokemonIcon
                dexNumber={species.nationalDex}
                formeNumber={selectedForme.formeIndex}
                style={{ width: '90%', height: 0, paddingBottom: '90%' }}
                silhouette={!selectedFormeCaught}
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
                    filter: !selectedFormeCaught ? 'saturate(0%)' : undefined,
                  }}
                />
              </>
            ) : (
              <Spinner style={{ margin: 'auto', height: 32 }} />
            )}
          </div>
          <div className="pokedex-caption">{selectedForme.formeName}</div>

          <Flex justify="center" gap="2" width="100%" wrap="wrap">
            {species.formes.map((forme) => (
              <Button
                className="pokedex-raised-button"
                key={forme.formeIndex}
                variant={forme.formeIndex === selectedForme.formeIndex ? 'solid' : 'soft'}
                onClick={() => setSelectedForme(forme)}
                size="4"
                style={{ minWidth: 0, padding: 0, aspectRatio: 1 }}
              >
                <TooltipPokemonIcon
                  dexNumber={species.nationalDex}
                  formeNumber={forme.formeIndex}
                  style={{ width: 48, height: 48 }}
                  silhouette={
                    !getFormeStatus(pokedex, species.nationalDex, forme.formeIndex)?.includes(
                      'Caught'
                    )
                  }
                />
              </Button>
            ))}
          </Flex>
        </Flex>
      </Flex>
      <Separator orientation="vertical" style={{ height: '100%' }} />
      <Flex direction="column" height="100%" maxHeight="100%" width="60%" overflow="auto">
        <Flex className="openhome-tab-row">
          <Button
            className={includeClass('openhome-tab')
              .with('openhome-tab-selected')
              .if(currentView === 'main')}
            onClick={() => setCurrentView('main')}
          >
            Summary
          </Button>
          <Button
            className={includeClass('openhome-tab')
              .with('openhome-tab-selected')
              .if(currentView === 'levelup')}
            onClick={() => setCurrentView('levelup')}
          >
            Levelup Learnset
          </Button>
          <Button
            className={includeClass('openhome-tab')
              .with('openhome-tab-selected')
              .if(currentView === 'games')}
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
                        selectedForme.nationalDex.index,
                        selectedForme.formeIndex
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
          {currentView === 'main' ? (
            <PokedexMain
              pokedex={pokedex}
              species={species}
              selectedForme={selectedForme}
              setSelectedForme={setSelectedForme}
              setSelectedSpecies={setSelectedSpecies}
              metadataSource={metadataSource}
            />
          ) : currentView === 'levelup' ? (
            <PokedexLearnset selectedForme={selectedForme} metadataSource={metadataSource} />
          ) : currentView === 'games' ? (
            <PokedexGames selectedForme={selectedForme} />
          ) : null}
        </div>
      </Flex>
    </Flex>
  )
}

type PokedexMetadataProps = {
  pokedex: Pokedex
  species: SpeciesMetadata
  selectedForme: FormeMetadata
  setSelectedForme: (forme?: FormeMetadata) => void
  setSelectedSpecies: (species?: SpeciesMetadata) => void
  metadataSource: MetadataSource | MostCurrentSource
}

function PokedexMain(props: PokedexMetadataProps) {
  const { pokedex, species, selectedForme, setSelectedForme, setSelectedSpecies, metadataSource } =
    props

  const reader =
    metadataSource === MOST_CURRENT_SOURCE
      ? currentMetadataReader(species.nationalDex, selectedForme.formeIndex)
      : metadataReaderFor(metadataSource, species.nationalDex, selectedForme.formeIndex)

  if (!reader) {
    const message =
      metadataSource !== MOST_CURRENT_SOURCE
        ? `No metadata available for this Pokémon in Pokémon ${MetadataSources.display(metadataSource)}.`
        : 'No metadata available for this Pokémon.'
    return (
      <Flex width="100%" height="100%" align="center" justify="center">
        <Text>{message}</Text>
      </Flex>
    )
  }

  const type1 = reader.type1()
  const type2 = reader.type2()
  const stats = reader.baseStats()

  return (
    <>
      <Flex width="100%" height="50%">
        <div id="base-stats-and-attributes" style={{ width: '50%' }}>
          <BaseStatsChart stats={stats} />
        </div>
        <Flex
          direction="column"
          align="end"
          style={{ height: '100%', overflowY: 'auto', width: '50%', padding: 4, gap: 2 }}
        >
          <AttributeRow label="Level-Up">{species.levelUpType}</AttributeRow>
          <AttributeRow label="Type">
            <TypeIcon type={type1} />
            {type2 && <TypeIcon type={type2} />}
          </AttributeRow>
          <AttributeRow label="Ability 1">{selectedForme.abilities[0].name}</AttributeRow>
          {selectedForme.abilities[1] !== selectedForme.abilities[0] && (
            <AttributeRow label="Ability 2">{selectedForme.abilities[1].name}</AttributeRow>
          )}

          {selectedForme.hiddenAbility && (
            <AttributeRow label="Ability H">
              <div>{selectedForme.hiddenAbility.name}</div>
            </AttributeRow>
          )}

          <AttributeRow label="Egg Groups">
            <div>{selectedForme.eggGroups.join(' • ')}</div>
          </AttributeRow>
        </Flex>
      </Flex>
      <Flex width="100%" height="50%">
        <Card className="flex-row" style={{ width: '100%', gap: 8 }}>
          <Text style={{ flex: 2 }}>{getPokedexSummary(species, selectedForme)}</Text>
          <Separator orientation="vertical" style={{ height: '100%' }} />
          <div style={{ height: '100%', flex: 1 }}>
            <Text weight="bold" size="2">
              Evolution Family
            </Text>
            <EvolutionFamily
              height="calc(100% - 16px)"
              nationalDex={species.nationalDex}
              formeNumber={selectedForme.formeIndex}
              pokedex={pokedex}
              onClick={(nationalDex, formeIndex) => {
                setSelectedSpecies(SpeciesLookup(nationalDex))
                setSelectedForme(MetadataSummaryLookup(nationalDex, formeIndex))
              }}
            />
          </div>{' '}
        </Card>
      </Flex>
    </>
  )
}

interface PokedexLearnsetProps {
  selectedForme: FormeMetadata
  metadataSource: MetadataSource | MostCurrentSource
}

function PokedexLearnset(props: PokedexLearnsetProps) {
  const { selectedForme, metadataSource } = props

  const levelUpLearnset = selectedForme.levelUpLearnset(
    metadataSource === MOST_CURRENT_SOURCE ? undefined : metadataSource
  )

  return (
    <Flex direction="column" overflow="hidden" p="1">
      <Flex direction="column" gap="1" mt="0.2rem" mx="1rem" overflow="auto">
        {levelUpLearnset ? (
          levelUpLearnset.map((learnsetMove) => (
            <Flex key={`${learnsetMove.move_id}-${learnsetMove.level}`} align="center" gap="2">
              <Text size="3" style={{ width: '7rem' }}>
                {learnsetMove.level ? `Level ${learnsetMove.level}: ` : 'On Evolution: '}
              </Text>
              <MoveCard move={learnsetMove.move_id} noPP />
            </Flex>
          ))
        ) : (
          <Flex width="100%" height="50%" align="center" justify="center">
            <Text>No level-up learnset data available for this forme.</Text>
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}

interface PokedexGamesProps {
  selectedForme: FormeMetadata
}

function PokedexGames(props: PokedexGamesProps) {
  const { selectedForme } = props

  return (
    <Flex gap="1" overflowY="auto" wrap="wrap" justify="center">
      {MetadataSources.supportedGameOrigins(
        selectedForme.nationalDex.index,
        selectedForme.formeIndex
      ).map((origin) => (
        <Card
          className="compatible-game-card"
          key={origin}
          style={{
            backgroundColor: OriginGames.color(origin),
            '--card-background-color': OriginGames.color(origin),
            padding: OriginGames.isGameboy(origin) ? '0' : '0.25rem',
          }}
        >
          <img draggable={false} src={OriginGames.logoPath(origin)} />
        </Card>
      ))}
    </Flex>
  )
}
