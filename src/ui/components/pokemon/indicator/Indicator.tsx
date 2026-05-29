import { Badge, Tooltip } from '@radix-ui/themes'
import { PropsWithChildren } from 'react'
import { classNames } from 'src/ui/util/style'

export type IndicatorProps = {
  className?: string
  tooltip?: string
  backgroundColor: string
  style?: React.CSSProperties
} & PropsWithChildren

export function Indicator(props: IndicatorProps) {
  const { className, tooltip, backgroundColor, children, style } = props

  const badgeElement = (
    <Badge
      className={classNames('indicator', className)}
      size="1"
      style={{ backgroundColor, ...style }}
      variant="solid"
    >
      {children}
    </Badge>
  )
  return tooltip ? <Tooltip content={tooltip}>{badgeElement}</Tooltip> : badgeElement
}
