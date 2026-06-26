import { AlertDialog } from '@openhome-ui/components/dialog/AlertDialog'
import { ErrorIcon } from '@openhome-ui/components/Icons'
import { ErrorContext } from '@openhome-ui/state/error'
import { Callout } from '@radix-ui/themes'
import { useContext } from 'react'

export default function ErrorMessageModal() {
  const [errorState, dispatchErrorState] = useContext(ErrorContext)

  return (
    <AlertDialog.Root
      open={!!errorState.messageData}
      onOpenChange={(open) => !open && dispatchErrorState({ type: 'clear_message' })}
    >
      <AlertDialog.Portal>
        <AlertDialog.Backdrop onClick={() => dispatchErrorState({ type: 'clear_message' })} />
        <AlertDialog.Popup>
          <AlertDialog.Title>{errorState.messageData?.title}</AlertDialog.Title>
          {errorState.messageData?.messages?.map((msg, i) => (
            <Callout.Root color="tomato" key={`alert_${i}`} size="1">
              <Callout.Icon>
                <ErrorIcon style={{ width: 20, height: 20 }} />
              </Callout.Icon>
              {msg}
            </Callout.Root>
          ))}
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
