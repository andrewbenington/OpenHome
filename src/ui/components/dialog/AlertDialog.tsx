import { AlertDialog as BaseUiAlertDialog } from '@base-ui/react/alert-dialog'
import styles from './Dialog.module.css'

export type AlertDialogContainerProps = React.ComponentProps<typeof BaseUiAlertDialog.Popup> &
  Pick<React.ComponentProps<typeof BaseUiAlertDialog.Root>, 'open' | 'onOpenChange'>

export const AlertDialog = {
  Root: (props: React.ComponentProps<typeof BaseUiAlertDialog.Root>) => (
    <BaseUiAlertDialog.Root {...props} />
  ),
  Trigger: (props: React.ComponentProps<typeof BaseUiAlertDialog.Trigger>) => (
    <BaseUiAlertDialog.Trigger {...props} className={styles.Button} />
  ),
  Portal: (props: React.ComponentProps<typeof BaseUiAlertDialog.Portal>) => (
    <BaseUiAlertDialog.Portal container={document.getElementById('app-container')} {...props} />
  ),
  Backdrop: (props: React.ComponentProps<typeof BaseUiAlertDialog.Backdrop>) => (
    <BaseUiAlertDialog.Backdrop {...props} className={styles.Backdrop} />
  ),
  Popup: (props: React.ComponentProps<typeof BaseUiAlertDialog.Popup>) => (
    <BaseUiAlertDialog.Popup {...props} className={styles.Popup} />
  ),
  Container: (props: AlertDialogContainerProps) => {
    const { open, onOpenChange, ...popupProps } = props
    return (
      <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop />
          <AlertDialog.Popup {...popupProps} />
        </AlertDialog.Portal>
      </AlertDialog.Root>
    )
  },
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
}
