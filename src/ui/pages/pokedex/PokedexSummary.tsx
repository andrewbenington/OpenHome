import { isRestricted } from '@openhome-core/save/util/TransferRestrictions'
import { $O } from '@openhome-core/util/option'
import { filterUndefined, multiSorter, numericSorter } from '@openhome-core/util/sort'
import AttributeRow from '@openhome-ui/components/AttributeRow'
import Badge from '@openhome-ui/components/badge/Badge'
import OhoFlex from '@openhome-ui/components/OhoFlex'
import TypeIcon from '@openhome-ui/components/pokemon/TypeIcon'
import { AppInfoContext } from '@openhome-ui/state/appInfo'
import { parseOriginGame, Pokedex } from '@openhome-ui/util/pokedex'
import {
  currentMetadataReader,
  ExtraFormMetadata,
  FormMetadata,
  metadataReaderFor,
  MetadataSource,
  MetadataSources,
  orasFormIndexIfSupported,
  OriginGame,
  OriginGames,
  SpeciesMetadata,
} from '@pkm-rs/pkg'
import { Card, Flex, ScrollArea, Text } from '@radix-ui/themes'
import { useContext } from 'react'
import BaseStatsChart from './BaseStatsChart'
import './pokedex.css'
import { MOST_CURRENT_SOURCE, MostCurrentSource } from './PokedexPage'
import { getFormPokedexData, getPokedexSummary, isExtraFormMetadata } from './util'

type PokedexSummaryProps = {
  pokedex: Pokedex
  species: SpeciesMetadata
  selectedForm: FormMetadata | ExtraFormMetadata
  setSelectedForm: (form?: FormMetadata | ExtraFormMetadata) => void
  setSelectedSpecies: (species?: SpeciesMetadata) => void
  metadataSource: MetadataSource | MostCurrentSource
}

export default function PokedexSummary(props: PokedexSummaryProps) {
  const { pokedex, species, selectedForm, metadataSource } = props

  const isExtraForm = isExtraFormMetadata(selectedForm)

  const dexEntry = getFormPokedexData(pokedex, species.nationalDex, selectedForm.formIndex)

  const reader =
    metadataSource === MOST_CURRENT_SOURCE
      ? currentMetadataReader(species.nationalDex, selectedForm.formIndex)
      : metadataReaderFor(metadataSource, species.nationalDex, selectedForm.formIndex)

  const [{ extraSaveTypes }] = useContext(AppInfoContext)

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

  const orderedGameSets = compatibleGamesPrioritizeCaught(selectedForm)
  const extraGames = extraSaveTypes.filter(
    (saveType) =>
      !isRestricted(
        saveType.transferRestrictions,
        selectedForm.nationalDex,
        selectedForm.formIndex,
        isExtraFormMetadata(selectedForm) ? selectedForm.extraFormIndex : undefined
      )
  )

  return (
    <OhoFlex.ColStart p="1" height="100%" overflow="auto">
      <Card className="pokedex-summary-card">
        <Flex width="100%" gap="2" height="fit-content">
          <div className="base-stats-and-attributes">
            <BaseStatsChart stats={stats} />
          </div>
          <Flex
            direction="column"
            align="end"
            style={{ height: '100%', overflowY: 'auto', width: '50%', gap: 2 }}
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
      </Card>
      <Card className="pokedex-summary-card">
        <div className="bottom-right-grid">
          <Text weight="bold" size="2">
            Description
          </Text>
          <Text weight="bold" size="2">
            Caught In
          </Text>
          <Text>{getPokedexSummary(species, selectedForm)}</Text>
          <ScrollArea>
            <OhoFlex.Row wrap="wrap" gap="1" justify="center">
              {orderedGameSets.map((gamesForOrigin) => {
                const caughtOrigins = dexEntry?.games.map(parseOriginGame).filter(filterUndefined)
                const firstRegistered = caughtOrigins?.find((game) => gamesForOrigin.includes(game))
                const badgeGame = firstRegistered ?? gamesForOrigin[0]

                return (
                  <Badge.Game
                    key={badgeGame}
                    originGame={badgeGame}
                    size="3"
                    style={{ fontWeight: 'bold' }}
                    inactive={!firstRegistered}
                  />
                )
              })}
            </OhoFlex.Row>
            <h3 style={{ width: '100%', textAlign: 'center', margin: '1rem 0 0.5rem' }}>
              Extra Games
            </h3>
            <OhoFlex.Row wrap="wrap" gap="1" justify="center">
              {extraGames.map((saveType) => {
                const pluginIdentifier = saveType.getPluginIdentifier()
                return (
                  <Badge.Game
                    key={origin}
                    plugin={pluginIdentifier}
                    // withName
                    size="3"
                    style={{ fontWeight: 'bold' }}
                    inactive={!pluginIdentifier || !dexEntry?.extra.includes(pluginIdentifier)}
                  />
                )
              })}
            </OhoFlex.Row>
          </ScrollArea>
        </div>
      </Card>
    </OhoFlex.ColStart>
  )
}

function compatibleGamesPrioritizeCaught(
  selectedForm: FormMetadata | ExtraFormMetadata
): OriginGame[][] {
  if (!selectedForm) return []

  const groupedSources = Object.groupBy(
    MetadataSources.all().filter((source) => {
      if (isExtraFormMetadata(selectedForm)) {
        return (
          source === MetadataSource.OmegaRubyAlphaSapphire &&
          orasFormIndexIfSupported(selectedForm.extraFormIndex) !== undefined
        )
      } else {
        return MetadataSources.supportsForm(
          source,
          selectedForm.nationalDex,
          selectedForm.formIndex
        )
      }
    }),
    (source) => `${MetadataSources.originMark(source)}`
  )

  const orderedGameSets: OriginGame[][] = Object.entries(groupedSources)
    .toSorted(
      multiSorter(
        numericSorter(([, sources]) =>
          $O(sources?.[0]).map(MetadataSources.defaultOriginGame).map(OriginGames.generation).get()
        ),
        numericSorter(([, sources]) =>
          $O(sources?.[0]).map(MetadataSources.defaultOriginGame).get()
        )
      )
    )
    .map(([, sources]) => sources?.flatMap(MetadataSources.originGamesFor))
    .filter(filterUndefined)

  return orderedGameSets
}
