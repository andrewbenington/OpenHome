import { colorIsDark } from '@openhome-ui/util/color'
import { cssClass } from '@openhome-ui/util/style'
import { Badge } from './Badge'

export type ImageIndicatorProps = {
  tooltip?: string
  src?: string
  color?: string
  backgroundColor: string
  label?: string
  style?: React.CSSProperties
  onClick?: () => void
}

export function ImageBadge(props: ImageIndicatorProps) {
  const { tooltip, src, backgroundColor, label, style } = props
  const filterClass = colorIsDark(backgroundColor) ? 'white-filter' : 'black-filter'
  return (
    <Badge
      className={cssClass('image-badge-with-text').if(label).build()}
      tooltip={tooltip}
      backgroundColor={backgroundColor}
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
    </Badge>
  )
}
