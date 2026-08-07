import { classNames } from '@openhome-ui/util/style'
import { Badge as RadixBadge, Tooltip } from '@radix-ui/themes'
import { PropsWithChildren } from 'react'

export type BadgeProps = {
  className?: string
  tooltip?: string
  color?: string
  backgroundColor: string
  style?: React.CSSProperties
} & PropsWithChildren

export function Badge(props: BadgeProps) {
  const { className, tooltip, backgroundColor, color, children, style } = props

  const badgeElement = (
    <RadixBadge
      className={classNames('badge', className)}
      size="1"
      style={{ backgroundColor, color, ...style }}
      variant="solid"
    >
      {children}
    </RadixBadge>
  )
  return tooltip ? <Tooltip content={tooltip}>{badgeElement}</Tooltip> : badgeElement
}
