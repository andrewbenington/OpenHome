import { Button, Tooltip } from '@radix-ui/themes'
import { IconType } from 'react-icons'

export type ToggleButtonProps = {
  state: boolean
  setState: (value: boolean) => void
  icon: IconType
  hint?: string
  onSet?: () => void
  onUnset?: () => void
}

export default function ToggleButton(props: ToggleButtonProps) {
  const { state: isToggled, setState: setIsToggled, icon: Icon, hint, onSet, onUnset } = props

  const button = (
    <Button
      className="mini-button"
      variant={isToggled ? 'solid' : 'outline'}
      color={isToggled ? undefined : 'gray'}
      onClick={() => {
        if (isToggled) {
          onUnset?.()
        } else {
          onSet?.()
        }
        setIsToggled(!isToggled)
      }}
    >
      <Icon />
    </Button>
  )

  return hint ? <Tooltip content={hint}>{button}</Tooltip> : button
}
