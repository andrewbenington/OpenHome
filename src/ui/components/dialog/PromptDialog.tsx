import { useState } from 'react'
import { AlertDialog } from './AlertDialog'

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
    <AlertDialog.Root open={isOpen} onOpenChange={onOpenChange}>
      {triggerButton && (
        <AlertDialog.Trigger data-color="theme">{triggerButton}</AlertDialog.Trigger>
      )}
      <AlertDialog.Portal container={document.getElementById('app-container')}>
        <AlertDialog.Backdrop onClick={() => onOpenChange(false)} />
        <AlertDialog.Popup>
          <AlertDialog.Title>{title}</AlertDialog.Title>
          <AlertDialog.Description>{description}</AlertDialog.Description>
          <AlertDialog.Actions>
            {actions.map(({ uniqueLabel, action, type }) => (
              <AlertDialog.Close
                key={uniqueLabel}
                onClick={async () => {
                  await action()
                  if (!stateIsControlled) {
                    setIsOpenUncontrolled(false)
                  }
                }}
                data-color={type === 'destructive' ? 'red' : type === 'cancel' ? 'grey' : 'theme'}
              >
                {uniqueLabel}
              </AlertDialog.Close>
            ))}
          </AlertDialog.Actions>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
