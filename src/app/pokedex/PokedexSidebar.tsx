import { useVirtualizer } from '@tanstack/react-virtual'
import { Pokemon, PokemonData } from 'pokemon-species-data'
import { CSSProperties, useEffect, useMemo, useRef } from 'react'
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

  const parentRef = useRef(null)
  // The virtualizer
  const virtualizer = useVirtualizer({
    count: Object.keys(PokemonData).length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 5,
    gap: 8,
    paddingStart: 8,
    paddingEnd: 8,
  })

  useEffect(() => {
    if (selectedSpecies) {
      virtualizer.scrollToIndex(selectedSpecies?.nationalDex - 1, {
        behavior: 'smooth',
        align: 'center',
      })
    }
  }, [selectedSpecies, virtualizer])

  return (
    <div ref={parentRef} className="pokedex-sidebar">
      <div style={{ height: virtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <PokedexTab
            key={virtualRow.index}
            pokedex={pokedex}
            species={PokemonData[virtualRow.index + 1]}
            onClick={() => {
              setSelectedSpecies(PokemonData[virtualRow.index + 1])
              const [caughtFormeIndex] = getHighestFormeStatus(
                pokedex,
                PokemonData[virtualRow.index + 1]
              )

              setSelectedForme(PokemonData[virtualRow.index + 1].formes[caughtFormeIndex])
              virtualizer.scrollToIndex(virtualRow.index, { behavior: 'smooth', align: 'center' })
            }}
            selected={
              selectedSpecies?.nationalDex === PokemonData[virtualRow.index + 1].nationalDex
            }
            style={{
              // height: `${virtualRow.size}px`,
              position: 'absolute',
              top: 0,
              left: 0,
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          />
        ))}
      </div>
      <div />
    </div>
  )
}

type PokedexTabProps = {
  pokedex: Pokedex
  species: Pokemon
  onClick: () => void
  selected: boolean
  style?: CSSProperties
}

function PokedexTab({ pokedex, species, onClick, selected, style }: PokedexTabProps) {
  const [formeIndex, maxStatus] = useMemo(() => {
    return getHighestFormeStatus(pokedex, species)
  }, [pokedex, species])

  const isSeen = maxStatus && StatusIndices[maxStatus] >= StatusIndices.Seen
  const isCaught = maxStatus && StatusIndices[maxStatus] >= StatusIndices.Caught

  return (
    <button
      className="pokedex-tab"
      key={species.nationalDex}
      onClick={onClick}
      style={{
        backgroundColor: selected
          ? 'var(--accent-10)'
          : isCaught
            ? 'var(--accent-6)'
            : 'var(--gray-7',
        fontWeight: isCaught ? 'bold' : 'normal',
        ...style,
      }}
    >
      <PokemonIcon
        className="pokedex-icon-container"
        dexNumber={species.nationalDex}
        formeNumber={formeIndex}
        silhouette={!isSeen}
        greyedOut={!isCaught}
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
