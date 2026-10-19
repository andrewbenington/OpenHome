import { Option } from '@openhome-core/util/functional'
import { RadixColor } from '@openhome-ui/util/color'
import { Button, Tooltip, type ButtonProps } from '@radix-ui/themes'
import { MouseEvent, MouseEventHandler, useMemo, useState } from 'react'
import { AddIcon, RemoveIcon } from './Icons'

export type OhoButtonType =
  'destructive' | 'add' | 'solid' | 'delete' | 'clear' | 'search' | ButtonProps['type']

export type OhoButtonProps = Omit<ButtonProps, 'type'> & {
  type?: OhoButtonType
  disabledMessage?: string
  noPaddingX?: boolean
  onClickAsync?: (e: MouseEvent) => Promise<void>
}

export default function OhoButton(props: OhoButtonProps) {
  const {
    disabledMessage,
    style,
    children,
    noPaddingX,
    onClick: onClickProp,
    ...buttonProps
  } = props
  const [onClickAsyncLoading, setOnClickAsyncLoading] = useState(false)

  const color = buttonColor(props.type)

  const radixType = buttonType(props.type)

  const defaultText = useMemo(() => {
    switch (props.type) {
      case 'add':
        return 'Add'
      case 'delete':
        return 'Delete'
      case 'clear':
        return 'Clear'
      case 'search':
        return 'Search'
      default:
        return undefined
    }
  }, [props.type])

  const icon = useMemo(() => {
    switch (props.type) {
      case 'add':
        return <AddIcon />
      case 'delete':
        return <RemoveIcon />
      default:
        return undefined
    }
  }, [props.type])

  const variant = useMemo(() => {
    if (props.variant) return props.variant
    switch (props.type) {
      case 'add':
      case 'submit':
      case 'delete':
      case 'destructive':
      case 'search':
      case 'solid':
        return 'surface'
      default:
        return 'surface'
    }
  }, [props.type, props.variant])

  const loading = props.loading || onClickAsyncLoading
  const disabled = loading || props.disabled || Boolean(disabledMessage)

  const onClick: Option<MouseEventHandler<HTMLButtonElement>> = props.onClickAsync
    ? (e: MouseEvent<HTMLButtonElement>) => {
        setOnClickAsyncLoading(true)
        props
          .onClickAsync?.(e)
          .catch(console.error)
          .finally(() => setOnClickAsyncLoading(false))
      }
    : onClickProp

  const button = (
    <Button
      size="1"
      color={color}
      // @ts-expect-error Radix UI is no longer maintained, this is likely an issue with the library
      type={radixType}
      variant={variant}
      loading={loading}
      disabled={disabled}
      style={{
        minWidth: noPaddingX ? '0rem' : '4rem',
        fontSize: buttonProps.size && buttonProps.size !== '1' ? undefined : '0.9rem',
        paddingLeft: noPaddingX ? 0 : undefined,
        paddingRight: noPaddingX ? 0 : undefined,
        aspectRatio: noPaddingX ? '1' : undefined,
        ...style,
      }}
      onClick={onClick}
      {...buttonProps}
    >
      {children ?? defaultText}
      {icon}
    </Button>
  )

  return disabledMessage ? <Tooltip content={disabledMessage}>{button}</Tooltip> : button
}

function buttonColor(buttonType: OhoButtonType): RadixColor {
  switch (buttonType) {
    case 'reset':
    case 'clear':
      return 'gray'
    case 'delete':
    case 'destructive':
      return 'tomato'
    case 'submit':
      return 'green'
    default:
      return 'gray'
  }
}

function buttonType(buttonType: OhoButtonType) {
  switch (buttonType) {
    case 'add':
    case 'destructive':
      return 'submit' as const
    case 'clear':
      return 'reset' as const
    default:
      return undefined
  }
}
