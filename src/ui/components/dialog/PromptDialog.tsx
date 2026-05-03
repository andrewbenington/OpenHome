import { useState } from 'react'
import { AlertDialog } from './AlertDialog'

type PromptDialogProps = {
  triggerButton?: string
  title: string
  description: string
  confirmButtonMessage?: string
  onCancel?: () => void
  onConfirm?: () => void
  open?: boolean
}

export default function PromptDialog(props: PromptDialogProps) {
  const {
    triggerButton,
    title,
    description,
    onCancel,
    onConfirm,
    confirmButtonMessage,
    open: isOpenControlled,
  } = props
  const [isOpenUncontrolled, setIsOpenUncontrolled] = useState(false)

  const stateIsControlled = isOpenControlled !== undefined
  const isOpen = stateIsControlled ? isOpenControlled : isOpenUncontrolled

  function cancelAndClose() {
    onCancel?.()
    if (!stateIsControlled) {
      setIsOpenUncontrolled(false)
    }
  }

  function confirmAndClose() {
    onConfirm?.()
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
            <AlertDialog.Close onClick={cancelAndClose}>Cancel</AlertDialog.Close>
            <AlertDialog.Close data-color="red" onClick={confirmAndClose}>
              {confirmButtonMessage ?? 'Confirm'}
            </AlertDialog.Close>
          </AlertDialog.Actions>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
