import {
  ExtraFormMetadata,
  FormMetadata,
  MetadataSources,
  OriginGame,
  OriginGames,
  orasFormIndexIfSupported,
} from '@pkm-rs/pkg'
import { CHAMPS_TRANSFER_RESTRICTIONS } from '@pokemon-resources/consts/TransferRestrictions'
import { Card, Flex } from '@radix-ui/themes'
import { useContext } from 'react'
import { isRestricted } from 'src/core/save/util/TransferRestrictions'
import { AppInfoContext } from 'src/ui/state/appInfo'
import { isExtraFormMetadata } from './util'

interface PokedexGamesProps {
  selectedForm: FormMetadata | ExtraFormMetadata
}

export function PokedexGames(props: PokedexGamesProps) {
  const { selectedForm } = props
  const [{ extraSaveTypes }] = useContext(AppInfoContext)

  return (
    <>
      <Flex gap="1" overflowY="auto" wrap="wrap" justify="center" mt="1">
        {MetadataSources.supportedGameOrigins(
          selectedForm.nationalDex.index,
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
          .map((origin) => (
            <Card
              className="compatible-game-card"
              key={origin}
              style={{
                backgroundColor: OriginGames.color(origin),
                '--card-background-color': OriginGames.color(origin),
                padding: OriginGames.isGameboy(origin) ? '0' : '0.25rem',
              }}
            >
              <img draggable={false} src={OriginGames.logoPath(origin)} />
            </Card>
          ))}
        {!isRestricted(
          CHAMPS_TRANSFER_RESTRICTIONS,
          selectedForm.nationalDex.index,
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
      </Flex>
      <h2 style={{ width: '100%', textAlign: 'center', margin: '1rem 0' }}>Plugins</h2>
      <Flex gap="1" overflowY="auto" wrap="wrap" justify="center" mb="1rem">
        {extraSaveTypes
          .filter(
            (saveType) =>
              !isRestricted(
                saveType.transferRestrictions,
                selectedForm.nationalDex.index,
                selectedForm.formIndex,
                isExtraFormMetadata(selectedForm) ? selectedForm.extraFormIndex : undefined
              )
          )
          .map((saveType) => (
            <Card
              className="compatible-game-card"
              key={saveType.saveTypeID}
              style={{
                backgroundColor: OriginGames.pluginColor(saveType.getPluginIdentifier()),
                '--card-background-color': OriginGames.pluginColor(saveType.getPluginIdentifier()),
                padding: '0.25rem',
              }}
            >
              <img draggable={false} src={`logos/${saveType.getPluginIdentifier()}.png`} />
            </Card>
          ))}
      </Flex>
    </>
  )
}
