import { filterUndefined } from '@openhome-core/util/sort'
import { usePokedex } from '@openhome-ui/state/pokedex'
import { Pokedex } from '@openhome-ui/util/pokedex'
import { cssClass } from '@openhome-ui/util/style'
import {
  allMetadataSources,
  ExtraFormMetadata,
  FormMetadata,
  MetadataSource,
  MetadataSources,
  NationalDex,
  SpeciesMetadata,
} from '@pkm-rs/pkg'
import {
  Button,
  Flex,
  Heading,
  Select,
  Separator,
  Spinner,
  Text,
  TextField,
} from '@radix-ui/themes'
import { useState } from 'react'
import './pokedex.css'
import { PokedexGames } from './PokedexGames'
import PokedexLearnset from './PokedexLearnset'
import PokedexLeftColumn from './PokedexLeftColumn'
import PokedexSidebar from './PokedexSidebar'
import PokedexSummary from './PokedexSummary'
import { isExtraFormMetadata } from './util'

type PokedexView = 'summary' | 'levelup' | 'games'

export const MOST_CURRENT_SOURCE = '$CURRENT'
export type MostCurrentSource = typeof MOST_CURRENT_SOURCE

export default function PokedexPage() {
  const pokedexState = usePokedex()
  const [filter, setFilter] = useState('')
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesMetadata>()
  const [selectedForm, setSelectedForm] = useState<FormMetadata | ExtraFormMetadata>()

  if (!pokedexState.loaded) {
    return <Spinner />
  }

  const pokedex = pokedexState.pokedex
  const caughtCount = Object.values(pokedex.byDexNumber)
    .filter(filterUndefined)
    .filter((entry) =>
      Object.values(entry.forms).some((status) => status?.level.endsWith('Caught'))
    ).length

  const seenCount = new Set(
    Object.keys(pokedex.byDexNumber).filter((v) => parseInt(v) <= NationalDex.Pecharunt)
  ).size

  return (
    <div className="pokedex-page">
      <div className="pokedex-header">
        <h1 className="pokedex-header-title">National Pokédex</h1>
        <div style={{ flex: 1 }} />
        <Text>
          <b>Caught:</b> {caughtCount}
        </Text>
        <Text>
          <b>Seen:</b> {seenCount}
        </Text>
        <TextField.Root
          className="pokedex-filter-field"
          placeholder="Filter..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <Flex style={{ height: 'calc(100% - var(--top-bar-height))' }}>
        <Flex className="pokedex-body" direction="column" width="calc(100% - var(--sidebar-width))">
          {selectedSpecies && selectedForm && (
            <PokedexDetails
              pokedex={pokedex}
              speciesMetadata={selectedSpecies}
              formMetadata={selectedForm}
              setSelectedForm={setSelectedForm}
              setSelectedSpecies={setSelectedSpecies}
            />
          )}
        </Flex>
        <PokedexSidebar
          filter={filter}
          selectedSpecies={selectedSpecies}
          setSelectedSpecies={setSelectedSpecies}
          setSelectedForm={setSelectedForm}
          pokedex={pokedex}
        />
      </Flex>
    </div>
  )
}

export type PokedexDetailsProps = {
  pokedex: Pokedex
  speciesMetadata: SpeciesMetadata
  formMetadata: FormMetadata | ExtraFormMetadata
  setSelectedForm: (form?: FormMetadata | ExtraFormMetadata) => void
  setSelectedSpecies: (species?: SpeciesMetadata) => void
}

function PokedexDetails(props: PokedexDetailsProps) {
  const { pokedex, speciesMetadata, formMetadata, setSelectedForm, setSelectedSpecies } = props
  const [currentView, setCurrentView] = useState<PokedexView>('summary')
  const [metadataSource, setMetadataSource] = useState<MetadataSource | MostCurrentSource>(
    MOST_CURRENT_SOURCE
  )

  return (
    <Flex direction="row" height="100%" align="center" width="100%" overflow="hidden">
      <PokedexLeftColumn {...props} />
      <Separator orientation="vertical" style={{ height: '100%' }} />
      <div className="pokedex-summary-pane">
        <Flex className="pokedex-tab-row">
          <Button
            className={cssClass('pokedex-tab')
              .with('pokedex-tab-selected')
              .if(currentView === 'summary')
              .build()}
            onClick={() => setCurrentView('summary')}
          >
            Summary
          </Button>
          <Button
            className={cssClass('pokedex-tab')
              .with('pokedex-tab-selected')
              .if(currentView === 'levelup')
              .build()}
            onClick={() => setCurrentView('levelup')}
          >
            Levelup Learnset
          </Button>
          <Button
            className={cssClass('pokedex-tab')
              .with('pokedex-tab-selected')
              .if(currentView === 'games')
              .build()}
            onClick={() => setCurrentView('games')}
          >
            Games
          </Button>
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
                        formMetadata.nationalDex,
                        formMetadata.formIndex
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
          {currentView === 'summary' ? (
            <PokedexSummary
              pokedex={pokedex}
              species={speciesMetadata}
              selectedForm={formMetadata}
              setSelectedForm={setSelectedForm}
              setSelectedSpecies={setSelectedSpecies}
              metadataSource={metadataSource}
            />
          ) : currentView === 'levelup' ? (
            isExtraFormMetadata(formMetadata) ? (
              <Heading size="2" m="3" align="center">
                Extra form learnsets are not yet supported
              </Heading>
            ) : (
              <PokedexLearnset selectedForm={formMetadata} metadataSource={metadataSource} />
            )
          ) : currentView === 'games' ? (
            <PokedexGames selectedForm={formMetadata} />
          ) : null}
        </div>
      </div>
    </Flex>
  )
}
