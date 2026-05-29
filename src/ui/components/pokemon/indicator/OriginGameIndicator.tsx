import { Nullable } from '@openhome-core/util/functional'
import { PluginIdentifier } from '@openhome-core/save/interfaces'
import { ImageIndicator } from './ImageIndicator'
import { getDetailsOfficialSave, getDetailsPluginSave } from '@openhome-ui/saves/util'

export type OriginGameIndicatorProps = {
  originGame?: Nullable<number>
  plugin?: Nullable<PluginIdentifier>
  withName?: boolean
  tooltip?: string
  style?: React.CSSProperties
}

export function OriginGameIndicator({
  originGame,
  plugin,
  withName,
  tooltip,
  style,
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
      style={style}
    />
  )
}
