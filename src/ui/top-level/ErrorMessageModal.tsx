import { ErrorIcon } from '@openhome/ui/components/Icons'
import { ErrorContext } from '@openhome/ui/state/error'
import { Callout, Dialog, Separator } from '@radix-ui/themes'
import { useContext } from 'react'

export default function ErrorMessageModal() {
  const [errorState, dispatchErrorState] = useContext(ErrorContext)

  return (
    <Dialog.Root
      open={!!errorState.messageData}
      onOpenChange={(open) => !open && dispatchErrorState({ type: 'clear_message' })}
    >
      <Dialog.Content
        style={{
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <Dialog.Title mt="2" mb="0">
          {errorState.messageData?.title}
        </Dialog.Title>
        <Separator style={{ width: '100%' }} />
        {errorState.messageData?.messages?.map((msg, i) => (
          <Callout.Root color="tomato" key={`alert_${i}`} size="1">
            <Callout.Icon>
              <ErrorIcon style={{ width: 20, height: 20 }} />
            </Callout.Icon>
            {msg}
          </Callout.Root>
        ))}
      </Dialog.Content>
    </Dialog.Root>
  )
}
