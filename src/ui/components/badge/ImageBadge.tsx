import { Option } from '@openhome-core/util/functional'
import { colorIsDark } from '@openhome-ui/util/color'
import { cssClass } from '@openhome-ui/util/style'
import { BaseBadge } from './BaseBadge'

export type ImageBadgeProps = {
  tooltip?: string
  src?: string
  color?: string
  backgroundColor: string
  label?: string
  style?: React.CSSProperties
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
      className={cssClass('image-badge-with-text').if(label).build()}
      tooltip={tooltip}
      backgroundColor={backgroundColor}
      color={color}
      style={style}
    >
      {src && (
        <img
          className={filterClass}
          style={{ maxHeight: '1rem', maxWidth: '1rem' }}
          draggable={false}
          src={src}
        />
      )}
      {label && <div className={filterClass}>{label}</div>}
    </BaseBadge>
  )
}
