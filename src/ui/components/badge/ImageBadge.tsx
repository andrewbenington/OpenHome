import { Option } from '@openhome-core/util/functional'
import { colorIsDark } from '@openhome-ui/util/color'
import { cssClass } from '@openhome-ui/util/style'
import { IconType } from 'react-icons'
import { BaseBadge, BaseBadgeProps } from './BaseBadge'

export type ImageBadgeProps = BaseBadgeProps & {
  src?: string | IconType
  label?: string
  onClick?: () => void
  showIf?: Option<boolean>
}

export function ImageBadge(props: ImageBadgeProps) {
  // If not specified, show anyway. If specified as undefined or false, hide.
  // This is needed when passing a value that could be undefined.
  if ('showIf' in props && props.showIf !== true) return null

  const { tooltip, src, backgroundColor, color, label, style } = props
  const contrastIsWhite = colorIsDark(backgroundColor)

  const filterClass = cssClass('white-filter')
    .if(contrastIsWhite && (color === undefined || color === 'white'))
    .with('black-filter')
    .if(!contrastIsWhite && (color === undefined || color === 'black'))
    .build()

  return (
    <BaseBadge
      className={cssClass('image-badge-with-text').if(label).else('badge-icon-only').build()}
      tooltip={tooltip}
      color={color}
      style={style}
      {...props}
    >
      {typeof src === 'string' ? (
        <img className={filterClass} draggable={false} src={src} />
      ) : src ? (
        src({ style: {} })
      ) : null}
      {label && <div className={filterClass}>{label}</div>}
    </BaseBadge>
  )
}
