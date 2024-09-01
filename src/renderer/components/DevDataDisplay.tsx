import { Button, Modal, ModalDialog } from '@mui/joy'
import { useState } from 'react'
import { MdDataObject } from 'react-icons/md'
import { InfoGrid } from './InfoGrid'

type DevDataDisplayProps = {
  data?: object
  icon?: JSX.Element
}

export function DevDataDisplay(props: DevDataDisplayProps) {
  const [debugModal, setDebugModal] = useState(false)
  return (
    <>
      <Button
        variant="outlined"
        style={{
          padding: '0px 8px',
          minWidth: 0,
          minHeight: 0,
          height: 'fit-content',
          marginTop: 'auto',
          marginBottom: 'auto',
        }}
        onClick={() => setDebugModal(true)}
      >
        {props.icon ?? <MdDataObject />}
      </Button>
      <Modal open={debugModal} onClose={() => setDebugModal(false)}>
        <ModalDialog>
          <InfoGrid labelBreakpoints={{ xs: 4 }} data={props.data ?? {}} />
        </ModalDialog>
      </Modal>
    </>
  )
}
