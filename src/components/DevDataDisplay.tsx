import { Modal, ModalClose, ModalDialog, ModalOverflow } from '@mui/joy'
import { CSSProperties, useState } from 'react'
import { IconType } from 'react-icons'
import { MdDataObject } from 'react-icons/md'
import { InfoGrid } from './InfoGrid'
import MiniButton from './MiniButton'

type DevDataDisplayProps = {
  data?: object
  icon?: IconType
  style?: CSSProperties
}

export function DevDataDisplay(props: DevDataDisplayProps) {
  const [debugModal, setDebugModal] = useState(false)

  return (
    <>
      <MiniButton
        onClick={() => setDebugModal(true)}
        icon={props.icon ?? MdDataObject}
        style={props.style}
        tabIndex={-1}
      />
      <Modal open={debugModal} onClose={() => setDebugModal(false)}>
        <ModalOverflow>
          <ModalDialog minWidth="lg">
            <ModalClose />
            <InfoGrid labelBreakpoints={{ xs: 4 }} data={props.data ?? {}} />
          </ModalDialog>
        </ModalOverflow>
      </Modal>
    </>
  )
}
