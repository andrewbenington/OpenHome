import { Dialog } from '@openhome-ui/components/dialog/Dialog'
import { ErrorIcon } from '@openhome-ui/components/Icons'
import { InfoGrid } from '@openhome-ui/components/InfoGrid'
import OhoFlex from '@openhome-ui/components/OhoFlex'
import { ErrorContext } from '@openhome-ui/state/error'
import { Callout } from '@radix-ui/themes'
import { useContext } from 'react'

export default function ErrorMessageModal() {
  const [errorState, dispatchErrorState] = useContext(ErrorContext)

  const dismiss = () => dispatchErrorState({ type: 'clear_message' })

  return (
    <Dialog.Root open={!!errorState.messageData} onOpenChange={(open) => !open && dismiss()}>
      <Dialog.Portal>
        <Dialog.Backdrop onClick={dismiss} />
        <Dialog.Popup>
          <Dialog.Title>{errorState.messageData?.title}</Dialog.Title>
          <OhoFlex.ColFullHeight gap="0">
            {errorState.messageData?.messages?.map((msg, i) => (
              <Callout.Root color="tomato" key={`alert_${i}`} size="1">
                <Callout.Icon>
                  <ErrorIcon style={{ width: 20, height: 20 }} />
                </Callout.Icon>
                {msg}
              </Callout.Root>
            ))}
            {errorState.messageData && <InfoGrid data={errorState.messageData.data} />}
          </OhoFlex.ColFullHeight>
          <Dialog.Actions>
            <Dialog.Close onClick={dismiss}>Ok</Dialog.Close>
          </Dialog.Actions>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
