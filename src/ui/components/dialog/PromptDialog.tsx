import { useState } from 'react'
import { AlertDialog } from './AlertDialog'

type PromptDialogProps = {
  triggerButton?: string
  title: string
  description: string
  actions: PromptDialogAction[]
  open?: boolean
}

export type PromptDialogActionType = 'cancel' | 'destructive'

export type PromptDialogAction = {
  uniqueLabel: string
  action: (() => void) | (() => Promise<void>)
  type?: PromptDialogActionType
}

export default function PromptDialog(props: PromptDialogProps) {
  const { triggerButton, title, description, actions, open: isOpenControlled } = props
  const [isOpenUncontrolled, setIsOpenUncontrolled] = useState(false)

  const stateIsControlled = isOpenControlled !== undefined
  const isOpen = stateIsControlled ? isOpenControlled : isOpenUncontrolled

  const onCancel = actions.find((a) => a.type === 'cancel')?.action

  function cancelAndClose() {
    onCancel?.()
    if (!stateIsControlled) {
      setIsOpenUncontrolled(false)
    }
  }

  return (
    <AlertDialog.Root
      open={isOpen}
      onOpenChange={stateIsControlled ? undefined : setIsOpenUncontrolled}
    >
      {triggerButton && (
        <AlertDialog.Trigger data-color="theme">{triggerButton}</AlertDialog.Trigger>
      )}
      <AlertDialog.Portal container={document.getElementById('app-container')}>
        <AlertDialog.Backdrop onClick={cancelAndClose} />
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
                data-color={type === 'destructive' ? 'red' : type === 'cancel' ? 'grey' : 'blue'}
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
