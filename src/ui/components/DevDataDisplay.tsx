import { CSSProperties, useState } from 'react'
import { IconType } from 'react-icons'
import { MdDataObject } from 'react-icons/md'
import MiniButton, { MiniButtonProps } from '../components/MiniButton'
import { InfoGrid } from './InfoGrid'
import { Dialog } from './dialog/Dialog'

type DevDataDisplayProps = {
  data?: object
  icon?: IconType
  style?: CSSProperties
} & MiniButtonProps

export function DevDataDisplay(props: DevDataDisplayProps) {
  const [debugModal, setDebugModal] = useState(false)

  return (
    <>
      <MiniButton
        onClick={() => setDebugModal(true)}
        icon={props.icon ?? MdDataObject}
        style={props.style}
        tabIndex={-1}
        {...props}
      />
      <Dialog.Container
        open={debugModal}
        onOpenChange={(open) => !open && setDebugModal(false)}
        style={{ width: '80%', maxHeight: '90%', overflow: 'auto' }}
      >
        <InfoGrid data={props.data ?? {}} />
      </Dialog.Container>
    </>
  )
}
