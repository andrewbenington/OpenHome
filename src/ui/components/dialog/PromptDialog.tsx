import { useState } from 'react'
import { Dialog } from './Dialog'

type PromptDialogProps = {
  triggerButton?: string
  title: string
  description: string
  actions: PromptDialogAction[]
  open?: boolean
  onClose?: () => void
}

export type PromptDialogActionType = 'cancel' | 'destructive'

export type PromptDialogAction = {
  uniqueLabel: string
  action: (() => void) | (() => Promise<void>)
  type?: PromptDialogActionType
}

export default function PromptDialog(props: PromptDialogProps) {
  const { triggerButton, title, description, actions, open: isOpenControlled, onClose } = props
  const [isOpenUncontrolled, setIsOpenUncontrolled] = useState(false)

  const stateIsControlled = isOpenControlled !== undefined
  const isOpen = stateIsControlled ? isOpenControlled : isOpenUncontrolled

  function onOpenChange(open: boolean) {
    if (!open) {
      onClose?.()
    }
    if (!stateIsControlled) {
      setIsOpenUncontrolled(open)
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      {triggerButton && <Dialog.Trigger data-color="theme">{triggerButton}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Backdrop onClick={() => onOpenChange(false)} />
        <Dialog.Popup>
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Description>{description}</Dialog.Description>
          <Dialog.Actions>
            {actions.map(({ uniqueLabel, action, type }) => (
              <Dialog.Close
                key={uniqueLabel}
                onClickAsync={async () => {
                  await action()
                  if (!stateIsControlled) {
                    setIsOpenUncontrolled(false)
                  }
                }}
                variant="solid"
                type={type === 'cancel' ? 'clear' : 'destructive'}
              >
                {uniqueLabel}
              </Dialog.Close>
            ))}
          </Dialog.Actions>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
