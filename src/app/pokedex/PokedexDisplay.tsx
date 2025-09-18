import { Button, Card, Flex, Heading, Separator, Spinner, Text } from '@radix-ui/themes'
import { Pokemon } from 'pokemon-species-data'
import { useEffect, useState } from 'react'
import TypeIcon from 'src/components/TypeIcon'
import AttributeRow from 'src/pokemon/AttributeRow'
import PokemonIcon from '../../components/PokemonIcon'
import useMonSprite from '../../pokemon/useMonSprite'
import { usePokedex } from '../../state/pokedex'
import { Pokedex } from '../../types/pokedex'
import { Forme } from '../../types/types'
import BaseStatsChart from './BaseStatsChart'
import EvolutionFamily from './EvolutionFamily'
import PokedexSidebar from './PokedexSidebar'
import './style.css'
import { getFormeStatus, getPokedexSummary } from './util'

export default function PokedexDisplay() {
  const pokedexState = usePokedex()
  const [selectedSpecies, setSelectedSpecies] = useState<Pokemon>()
  const [selectedForme, setSelectedForme] = useState<Forme>()

  if (!pokedexState.loaded) {
    return <Spinner />
  }

  const pokedex = pokedexState.pokedex

  return (
    <Flex direction="column" height="100%" minWidth="940px">
      <div
        className="pokedex-header"
        style={{
          backgroundColor: 'var(--accent-9)',
          padding: '4px 8px',
          color: 'var(--accent-contrast)',
        }}
      >
        <Heading>{selectedForme?.formeName}</Heading>
      </div>
      <Flex style={{ height: 'calc(100% - 38px)' }}>
        <Flex className="pokedex-body" direction="column" width="calc(100% - 300px)">
          {selectedSpecies && selectedForme && (
            <PokedexDetails
              pokedex={pokedex}
              species={selectedSpecies}
              selectedForme={selectedForme}
              setSelectedForme={setSelectedForme}
            />
          )}
        </Flex>
        <PokedexSidebar
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
  species: Pokemon
  selectedForme: Forme
  setSelectedForme: (forme: Forme) => void
}

function PokedexDetails({
  pokedex,
  species,
  selectedForme,
  setSelectedForme,
}: PokedexDetailsProps) {
  const [imageError, setImageError] = useState(false)

  const selectedFormeStatus = getFormeStatus(
    pokedex,
    species.nationalDex,
    selectedForme.formeNumber ?? 0
  )
  const spritePath = useMonSprite({
    dexNum: species.nationalDex,
    formeNum: selectedForme.formeNumber,
    format: 'OHPKM',
    isShiny: selectedFormeStatus === 'ShinyCaught',
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
            {imageError ? (
              <PokemonIcon
                dexNumber={species.nationalDex}
                formeNumber={selectedForme.formeNumber}
                style={{ width: '90%', height: 0, paddingBottom: '90%' }}
                silhouette={!selectedFormeCaught}
              />
            ) : spritePath ? (
              <>
                <img
                  className="pokedex-image pokedex-image-shadow"
                  draggable={false}
                  src={spritePath}
                  onError={() => setImageError(true)}
                />
                <img
                  className="pokedex-image"
                  draggable={false}
                  src={spritePath}
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
          <Flex justify="center" gap="2" width="100%" wrap="wrap">
            {species.formes.map((forme) => (
              <Button
                key={forme.formeNumber}
                variant={forme.formeNumber === selectedForme.formeNumber ? 'solid' : 'soft'}
                onClick={() => setSelectedForme(forme)}
                size="4"
                style={{ minWidth: 0, padding: 0, aspectRatio: 1 }}
              >
                <PokemonIcon
                  dexNumber={species.nationalDex}
                  formeNumber={forme.formeNumber}
                  style={{ width: 48, height: 48 }}
                  silhouette={
                    !getFormeStatus(pokedex, species.nationalDex, forme.formeNumber)?.includes(
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
      <Flex direction="column" height="100%" maxHeight="600px" width="60%" gap="2" p="1">
        <Flex width="100%" height="50%">
          <div style={{ width: '50%', marginTop: 'auto', marginBottom: 'auto' }}>
            <BaseStatsChart forme={selectedForme} />
          </div>

          <Flex
            direction="column"
            align="end"
            gap="1"
            style={{ height: '100%', overflowY: 'auto', width: '50%', padding: 4 }}
          >
            <AttributeRow label="Level-Up">{species.levelUpType}</AttributeRow>
            <AttributeRow label="Height">{selectedForme.height}</AttributeRow>
            <AttributeRow label="Weight">{selectedForme.weight}</AttributeRow>
            <AttributeRow label="Type">
              {selectedForme.types?.map((type) => (
                <TypeIcon type={type} key={`${type}_type_icon`} />
              ))}
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
                formeNumber={selectedForme.formeNumber}
                pokedex={pokedex}
              />
            </div>{' '}
          </Card>
        </Flex>
      </Flex>
    </Flex>
  )
}
