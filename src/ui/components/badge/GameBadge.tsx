import { PluginIdentifier } from '@openhome-core/save/interfaces'
import { Nullable } from '@openhome-core/util/functional'
import { getDetailsOfficialSave, getDetailsPluginSave } from '@openhome-ui/saves/util'
import { ImageBadge } from './ImageBadge'

export type GameBadgeProps = {
  originGame?: Nullable<number>
  plugin?: Nullable<PluginIdentifier>
  withName?: boolean
  tooltip?: string
  style?: React.CSSProperties
}

export function GameBadge({ originGame, plugin, withName, tooltip, style }: GameBadgeProps) {
  if (originGame === undefined || originGame === null) return null

  const { shortName, markIconPath, backgroundColor } = plugin
    ? getDetailsPluginSave(plugin)
    : getDetailsOfficialSave(originGame)

  if (!markIconPath) return null

  const tooltipText = tooltip ?? (withName ? undefined : shortName)

  return (
    <ImageBadge
      tooltip={tooltipText}
      src={markIconPath}
      backgroundColor={backgroundColor}
      label={withName ? shortName : undefined}
      style={style}
    />
  )
}
