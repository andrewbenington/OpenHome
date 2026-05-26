import AttributeRow from '@openhome-ui/components/AttributeRow'
import TypeIcon from '@openhome-ui/components/pokemon/TypeIcon'
import {
  ExtraFormMetadata,
  FormMetadata,
  MetadataSource,
  MetadataSources,
  MetadataSummaryLookup,
  SpeciesLookup,
  SpeciesMetadata,
  currentMetadataReader,
  metadataReaderFor,
} from '@pkm-rs/pkg'
import { Card, Flex, Separator, Text } from '@radix-ui/themes'
import { Pokedex } from 'src/ui/util/pokedex'
import BaseStatsChart from './BaseStatsChart'
import EvolutionFamily from './EvolutionFamily'
import { MOST_CURRENT_SOURCE, MostCurrentSource } from './PokedexPage'
import { getPokedexSummary, isExtraFormMetadata } from './util'

type PokedexSummaryProps = {
  pokedex: Pokedex
  species: SpeciesMetadata
  selectedForm: FormMetadata | ExtraFormMetadata
  setSelectedForm: (form?: FormMetadata | ExtraFormMetadata) => void
  setSelectedSpecies: (species?: SpeciesMetadata) => void
  metadataSource: MetadataSource | MostCurrentSource
}

export default function PokedexSummary(props: PokedexSummaryProps) {
  const { pokedex, species, selectedForm, setSelectedForm, setSelectedSpecies, metadataSource } =
    props

  const isExtraForm = isExtraFormMetadata(selectedForm)

  const reader =
    metadataSource === MOST_CURRENT_SOURCE
      ? currentMetadataReader(species.nationalDex, selectedForm.formIndex)
      : metadataReaderFor(metadataSource, species.nationalDex, selectedForm.formIndex)

  if (!reader) {
    const message =
      metadataSource !== MOST_CURRENT_SOURCE
        ? `No metadata available for this Pokémon in Pokémon ${MetadataSources.display(metadataSource)}.`
        : 'No metadata available for this Pokémon.'
    return (
      <Flex width="100%" height="100%" align="center" justify="center">
        <Text>{message}</Text>
      </Flex>
    )
  }

  const type1 = isExtraForm ? selectedForm.type1 : reader.type1()
  const type2 = isExtraForm ? selectedForm.type2 : reader.type2()
  const stats = reader.baseStats()

  return (
    <>
      <Flex width="100%" height="50%">
        <div id="base-stats-and-attributes" style={{ width: '50%' }}>
          <BaseStatsChart stats={stats} />
        </div>
        <Flex
          direction="column"
          align="end"
          style={{ height: '100%', overflowY: 'auto', width: '50%', padding: 4, gap: 2 }}
        >
          <AttributeRow label="Level-Up">{species.levelUpType}</AttributeRow>
          <AttributeRow label="Type">
            <TypeIcon type={type1} />
            {type2 && <TypeIcon type={type2} />}
          </AttributeRow>
          {!isExtraFormMetadata(selectedForm) && (
            <>
              <AttributeRow label="Ability 1">{selectedForm.abilities[0].name}</AttributeRow>
              {selectedForm.abilities[1] !== selectedForm.abilities[0] && (
                <AttributeRow label="Ability 2">{selectedForm.abilities[1].name}</AttributeRow>
              )}

              {selectedForm.hiddenAbility && (
                <AttributeRow label="Ability H">
                  <div>{selectedForm.hiddenAbility.name}</div>
                </AttributeRow>
              )}
            </>
          )}
          <AttributeRow label="Egg Groups">
            <div>{selectedForm.eggGroups.join(' • ')}</div>
          </AttributeRow>
          <AttributeRow label="Gender Ratio">{selectedForm.genderRatio}</AttributeRow>
        </Flex>
      </Flex>
      <Flex width="100%" height="50%">
        <Card className="flex-row" style={{ width: '100%', gap: 8 }}>
          <Text style={{ flex: 2 }}>{getPokedexSummary(species, selectedForm)}</Text>
          <Separator orientation="vertical" style={{ height: '100%' }} />
          <div style={{ height: '100%', flex: 1 }}>
            <Text weight="bold" size="2">
              Evolution Family
            </Text>
            <EvolutionFamily
              height="calc(100% - 16px)"
              nationalDex={species.nationalDex}
              formNumber={selectedForm.formIndex}
              pokedex={pokedex}
              onClick={(nationalDex, formIndex) => {
                setSelectedSpecies(SpeciesLookup(nationalDex))
                setSelectedForm(MetadataSummaryLookup(nationalDex, formIndex))
              }}
            />
          </div>{' '}
        </Card>
      </Flex>
    </>
  )
}
