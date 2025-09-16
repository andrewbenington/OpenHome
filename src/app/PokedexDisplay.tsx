import { Button, Card, Flex, Heading, Separator, Spinner } from '@radix-ui/themes'
import { Pokemon, PokemonData } from 'pokemon-species-data'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeftIcon, ArrowLeftRightIcon, ArrowRightIcon } from '../components/Icons'
import PokemonIcon from '../components/PokemonIcon'
import useMonSprite from '../pokemon/useMonSprite'
import { usePokedex } from '../state/pokedex'
import { getBaseMon } from '../types/pkm/util'
import { Pokedex, PokedexStatus } from '../types/pokedex'
import { Forme } from '../types/types'

export default function PokedexDisplay() {
  const pokedexState = usePokedex()
  const [selectedSpecies, setSelectedSpecies] = useState<Pokemon>()
  const [selectedForme, setSelectedForme] = useState<Forme>()

  if (!pokedexState.loaded) {
    return <Spinner />
  }

  const pokedex = pokedexState.pokedex

  return (
    <Flex style={{ height: '100%' }}>
      <Flex direction="column" width="calc(100% - 300px)">
        <div style={{ backgroundColor: 'var(--gray-6)', padding: '4px 8px' }}>
          <Heading>{selectedForme?.formeName}</Heading>
        </div>
        <div style={{ width: '100%', height: '100%' }}>
          {selectedSpecies && selectedForme && (
            <PokedexDetails
              pokedex={pokedex}
              species={selectedSpecies}
              selectedForme={selectedForme}
              setSelectedForme={setSelectedForme}
            />
          )}
        </div>
      </Flex>
      <Flex
        className="side-tab-list"
        overflowX="hidden"
        gap="2"
        overflowY="auto"
        height="100%"
        style={{ width: 300 }}
      >
        {Object.entries(PokemonData).map(([_, species]) => (
          <PokedexTab
            key={species.nationalDex}
            pokedex={pokedex}
            species={species}
            onClick={() => {
              setSelectedSpecies(species)
              const [caughtFormeIndex] = getHighestFormeStatus(pokedex, species)

              setSelectedForme(species.formes[caughtFormeIndex])
            }}
            selected={selectedSpecies?.nationalDex === species.nationalDex}
          />
        ))}
        <div />
      </Flex>
    </Flex>
  )
}

type PokedexTabProps = {
  pokedex: Pokedex
  species: Pokemon
  onClick: () => void
  selected: boolean
}

function PokedexTab({ pokedex, species, onClick, selected }: PokedexTabProps) {
  const [formeIndex, maxStatus] = useMemo(
    () => getHighestFormeStatus(pokedex, species),
    [pokedex, species]
  )

  const isCaught = maxStatus && StatusIndices[maxStatus] >= StatusIndices.Caught

  return (
    <Button
      key={species.nationalDex}
      onClick={onClick}
      style={{
        textAlign: 'start',
        backgroundColor: selected ? '#00cccc' : 'gray',
        display: 'flex',
        minHeight: 48,
        alignItems: 'center',
        fontWeight: isCaught ? 'bold' : 'normal',
      }}
      disabled={!maxStatus}
      radius="full"
    >
      {species.nationalDex}. {species.name}
      {maxStatus && (
        <PokemonIcon
          dexNumber={species.nationalDex}
          formeNumber={formeIndex}
          greyedOut={StatusIndices[maxStatus] < StatusIndices.Caught}
          style={{ width: 32, height: 32, marginLeft: 'auto' }}
        />
      )}
    </Button>
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
    <Flex justify="center" height="100%">
      <Flex direction="column" height="100%" align="center" width="100%" gap="2">
        <Card style={{ height: '40%', aspectRatio: 1 }}>
          {imageError ? (
            <PokemonIcon
              dexNumber={species.nationalDex}
              formeNumber={selectedForme.formeNumber}
              style={{ width: '90%', height: 0, paddingBottom: '90%' }}
              greyedOut={!selectedFormeCaught}
            />
          ) : spritePath ? (
            <img
              draggable={false}
              src={spritePath}
              onError={() => setImageError(true)}
              style={{
                filter: !selectedFormeCaught ? 'saturate(0%)' : undefined,
                height: 'calc(100% - 16px)',
                padding: 8,
              }}
            />
          ) : (
            <Spinner style={{ margin: 'auto', height: 32 }} />
          )}
        </Card>
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
                greyedOut={
                  !getFormeStatus(pokedex, species.nationalDex, forme.formeNumber)?.includes(
                    'Caught'
                  )
                }
              />
            </Button>
          ))}
        </Flex>
        <Separator style={{ width: '100%' }} />
        <EvolutionFamily
          nationalDex={species.nationalDex}
          formeNumber={selectedForme.formeNumber}
          pokedex={pokedex}
        />
      </Flex>
    </Flex>
  )
}

type EvolutionLineProps = {
  nationalDex: number
  formeNumber: number
  pokedex: Pokedex
}

function EvolutionFamily({ nationalDex, formeNumber, pokedex }: EvolutionLineProps) {
  const baseMon = getBaseMon(nationalDex, formeNumber)
  const baseMonFormes = PokemonData[baseMon.dexNumber].formes

  return (
    <Flex direction="column" gap="2" align="center">
      {baseMonFormes
        .filter((forme) => forme.evos.length > 0)
        .map(({ formeNumber }) => (
          <EvolutionLine
            nationalDex={baseMon.dexNumber}
            formeNumber={formeNumber}
            key={formeNumber}
            pokedex={pokedex}
          />
        ))}
    </Flex>
  )
}

function EvolutionLine({ nationalDex, formeNumber, pokedex }: EvolutionLineProps) {
  const evolutions = PokemonData[nationalDex].formes[formeNumber].evos

  if (evolutions.length === 8) {
    return (
      <Flex align="center" gap="2">
        <Flex direction="column" gap="2" align="center">
          {evolutions.slice(0, 4).map((evo, i) => (
            <Flex key={`${evo.dexNumber}-${evo.formeNumber}`} align="center" gap="2">
              <EvolutionLine
                nationalDex={evo.dexNumber}
                formeNumber={evo.formeNumber}
                pokedex={pokedex}
              />
              <ArrowLeftIcon
                style={{
                  rotate: `${(1.5 - i) * 28}deg`,
                  marginTop: (1.5 - i) * 15,
                  marginBottom: (1.5 - i) * -15,
                }}
              />
            </Flex>
          ))}
        </Flex>
        <PokemonIcon
          dexNumber={nationalDex}
          formeNumber={formeNumber}
          style={{ width: 48, height: 48 }}
          greyedOut={!getFormeStatus(pokedex, nationalDex, formeNumber)?.includes('Caught')}
        />
        <Flex direction="column" gap="2">
          {evolutions.slice(4).map((evo, i) => (
            <Flex key={`${evo.dexNumber}-${evo.formeNumber}`} align="center" gap="2">
              <ArrowRightIcon
                style={{
                  rotate: `${(1.5 - i) * -36}deg`,
                  marginTop: (1.5 - i) * 15,
                  marginBottom: (1.5 - i) * -15,
                }}
              />
              <EvolutionLine
                nationalDex={evo.dexNumber}
                formeNumber={evo.formeNumber}
                pokedex={pokedex}
              />
            </Flex>
          ))}
        </Flex>
      </Flex>
    )
  }

  const megaFormes = PokemonData[nationalDex].formes.filter((f) => f.isMega)

  return (
    <Flex align="center" gap="2">
      <PokemonIcon
        dexNumber={nationalDex}
        formeNumber={formeNumber}
        style={{ width: 48, height: 48 }}
        greyedOut={!getFormeStatus(pokedex, nationalDex, formeNumber)?.includes('Caught')}
      />
      {!PokemonData[nationalDex].formes[formeNumber].regional && megaFormes.length > 0 && (
        <Flex direction="column" gap="2">
          {megaFormes.map((mega, i) => (
            <Flex key={`${nationalDex}-${mega.formeNumber}`} align="center" gap="2">
              <ArrowLeftRightIcon
                style={{
                  rotate: `${((megaFormes.length - 1) / 2 - i) * -36}deg`,
                  marginTop: ((megaFormes.length - 1) / 2 - i) * 15,
                  marginBottom: ((megaFormes.length - 1) / 2 - i) * -15,
                }}
              />
              <PokemonIcon
                dexNumber={nationalDex}
                formeNumber={mega.formeNumber}
                style={{ width: 48, height: 48 }}
                greyedOut={
                  !getFormeStatus(pokedex, nationalDex, mega.formeNumber)?.includes('Caught')
                }
              />
            </Flex>
          ))}
        </Flex>
      )}
      <Flex direction="column" gap="2">
        {evolutions.map((evo, i) => (
          <Flex key={`${evo.dexNumber}-${evo.formeNumber}`} align="center" gap="2">
            <ArrowRightIcon
              style={{
                rotate: `${((evolutions.length - 1) / 2 - i) * -36}deg`,
                marginTop: ((evolutions.length - 1) / 2 - i) * 15,
                marginBottom: ((evolutions.length - 1) / 2 - i) * -15,
              }}
            />
            <EvolutionLine
              nationalDex={evo.dexNumber}
              formeNumber={evo.formeNumber}
              pokedex={pokedex}
            />
          </Flex>
        ))}
      </Flex>
    </Flex>
  )
}

function getHighestFormeStatus(
  pokedex: Pokedex,
  species: Pokemon
): [number, PokedexStatus | undefined] {
  if (!(species.nationalDex in pokedex.byDexNumber)) return [0, undefined]

  let maxStatusForme = 0
  let maxStatus: PokedexStatus = 'Seen'

  for (const [formeIndex, status] of Object.entries(
    pokedex.byDexNumber[species.nationalDex].formes
  )) {
    if (StatusIndices[status] > StatusIndices[maxStatus]) {
      maxStatusForme = parseInt(formeIndex)
      maxStatus = status
    }
  }

  return [maxStatusForme, maxStatus]
}

function getFormeStatus(
  pokedex: Pokedex,
  nationalDex: number,
  formeIndex: number
): PokedexStatus | undefined {
  if (!(nationalDex in pokedex.byDexNumber)) return undefined
  return pokedex.byDexNumber[nationalDex].formes[formeIndex]
}

const StatusIndices: Record<PokedexStatus, number> = {
  Seen: 0,
  ShinySeen: 1,
  Caught: 2,
  ShinyCaught: 3,
}
