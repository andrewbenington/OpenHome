import { classNames } from '@openhome-ui/util/style'
import { Badge, Tooltip } from '@radix-ui/themes'
import { PropsWithChildren } from 'react'

export type IndicatorProps = {
  className?: string
  tooltip?: string
  color?: string
  backgroundColor: string
  style?: React.CSSProperties
} & PropsWithChildren

export function Indicator(props: IndicatorProps) {
  const { className, tooltip, backgroundColor, color, children, style } = props

  const badgeElement = (
    <Badge
      className={classNames('indicator', className)}
      size="1"
      style={{ backgroundColor, color, ...style }}
      variant="solid"
    >
      {children}
    </Badge>
  )
  return tooltip ? <Tooltip content={tooltip}>{badgeElement}</Tooltip> : badgeElement
}
