import { Button, Flex, Spinner } from '@radix-ui/themes'
import { Pokemon, PokemonData } from 'pokemon-species-data'
import { useEffect, useMemo, useState } from 'react'
import PokemonIcon from '../components/PokemonIcon'
import useMonSprite from '../pokemon/useMonSprite'
import { usePokedex } from '../state/pokedex'
import { Pokedex, PokedexStatus } from '../types/pokedex'
import { Forme } from '../types/types'

export default function PokedexDisplay() {
  const pokedexState = usePokedex()
  const [selectedSpecies, setSelectedSpecies] = useState<Pokemon>()

  if (!pokedexState.loaded) {
    return <Spinner />
  }

  const pokedex = pokedexState.pokedex

  return (
    <Flex style={{ height: '100%' }}>
      <Flex
        direction="column"
        width="200px"
        overflowX="hidden"
        gap="2"
        overflowY="auto"
        height="100%"
      >
        {Object.entries(PokemonData).map(([_, species]) => (
          <PokedexTab
            key={species.nationalDex}
            pokedex={pokedex}
            species={species}
            onClick={() => setSelectedSpecies(species)}
            selected={selectedSpecies?.nationalDex === species.nationalDex}
          />
        ))}
        <div />
      </Flex>
      <div style={{ width: 'calc(100% - 200px)', height: '100%' }}>
        {selectedSpecies && <PokedexDetails pokedex={pokedex} species={selectedSpecies} />}
      </div>
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
    <button
      key={species.nationalDex}
      onClick={onClick}
      style={{
        textAlign: 'start',
        backgroundColor: selected ? '#00cccc' : 'gray',
        display: 'flex',
        height: 48,
        alignItems: 'center',
        fontWeight: isCaught ? 'bold' : 'normal',
      }}
      disabled={!maxStatus}
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
    </button>
  )
}

type PokedexDetailsProps = {
  pokedex: Pokedex
  species: Pokemon
}

function PokedexDetails({ pokedex, species }: PokedexDetailsProps) {
  const [imageError, setImageError] = useState(false)
  const [formeIndex] = getHighestFormeStatus(pokedex, species)
  const [selectedForme, setSelectedForme] = useState<Forme>(species.formes[formeIndex])

  const spritePath = useMonSprite({
    dexNum: species.nationalDex,
    formeNum: selectedForme.formeNumber,
    format: 'OHPKM',
  })

  useEffect(() => {
    setSelectedForme(species.formes[formeIndex])
    setImageError(false)
  }, [species, formeIndex])

  const selectedFormeStatus = getFormeStatus(pokedex, species, selectedForme.formeNumber)
  const selectedFormeCaught = selectedFormeStatus?.includes('Caught')

  return (
    <Flex justify="center">
      <div
        style={{
          height: '50%',
          display: 'grid',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        }}
      >
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
            style={{ filter: !selectedFormeCaught ? 'saturate(0%)' : undefined }}
          />
        ) : (
          <Spinner style={{ margin: 'auto', height: 32 }} />
        )}
        <div>{selectedForme.formeName}</div>
        <Flex justify="center" gap="2">
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
                greyedOut={!getFormeStatus(pokedex, species, forme.formeNumber)?.includes('Caught')}
              />
            </Button>
          ))}
        </Flex>
      </div>
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
  species: Pokemon,
  formeIndex: number
): PokedexStatus | undefined {
  if (!(species.nationalDex in pokedex.byDexNumber)) return undefined
  return pokedex.byDexNumber[species.nationalDex].formes[formeIndex]
}

const StatusIndices: Record<PokedexStatus, number> = {
  Seen: 0,
  ShinySeen: 1,
  Caught: 2,
  ShinyCaught: 3,
}
