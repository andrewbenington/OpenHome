import { Dialog as BaseUiDialog } from '@base-ui/react/dialog'
import styles from './Dialog.module.css'

export type DialogContainerProps = React.ComponentProps<typeof BaseUiDialog.Popup> &
  Pick<React.ComponentProps<typeof BaseUiDialog.Root>, 'open' | 'onOpenChange'>

export const Dialog = {
  Root: (props: React.ComponentProps<typeof BaseUiDialog.Root>) => <BaseUiDialog.Root {...props} />,
  Trigger: (props: React.ComponentProps<typeof BaseUiDialog.Trigger>) => (
    <BaseUiDialog.Trigger {...props} />
  ),
  Portal: (props: React.ComponentProps<typeof BaseUiDialog.Portal>) => (
    <BaseUiDialog.Portal container={document.getElementById('app-container')} {...props} />
  ),
  Backdrop: (props: React.ComponentProps<typeof BaseUiDialog.Backdrop>) => (
    <BaseUiDialog.Backdrop {...props} className={styles.Backdrop} />
  ),
  Popup: (props: React.ComponentProps<typeof BaseUiDialog.Popup>) => (
    <BaseUiDialog.Popup
      {...props}
      className={`${props.className} ${styles.Popup} ${styles.ModalPopup}`}
      tabIndex={-1}
    />
  ),
  Container: (props: DialogContainerProps) => {
    const { open, onOpenChange, ...popupProps } = props
    return (
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Popup {...popupProps} />
        </Dialog.Portal>
      </Dialog.Root>
    )
  },
  Title: (props: React.ComponentProps<typeof BaseUiDialog.Title>) => (
    <BaseUiDialog.Title {...props} className={styles.Title} />
  ),
  Description: (props: React.ComponentProps<typeof BaseUiDialog.Description>) => (
    <BaseUiDialog.Description {...props} />
  ),
  Close: (
    props: React.ComponentProps<typeof BaseUiDialog.Close> & { color?: 'destructive' | 'theme' }
  ) => <BaseUiDialog.Close data-color={props.color} {...props} className={styles.Button} />,
  Actions: (props: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props} className={styles.Actions} />
  ),
  Action: (
    props: React.HTMLAttributes<HTMLButtonElement> & { color?: 'destructive' | 'theme' }
  ) => <button data-color={props.color} {...props} className={styles.Button} />,
}
