import { CHAMPS_TRANSFER_RESTRICTIONS } from '@openhome-core/resources/consts/TransferRestrictions'
import { isRestricted } from '@openhome-core/save/util/TransferRestrictions'
import AttributeRow from '@openhome-ui/components/AttributeRow'
import Badge from '@openhome-ui/components/badge/Badge'
import OhoFlex from '@openhome-ui/components/OhoFlex'
import TypeIcon from '@openhome-ui/components/pokemon/TypeIcon'
import { AppInfoContext } from '@openhome-ui/state/appInfo'
import { originToStr, Pokedex } from '@openhome-ui/util/pokedex'
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
import { Card, Flex, Inset, ScrollArea, Separator, Text } from '@radix-ui/themes'
import { useContext } from 'react'
import BaseStatsChart from './BaseStatsChart'
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
        <Card
          className="flex-row"
          style={{ width: '100%', gap: 8, overflow: 'hidden', boxSizing: 'border-box' }}
        >
          <div className="bottom-right-grid">
            {/* <OhoFlex.Row height="2.25rem" style={{ backgroundColor: 'orange' }}> */}
            <Text style={{ flex: 2 }}>{getPokedexSummary(species, selectedForm)}</Text>
            {/* <Inset>
              <Separator orientation="vertical" />
            </Inset> */}
            <Text weight="bold" size="2">
              Caught In
            </Text>
            {/* </OhoFlex.Row> */}
            <Inset side="x" p="0" my="2">
              <Separator />
            </Inset>
            <ScrollArea style={{ flex: 1 }}>
              <OhoFlex.Row wrap="wrap">
                {MetadataSources.supportedGameOrigins(
                  selectedForm.nationalDex,
                  selectedForm.formIndex
                )
                  .filter((origin) => {
                    if (isExtraFormMetadata(selectedForm)) {
                      return (
                        (origin === OriginGame.OmegaRuby || origin === OriginGame.AlphaSapphire) &&
                        orasFormIndexIfSupported(selectedForm.extraFormIndex) !== undefined
                      )
                    } else {
                      return true
                    }
                  })
                  .map((origin) => {
                    const originString = originToStr(origin)
                    return (
                      <Badge.Game
                        key={origin}
                        originGame={origin}
                        size="3"
                        style={{ fontWeight: 'bold' }}
                        activeIf={(originString && dexEntry?.games.includes(originString)) === true}
                      />
                    )
                  })}
                {!isRestricted(
                  CHAMPS_TRANSFER_RESTRICTIONS,
                  selectedForm.nationalDex,
                  selectedForm.formIndex
                ) && (
                  <Card
                    className="compatible-game-card"
                    key="champions"
                    style={{
                      backgroundColor: OriginGames.championsColor(),
                      '--card-background-color': OriginGames.championsColor(),
                      padding: '0.25rem',
                    }}
                  >
                    <img draggable={false} src={OriginGames.championsLogoPath()} />
                  </Card>
                )}
                <h2 style={{ width: '100%', textAlign: 'center', margin: '1rem 0' }}>Plugins</h2>
                <Flex gap="1" overflowY="auto" wrap="wrap" justify="center" mb="1rem">
                  {extraSaveTypes
                    .filter(
                      (saveType) =>
                        !isRestricted(
                          saveType.transferRestrictions,
                          selectedForm.nationalDex,
                          selectedForm.formIndex,
                          isExtraFormMetadata(selectedForm)
                            ? selectedForm.extraFormIndex
                            : undefined
                        )
                    )
                    .map((saveType) => {
                      const pluginIdentifier = saveType.getPluginIdentifier()
                      return (
                        <Badge.Game
                          key={origin}
                          plugin={pluginIdentifier}
                          // withName
                          size="3"
                          style={{ fontWeight: 'bold' }}
                          activeIf={
                            (pluginIdentifier && dexEntry?.extra.includes(pluginIdentifier)) ===
                            true
                          }
                        />
                      )
                    })}
                </Flex>
              </OhoFlex.Row>
            </ScrollArea>
          </div>
        </Card>
      </Flex>
    </>
  )
}
