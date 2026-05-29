import { PluginIdentifier } from '@openhome-core/save/interfaces'
import { Nullable } from '@openhome-core/util/functional'
import { getDetailsOfficialSave, getDetailsPluginSave } from '@openhome-ui/saves/util'
import { ImageIndicator } from './ImageIndicator'

export type GameIndicatorProps = {
  originGame?: Nullable<number>
  plugin?: Nullable<PluginIdentifier>
  withName?: boolean
  tooltip?: string
  style?: React.CSSProperties
}

export function GameIndicator({
  originGame,
  plugin,
  withName,
  tooltip,
  style,
}: GameIndicatorProps) {
  if (originGame === undefined || originGame === null) return null

  const { shortName, markIconPath, backgroundColor } = plugin
    ? getDetailsPluginSave(plugin)
    : getDetailsOfficialSave(originGame)

  if (!markIconPath) return null

  const tooltipText = tooltip ?? (withName ? undefined : shortName)

  return (
    <ImageIndicator
      tooltip={tooltipText}
      src={markIconPath}
      backgroundColor={backgroundColor}
      text={withName ? shortName : undefined}
      style={style}
    />
  )
}
