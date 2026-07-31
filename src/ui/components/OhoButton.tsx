import { RadixColor } from '@openhome-ui/util/color'
import { Button, Tooltip, type ButtonProps } from '@radix-ui/themes'
import { useMemo } from 'react'
import { AddIcon, RemoveIcon } from './Icons'

export type OhoButtonType =
  'destructive' | 'add' | 'solid' | 'delete' | 'clear' | 'search' | ButtonProps['type']

export type OhoButtonProps = Omit<ButtonProps, 'type'> & {
  type?: OhoButtonType
  disabledMessage?: string
  noPaddingX?: boolean
}

export default function OhoButton(props: OhoButtonProps) {
  const {
    type: ohoButtonType,
    disabledMessage,
    style,
    children,
    loading,
    disabled: disabledProp,
    variant: variantProp,
    noPaddingX,
    ...buttonProps
  } = props

  const color: RadixColor | undefined = useMemo(() => {
    switch (ohoButtonType) {
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
  }, [ohoButtonType])

  const radixType: ButtonProps['type'] = useMemo(() => {
    switch (ohoButtonType) {
      case 'add':
      case 'destructive':
        return 'submit'
      case 'clear':
        return 'reset'
      default:
        return undefined
    }
  }, [ohoButtonType])

  const defaultText = useMemo(() => {
    switch (ohoButtonType) {
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
  }, [ohoButtonType])

  const icon = useMemo(() => {
    switch (ohoButtonType) {
      case 'add':
        return <AddIcon />
      case 'delete':
        return <RemoveIcon />
      default:
        return undefined
    }
  }, [ohoButtonType])

  const variant = useMemo(() => {
    if (variantProp) return variantProp
    switch (ohoButtonType) {
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
  }, [ohoButtonType, variantProp])

  const disabled = loading || disabledProp || Boolean(disabledMessage)

  const button = (
    <Button
      size="1"
      color={color}
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
      {...buttonProps}
    >
      {children ?? defaultText}
      {icon}
    </Button>
  )

  return disabledMessage ? <Tooltip content={disabledMessage}>{button}</Tooltip> : button
}
