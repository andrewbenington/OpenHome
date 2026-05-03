import { AlertDialog as BaseUiAlertDialog } from '@base-ui/react/alert-dialog'
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
}
