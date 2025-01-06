import { Alert } from '@mui/joy'
import { Dialog, Separator } from '@radix-ui/themes'
import { useContext } from 'react'
import { ErrorIcon } from 'src/components/Icons'
import { ErrorContext } from '../state/error'

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
          <Alert
            startDecorator={<ErrorIcon style={{ width: 20, height: 20 }} />}
            color="danger"
            size="lg"
            sx={{ padding: 1, fontWeight: 'bold' }}
            variant="solid"
            key={`alert_${i}`}
          >
            {msg}
          </Alert>
        ))}
      </Dialog.Content>
    </Dialog.Root>
  )
}
