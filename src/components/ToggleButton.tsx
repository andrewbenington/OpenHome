import { Button, Tooltip } from '@radix-ui/themes'
import { IconType } from 'react-icons'

export type ToggleButtonProps = {
  state: boolean
  setState: (value: boolean) => void
  icon: IconType
  hint?: string
  disabled?: boolean
  onSet?: () => void
  onUnset?: () => void
  colorOverride?: string
  boxShadow?: string
}

export default function ToggleButton(props: ToggleButtonProps) {
  const {
    state: isToggled,
    setState: setIsToggled,
    icon: Icon,
    hint,
    disabled,
    onSet,
    onUnset,
    colorOverride,
    boxShadow,
  } = props

  const button = (
    <Button
      className="mini-button"
      variant={isToggled ? 'solid' : 'outline'}
      color={isToggled ? undefined : 'gray'}
      disabled={disabled}
      onClick={() => {
        if (isToggled) {
          onUnset?.()
        } else {
          onSet?.()
        }
        setIsToggled(!isToggled)
      }}
      style={{ color: colorOverride, boxShadow }}
    >
      <Icon />
    </Button>
  )

  return hint ? <Tooltip content={hint}>{button}</Tooltip> : button
}
