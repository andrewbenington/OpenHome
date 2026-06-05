import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { Pokedex } from '@openhome-ui/util/pokedex'
import { all_species_data, FormMetadata, Language, Lookup, SpeciesMetadata } from '@pkm-rs/pkg'
import { useVirtualizer } from '@tanstack/react-virtual'
import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react'
import { cssClass } from 'src/ui/util/style'
import './PokedexSidebar.css'
import { getHighestFormeStatus, StatusIndices } from './util'

export type PokedexSidebarProps = {
  filter?: string
  pokedex: Pokedex
  selectedSpecies?: SpeciesMetadata
  setSelectedSpecies: (species: SpeciesMetadata) => void
  setSelectedForm: (form: FormMetadata) => void
}

export default function PokedexSidebar(props: PokedexSidebarProps) {
  const {
    filter,
    selectedSpecies,
    setSelectedSpecies,
    setSelectedForm: setSelectedForme,
    pokedex,
  } = props

  const ALL_SPECIES_DATA = useMemo(() => all_species_data(), [])

  const parentRef = useRef(null)

  const filteredSpecies = useMemo(
    () =>
      Object.values(ALL_SPECIES_DATA).filter(
        (mon) =>
          !filter ||
          Lookup.speciesName(mon.nationalDex, Language.English)
            .toUpperCase()
            .startsWith(filter?.trim().toUpperCase())
      ),
    [ALL_SPECIES_DATA, filter]
  )

  // these are necessary to ensure the sidebar resizes correctly when zooming
  const [baseFontSize, setBaseFontSize] = useState(() =>
    parseFloat(getComputedStyle(document.documentElement).fontSize)
  )
  const virtualizer = useVirtualizer({
    count: filteredSpecies.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => baseFontSize * 3,
    overscan: 5,
  })
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const newBaseFont = parseFloat(getComputedStyle(document.documentElement).fontSize)
      setBaseFontSize(newBaseFont)
      virtualizer.setOptions({
        ...virtualizer.options,
        estimateSize: () => newBaseFont * 3,
      })
      virtualizer.measure()
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style', 'class'], // class changes can affect font-size too
    })
    return () => observer.disconnect()
  }, [virtualizer])

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
      <div className="pokedex-sidebar-inner" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <PokedexSidebarButton
            key={virtualRow.index}
            pokedex={pokedex}
            species={filteredSpecies[virtualRow.index]}
            onClick={() => {
              setSelectedSpecies(filteredSpecies[virtualRow.index])
              const [caughtFormeIndex] = getHighestFormeStatus(
                pokedex,
                filteredSpecies[virtualRow.index]
              )

              setSelectedForme(filteredSpecies[virtualRow.index].forms[caughtFormeIndex])
              virtualizer.scrollToIndex(virtualRow.index, { behavior: 'smooth', align: 'center' })
            }}
            selected={
              selectedSpecies?.nationalDex === filteredSpecies[virtualRow.index].nationalDex
            }
            style={{
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

function PokedexSidebarButton({ pokedex, species, onClick, selected, style }: PokedexTabProps) {
  const [formIndex, maxStatus] = useMemo(() => {
    return getHighestFormeStatus(pokedex, species)
  }, [pokedex, species])

  const isSeen = maxStatus && StatusIndices[maxStatus] >= StatusIndices.Seen
  const isCaught = maxStatus && StatusIndices[maxStatus] >= StatusIndices.Caught

  return (
    <button
      className={cssClass('pokedex-sidebar-button')
        .with('pokedex-sidebar-button-selected')
        .if(selected)
        .with('pokedex-sidebar-button-caught')
        .if(isCaught)
        .build()}
      key={species.nationalDex}
      onClick={onClick}
      style={style}
    >
      {/* pokedex-icon-container must be on an outer element for unknown reasons */}
      <div className="pokedex-icon-container">
        <PokemonIcon
          dexNumber={species.nationalDex}
          formeNumber={formIndex}
          silhouette={!isSeen}
          grayedOut={!isCaught}
        />
      </div>
      {species.nationalDex}. {Lookup.speciesName(species.nationalDex, Language.English)}
      <div style={{ flex: 1 }} />
      {maxStatus === 'ShinyCaught' && (
        <img
          className="pokedex-sidebar-shiny-icon"
          alt="shiny icon"
          draggable={false}
          src={getPublicImageURL('icons/Shiny.png')}
        />
      )}
    </button>
  )
}
