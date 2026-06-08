import { Button, Tooltip } from '@radix-ui/themes'
import { ComponentProps } from 'react'
import { IconType } from 'react-icons'
import { cssClass } from '../util/style'

export type ToggleButtonProps = {
  state: boolean
  setState: (value: boolean) => void
  icon: IconType
  hint?: string
  disabled?: boolean
  onSet?: () => void
  onUnset?: () => void
  toggledClassName?: string
  untoggledClassName?: string
} & Omit<ComponentProps<'button'>, 'color'>

export default function ToggleButton(props: ToggleButtonProps) {
  const {
    className,
    state: isToggled,
    setState: setIsToggled,
    icon: Icon,
    hint,
    disabled,
    onSet,
    onUnset,
    toggledClassName,
    untoggledClassName,
    ...buttonProps
  } = props

  // console.debug(
  //   cssClass('mini-button').with(toggledClassName).if(isToggled).else(untoggledClassName).build(),
  //   { event: 'mini-button-css-class' }
  // )

  const button = (
    <Button
      className={cssClass('mini-button')
        .with(className)
        .with(toggledClassName)
        .if(isToggled)
        .else(untoggledClassName)
        .build()}
      variant={isToggled ? 'solid' : 'outline'}
      color={isToggled ? undefined : 'gray'}
      disabled={disabled}
      // style={{
      //   backgroundColor: isToggled ? 'var(--accent-9)' : undefined,
      //   color: isToggled ? 'white' : undefined,
      // }}
      onClick={() => {
        if (isToggled) {
          onUnset?.()
        } else {
          onSet?.()
        }
        setIsToggled(!isToggled)
      }}
      {...buttonProps}
    >
      <Icon />
    </Button>
  )

  return hint ? <Tooltip content={hint}>{button}</Tooltip> : button
}
