import { getPluginColor, OriginGames } from '@pkm-rs/pkg'
import { Option } from 'src/core/util/functional'
import { getOriginIconPath } from 'src/ui/images/game'
import {
  pluginGameName,
  PluginIdentifier,
  pluginOriginMarkPath,
} from '../../../../core/save/interfaces'
import { IndicatorBadge } from './IndicatorBadge'

export type OriginGameIndicatorProps = {
  originGame: Option<number>
  plugin?: PluginIdentifier
  withName?: boolean
  tooltip?: string
}

export function OriginGameIndicator({
  originGame,
  plugin,
  withName,
  tooltip,
}: OriginGameIndicatorProps) {
  if (originGame === undefined) return null

  const { name, markIconPath, backgroundColor } = plugin
    ? getDetailsPluginSave(plugin)
    : getDetailsOfficialSave(originGame)

  if (!markIconPath) return null

  return (
    <IndicatorBadge
      description={tooltip ?? name}
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
