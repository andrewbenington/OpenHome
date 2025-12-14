import { Dialog } from '@radix-ui/themes'
import { CSSProperties, useState } from 'react'
import { IconType } from 'react-icons'
import { MdDataObject } from 'react-icons/md'
import MiniButton, { MiniButtonProps } from '../components/MiniButton'
import { InfoGrid } from './InfoGrid'

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
      <Dialog.Root open={debugModal} onOpenChange={(open) => !open && setDebugModal(false)}>
        <Dialog.Content style={{ padding: 8, maxWidth: '100%' }} size="4">
          <InfoGrid data={props.data ?? {}} />
        </Dialog.Content>
      </Dialog.Root>
    </>
  )
}
