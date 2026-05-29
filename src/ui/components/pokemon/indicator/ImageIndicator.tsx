import { colorIsDark } from 'src/ui/util/color'
import { includeClass } from 'src/ui/util/style'
import { Indicator } from './Indicator'

export type ImageIndicatorProps = {
  tooltip?: string
  src: string
  backgroundColor: string
  text?: string
  style?: React.CSSProperties
}

export function ImageIndicator({
  tooltip,
  src,
  backgroundColor,
  text,
  style,
}: ImageIndicatorProps) {
  const filterClass = colorIsDark(backgroundColor) ? 'white-filter' : 'black-filter'
  return (
    <Indicator
      className={includeClass('image-indicator-with-text').if(Boolean(text))}
      tooltip={tooltip}
      backgroundColor={backgroundColor}
      style={style}
    >
      <img
        className={filterClass}
        style={{ maxHeight: 15, maxWidth: 15 }}
        draggable={false}
        src={src}
      />
      {text && <div className={filterClass}>{text}</div>}
    </Indicator>
  )
}
