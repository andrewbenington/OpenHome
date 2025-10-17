import {
  FormeMetadata,
  MetadataLookup,
  SpeciesLookup,
  SpeciesMetadata,
} from '@pkm-rs-resources/pkg'
import { Button, Card, Flex, Heading, Separator, Spinner, Text, TextField } from '@radix-ui/themes'
import { useEffect, useState } from 'react'
import TypeIcon from 'src/components/TypeIcon'
import { getPublicImageURL } from 'src/images/images'
import AttributeRow from 'src/pokemon/AttributeRow'
import { Type } from 'src/types/types'
import PokemonIcon from '../../components/PokemonIcon'
import useMonSprite from '../../pokemon/useMonSprite'
import { usePokedex } from '../../state/pokedex'
import { Pokedex } from '../../types/pokedex'
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

function PokedexDetails({
  pokedex,
  species,
  selectedForme,
  setSelectedForme,
  setSelectedSpecies,
}: PokedexDetailsProps) {
  const [imageError, setImageError] = useState(false)
  const [showShiny, setShowShiny] = useState(false)

  const selectedFormeStatus = getFormeStatus(pokedex, species.nationalDex, selectedForme.formeIndex)
  const spriteResult = useMonSprite({
    dexNum: species.nationalDex,
    formeNum: selectedForme.formeIndex,
    format: 'OHPKM',
    isShiny: selectedFormeStatus === 'ShinyCaught' && showShiny,
  })

  useEffect(() => {
    setImageError(false)
  }, [selectedForme])

  const selectedFormeCaught = selectedFormeStatus?.includes('Caught')

  return (
    <Flex direction="row" height="100%" align="center" width="100%">
      <Flex direction="column" align="center" justify="center" height="100%" width="40%" gap="2">
        <Flex direction="column" height="100%" width="100%" align="center" justify="center" gap="2">
          <div
            className="pokedex-image-frame"
            style={{ minWidth: 140, width: 240, aspectRatio: 1, position: 'relative' }}
          >
            {selectedFormeStatus === 'ShinyCaught' && (
              <button
                style={{
                  position: 'absolute',
                  width: 30,
                  height: 30,
                  right: 5,
                  top: 5,
                  zIndex: 20,
                  backgroundColor: showShiny ? 'var(--accent-9)' : 'var(--gray-9)',
                  borderRadius: 15,
                  boxShadow: 'none',
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
      <Flex direction="column" height="700px" maxHeight="100%" width="60%" gap="2" p="1">
        <Flex width="100%" height="50%">
          <div style={{ width: '50%' }}>
            <BaseStatsChart forme={selectedForme} />
          </div>

          <Flex
            direction="column"
            align="end"
            style={{ height: '100%', overflowY: 'auto', width: '50%', padding: 4, gap: 2 }}
          >
            <AttributeRow label="Level-Up">{species.levelUpType}</AttributeRow>
            <AttributeRow label="Type">
              <TypeIcon type={selectedForme.type1 as Type} />
              {selectedForme.type2 && <TypeIcon type={selectedForme.type2 as Type} />}
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
          <Card style={{ width: '100%', display: 'flex', flexDirection: 'row', gap: 8 }}>
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
                  setSelectedForme(MetadataLookup(nationalDex, formeIndex))
                }}
              />
            </div>{' '}
          </Card>
        </Flex>
      </Flex>
    </Flex>
  )
}
