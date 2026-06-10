import { Popover as BaseUiPopover } from '@base-ui/react/popover'
import * as React from 'react'
import { ReactNode, useState } from 'react'
import styles from './Popover.module.css'

type PopupContainerProps = React.ComponentProps<typeof BaseUiPopover.Popup> & {
  trigger: (open: boolean, setOpen: (value: boolean) => void) => ReactNode
}

export const Popover = {
  Root: (props: React.ComponentProps<typeof BaseUiPopover.Root>) => (
    <BaseUiPopover.Root {...props} />
  ),
  Trigger: (props: React.ComponentProps<typeof BaseUiPopover.Trigger>) => (
    <BaseUiPopover.Trigger className={styles.Trigger} {...props} />
  ),
  Portal: (props: React.ComponentProps<typeof BaseUiPopover.Portal>) => (
    <BaseUiPopover.Portal container={document.getElementById('app-container')} {...props} />
  ),
  Backdrop: (props: React.ComponentProps<typeof BaseUiPopover.Backdrop>) => (
    <BaseUiPopover.Backdrop {...props} className={styles.Backdrop} />
  ),
  Popup: (props: React.ComponentProps<typeof BaseUiPopover.Popup>) => (
    <BaseUiPopover.Popup
      {...props}
      className={`${props.className} ${styles.Popup} ${styles.ModalPopup}`}
      tabIndex={-1}
    />
  ),
  Container: (props: PopupContainerProps) => {
    const [open, setOpen] = useState(false)
    const { trigger, ...popupProps } = props
    return (
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger>{trigger(open, setOpen)}</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner sideOffset={8}>
            <Popover.Popup className={styles.Popup} {...popupProps} />
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    )
  },
  Title: (props: React.ComponentProps<typeof BaseUiPopover.Title>) => (
    <BaseUiPopover.Title {...props} className={styles.Title} />
  ),
  Description: (props: React.ComponentProps<typeof BaseUiPopover.Description>) => (
    <BaseUiPopover.Description {...props} />
  ),
  Close: (
    props: React.ComponentProps<typeof BaseUiPopover.Close> & { color?: 'destructive' | 'theme' }
  ) => <BaseUiPopover.Close data-color={props.color} {...props} className={styles.Button} />,
  Actions: (props: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props} className={styles.Actions} />
  ),
  Action: (
    props: React.HTMLAttributes<HTMLButtonElement> & { color?: 'destructive' | 'theme' }
  ) => <button data-color={props.color} {...props} className={styles.Button} />,
  Arrow: (props: React.ComponentProps<typeof BaseUiPopover.Arrow>) => (
    <BaseUiPopover.Arrow {...props} className={styles.Arrow} />
  ),
  Positioner: (props: React.ComponentProps<typeof BaseUiPopover.Positioner>) => (
    <BaseUiPopover.Positioner {...props} />
  ),
}
