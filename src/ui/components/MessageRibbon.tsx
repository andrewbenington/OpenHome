import { Callout } from '@radix-ui/themes'
import type { Responsive } from '@radix-ui/themes/props'
import type { ReactNode } from 'react'
import type { IconType } from 'react-icons'
import { ErrorIcon, InfoIcon, SuccessIcon } from './Icons'

type RibbonType = 'info' | 'success' | 'warning' | 'error'

export type MessageRibbonProps = {
  children: ReactNode
  type?: RibbonType
  size?: Responsive<'1' | '2' | '3'>
  variant?: Callout.RootProps['variant']
}

type TypeData = {
  icon: IconType
  color: Callout.RootProps['color']
}

const TYPE_DATA: Record<RibbonType, TypeData> = {
  info: { icon: InfoIcon, color: 'cyan' },
  success: { icon: SuccessIcon, color: 'green' },
  warning: { icon: ErrorIcon, color: 'orange' },
  error: { icon: ErrorIcon, color: 'crimson' },
}

export default function MessageRibbon(props: MessageRibbonProps) {
  const { children, type = 'info', size = '1', variant = 'surface' } = props
  const { icon: IconComponent, color } = TYPE_DATA[type]

  return (
    <Callout.Root color={color} size={size} variant={variant}>
      <Callout.Icon>
        <IconComponent fontSize={24} />
      </Callout.Icon>
      <Callout.Text>{children}</Callout.Text>
    </Callout.Root>
  )
}
