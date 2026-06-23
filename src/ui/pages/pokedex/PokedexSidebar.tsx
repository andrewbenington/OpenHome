import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import useSimpleVirtualizer from '@openhome-ui/hooks/simpleVirtualizer'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { Pokedex } from '@openhome-ui/util/pokedex'
import { cssClass } from '@openhome-ui/util/style'
import { all_species_data, FormMetadata, Language, Lookup, SpeciesMetadata } from '@pkm-rs/pkg'
import { CSSProperties, useEffect, useMemo, useRef } from 'react'
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

  const virtualizer = useSimpleVirtualizer(
    filteredSpecies.length,
    (_, baseFontSize) => baseFontSize * 3,
    parentRef
  )

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
