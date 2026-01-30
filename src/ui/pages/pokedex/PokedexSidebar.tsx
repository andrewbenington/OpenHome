import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { Pokedex } from '@openhome-ui/util/pokedex'
import { all_species_data, FormeMetadata, SpeciesMetadata } from '@pkm-rs/pkg'
import { useVirtualizer } from '@tanstack/react-virtual'
import { CSSProperties, useEffect, useMemo, useRef } from 'react'
import './style.css'
import { getHighestFormeStatus, StatusIndices } from './util'

export type PokedexSidebarProps = {
  filter?: string
  pokedex: Pokedex
  selectedSpecies?: SpeciesMetadata
  setSelectedSpecies: (species: SpeciesMetadata) => void
  setSelectedForme: (forme: FormeMetadata) => void
}

export default function PokedexSidebar(props: PokedexSidebarProps) {
  const { filter, selectedSpecies, setSelectedSpecies, setSelectedForme, pokedex } = props

  const ALL_SPECIES_DATA = useMemo(() => all_species_data(), [])

  const parentRef = useRef(null)

  const filteredSpecies = useMemo(
    () =>
      Object.values(ALL_SPECIES_DATA).filter(
        (mon) => !filter || mon.name.toUpperCase().startsWith(filter?.trim().toUpperCase())
      ),
    [ALL_SPECIES_DATA, filter]
  )

  const virtualizer = useVirtualizer({
    count: filteredSpecies.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 5,
    gap: 8,
    paddingStart: 8,
    paddingEnd: 8,
  })

  useEffect(() => {
    if (selectedSpecies) {
      virtualizer.scrollToIndex(selectedSpecies.nationalDex - 1, {
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
            species={filteredSpecies[virtualRow.index]}
            onClick={() => {
              setSelectedSpecies(filteredSpecies[virtualRow.index])
              const [caughtFormeIndex] = getHighestFormeStatus(
                pokedex,
                filteredSpecies[virtualRow.index]
              )

              setSelectedForme(filteredSpecies[virtualRow.index].formes[caughtFormeIndex])
              virtualizer.scrollToIndex(virtualRow.index, { behavior: 'smooth', align: 'center' })
            }}
            selected={
              selectedSpecies?.nationalDex === filteredSpecies[virtualRow.index].nationalDex
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
  species: SpeciesMetadata
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
      {/* pokedex-icon-container must be on an outer element for unknown reasons */}
      <div className="pokedex-icon-container">
        <PokemonIcon
          dexNumber={species.nationalDex}
          formeNumber={formeIndex}
          silhouette={!isSeen}
          grayedOut={!isCaught}
          style={{ minWidth: 32, height: 36 }} // leave this alone
        />
      </div>
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
