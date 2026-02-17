import { Nullable, Option } from '@openhome-core/util/functional'
import { getOriginIconPath } from '@openhome-ui/images/game'
import { getPluginColor, OriginGames } from '@pkm-rs/pkg'
import {
  pluginGameName,
  PluginIdentifier,
  pluginOriginMarkPath,
} from '../../../../core/save/interfaces'
import { ImageIndicator } from './ImageIndicator'

export type OriginGameIndicatorProps = {
  originGame?: Nullable<number>
  plugin?: Nullable<PluginIdentifier>
  withName?: boolean
  tooltip?: string
}

export function OriginGameIndicator({
  originGame,
  plugin,
  withName,
  tooltip,
}: OriginGameIndicatorProps) {
  if (originGame === undefined || originGame === null) return null

  const { name, markIconPath, backgroundColor } = plugin
    ? getDetailsPluginSave(plugin)
    : getDetailsOfficialSave(originGame)

  if (!markIconPath) return null

  const tooltipText = tooltip ?? (withName ? undefined : name)

  return (
    <ImageIndicator
      tooltip={tooltipText}
      src={markIconPath}
      backgroundColor={backgroundColor}
      text={withName ? name : undefined}
    />
  )
}

type GameOrPluginDetails = {
  name: string
  markIconPath: Option<string>
  backgroundColor: string
}

function getDetailsOfficialSave(originGame: number): GameOrPluginDetails {
  const gameMetadata = OriginGames.getMetadata(originGame)
  const markImage = getOriginIconPath(gameMetadata)
  const backgroundColor = OriginGames.color(originGame)

  return {
    name: gameMetadata.name,
    markIconPath: markImage,
    backgroundColor,
  }
}

function getDetailsPluginSave(pluginId: PluginIdentifier): GameOrPluginDetails {
  return {
    name: pluginGameName(pluginId),
    markIconPath: pluginOriginMarkPath(pluginId),
    backgroundColor: getPluginColor(pluginId),
  }
}
