import { colorIsDark } from '@openhome-ui/util/color'
import { cssClass } from '@openhome-ui/util/style'
import { Indicator } from './Indicator'

export type ImageIndicatorProps = {
  tooltip?: string
  src?: string
  color?: string
  backgroundColor: string
  text?: string
  style?: React.CSSProperties
  onClick?: () => void
}

export function ImageIndicator(props: ImageIndicatorProps) {
  const { tooltip, src, backgroundColor, text, style } = props
  const filterClass = colorIsDark(backgroundColor) ? 'white-filter' : 'black-filter'
  return (
    <Indicator
      className={cssClass('image-indicator-with-text').if(text).build()}
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
      {text && <div className={filterClass}>{text}</div>}
    </Indicator>
  )
}
