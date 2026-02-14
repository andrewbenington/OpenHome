import { Badge, Tooltip } from '@radix-ui/themes'
import { PropsWithChildren } from 'react'
import { classNames } from 'src/ui/util/style'

export type IndicatorProps = {
  className?: string
  tooltip?: string
  backgroundColor: string
} & PropsWithChildren

export function Indicator({ className, tooltip, backgroundColor, children }: IndicatorProps) {
  const badgeElement = (
    <Badge
      className={classNames('indicator', className)}
      size="1"
      style={{ backgroundColor }}
      variant="solid"
    >
      {children}
    </Badge>
  )
  return tooltip ? <Tooltip content={tooltip}>{badgeElement}</Tooltip> : badgeElement
}
