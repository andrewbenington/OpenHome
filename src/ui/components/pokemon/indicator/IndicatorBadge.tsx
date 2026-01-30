import { Badge, Tooltip } from '@radix-ui/themes'
import { colorIsDark } from 'src/ui/util/color'

export type IndicatorBadgeProps = {
  description: string
  src: string
  backgroundColor: string
  text?: string
}

export function IndicatorBadge({ description, src, backgroundColor, text }: IndicatorBadgeProps) {
  return (
    <Tooltip content={description}>
      <Badge
        className="badge-shadow origin-badge"
        size="1"
        style={{ backgroundColor, minWidth: text ? 'fit-content' : 18 }}
        variant="solid"
      >
        <img
          className={colorIsDark(backgroundColor) ? 'white-filter' : 'black-filter'}
          style={{ maxHeight: 15, maxWidth: 15 }}
          draggable={false}
          alt="origin mark"
          src={src}
        />
        {text && (
          <div className={colorIsDark(backgroundColor) ? 'white-filter' : 'black-filter'}>
            {text}
          </div>
        )}
      </Badge>
    </Tooltip>
  )
}
