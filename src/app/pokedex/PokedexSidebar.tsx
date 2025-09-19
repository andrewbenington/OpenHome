import { Flex } from '@radix-ui/themes'
import { Pokemon, PokemonData } from 'pokemon-species-data'
import { useMemo } from 'react'
import PokemonIcon from 'src/components/PokemonIcon'
import { getPublicImageURL } from 'src/images/images'
import { Pokedex } from 'src/types/pokedex'
import { Forme } from 'src/types/types'
import './style.css'
import { getHighestFormeStatus, StatusIndices } from './util'

export type PokedexSidebarProps = {
  selectedSpecies?: Pokemon
  setSelectedSpecies: (species: Pokemon) => void
  setSelectedForme: (forme: Forme) => void
  pokedex: Pokedex
}

export default function PokedexSidebar(props: PokedexSidebarProps) {
  const { selectedSpecies, setSelectedSpecies, setSelectedForme, pokedex } = props

  return (
    <Flex
      className="side-tab-list pokedex-sidebar"
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
  )
}

type PokedexTabProps = {
  pokedex: Pokedex
  species: Pokemon
  onClick: () => void
  selected: boolean
}

function PokedexTab({ pokedex, species, onClick, selected }: PokedexTabProps) {
  const [formeIndex, maxStatus] = useMemo(() => {
    return getHighestFormeStatus(pokedex, species)
  }, [pokedex, species])

  const isCaught = maxStatus && StatusIndices[maxStatus] >= StatusIndices.Caught

  return (
    <button
      className="pokedex-tab"
      key={species.nationalDex}
      onClick={(e) => {
        e.currentTarget.scrollIntoView({ block: 'center', behavior: 'smooth' })
        onClick()
      }}
      style={{
        backgroundColor: selected
          ? 'var(--accent-10)'
          : isCaught
            ? 'var(--accent-6)'
            : 'var(--gray-7',
        fontWeight: isCaught ? 'bold' : 'normal',
      }}
    >
      <PokemonIcon
        className="pokedex-icon-container"
        dexNumber={species.nationalDex}
        formeNumber={formeIndex}
        silhouette={!maxStatus}
        style={{ minWidth: 32, minHeight: 32 }}
      />
      {species.nationalDex}. {species.name}
      <div style={{ flex: 1 }} />
      {maxStatus === 'ShinyCaught' && (
        <img
          alt="shiny icon"
          style={{ width: 26, height: 26, marginRight: 5 }}
          draggable={false}
          src={getPublicImageURL('icons/Shiny.png')}
        />
      )}
    </button>
  )
}
