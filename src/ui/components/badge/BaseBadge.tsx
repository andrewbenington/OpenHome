import { Option } from '@openhome-core/util/functional'
import { cssClass } from '@openhome-ui/util/style'
import { Badge as RadixBadge, Tooltip } from '@radix-ui/themes'
import { Responsive } from '@radix-ui/themes/props'
import { PropsWithChildren } from 'react'

export type BaseBadgeProps = {
  className?: string
  tooltip?: string
  color?: string
  backgroundColor: string
  style?: React.CSSProperties
  size?: Option<Responsive<'2' | '1' | '3'>>
  activeIf?: boolean
} & PropsWithChildren

export function BaseBadge(props: BaseBadgeProps) {
  const { className, tooltip, backgroundColor, color, children, style } = props

  const badgeElement = (
    <RadixBadge
      className={cssClass(`badge badge-size-${props.size ?? '1'}`)
        .with(className)
        .with('badge-disabled')
        .if(props.activeIf === false) // only disable if activeIf function is provided and false
        .build()}
      style={{ backgroundColor, color, ...style }}
      variant="solid"
    >
      {children}
    </RadixBadge>
  )
  return tooltip ? <Tooltip content={tooltip}>{badgeElement}</Tooltip> : badgeElement
}
