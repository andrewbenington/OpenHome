import {
  Alert,
  DialogContent,
  DialogTitle,
  Divider,
  Modal,
  ModalClose,
  ModalDialog,
} from '@mui/joy'
import { useContext } from 'react'
import { ErrorIcon } from 'src/components/Icons'
import { ErrorContext } from '../state/error'

export default function ErrorMessageModal() {
  const [errorState, dispatchErrorState] = useContext(ErrorContext)

  return (
    <Modal
      open={!!errorState.messageData}
      onClose={() => dispatchErrorState({ type: 'clear_message' })}
    >
      <ModalDialog style={{ padding: 8 }}>
        <ModalClose />
        <DialogTitle>{errorState.messageData?.title}</DialogTitle>
        <Divider />
        <DialogContent>
          {errorState.messageData?.messages?.map((msg, i) => (
            <Alert
              startDecorator={<ErrorIcon style={{ width: 20, height: 20 }} />}
              color="danger"
              size="sm"
              variant="solid"
              key={`alert_${i}`}
            >
              {msg}
            </Alert>
          ))}
        </DialogContent>
      </ModalDialog>
    </Modal>
  )
}
