import { AlertDialog as BaseUiAlertDialog } from '@base-ui/react/alert-dialog'
import { useState } from 'react'
import styles from './AlertDialog.module.css'

export const FORCE_DIALOG_FOR_TESTING = false

export const AlertDialog = {
  Root: (props: React.ComponentProps<typeof BaseUiAlertDialog.Root>) => (
    <BaseUiAlertDialog.Root {...props} />
  ),
  Trigger: (props: React.ComponentProps<typeof BaseUiAlertDialog.Trigger>) => (
    <BaseUiAlertDialog.Trigger {...props} className={styles.Button} />
  ),
  Portal: (props: React.ComponentProps<typeof BaseUiAlertDialog.Portal>) => (
    <BaseUiAlertDialog.Portal {...props} />
  ),
  Backdrop: (props: React.ComponentProps<typeof BaseUiAlertDialog.Backdrop>) => (
    <BaseUiAlertDialog.Backdrop {...props} className={styles.Backdrop} />
  ),
  Popup: (props: React.ComponentProps<typeof BaseUiAlertDialog.Popup>) => (
    <BaseUiAlertDialog.Popup {...props} className={styles.Popup} />
  ),
  Title: (props: React.ComponentProps<typeof BaseUiAlertDialog.Title>) => (
    <BaseUiAlertDialog.Title {...props} className={styles.Title} />
  ),
  Description: (props: React.ComponentProps<typeof BaseUiAlertDialog.Description>) => (
    <BaseUiAlertDialog.Description {...props} className={styles.Description} />
  ),
  Close: (props: React.ComponentProps<typeof BaseUiAlertDialog.Close>) => (
    <BaseUiAlertDialog.Close {...props} className={styles.Button} />
  ),
  Actions: (props: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props} className={styles.Actions} />
  ),
  Confirm: (props: ConfirmDialogProps) => {
    const {
      triggerButtonMessage: buttonMessage,
      title,
      description,
      onCancel,
      onConfirm,
      confirmButtonMessage,
    } = props
    const [isOpen, setIsOpen] = useState(false)

    function cancelAndClose() {
      onCancel?.()
      setIsOpen(false)
    }

    function confirmAndClose() {
      onConfirm?.()
      setIsOpen(false)
    }

    return (
      <AlertDialog.Root open={isOpen || FORCE_DIALOG_FOR_TESTING} onOpenChange={setIsOpen}>
        <AlertDialog.Trigger data-color="theme">{buttonMessage}</AlertDialog.Trigger>
        <AlertDialog.Portal container={document.getElementById('app-container')}>
          <AlertDialog.Backdrop onClick={() => setIsOpen(false)} />
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
  },
}

type ConfirmDialogProps = {
  triggerButtonMessage: string
  title: string
  description: string
  confirmButtonMessage?: string
  onCancel?: () => void
  onConfirm?: () => void
}
