import { useAppState } from '@openhome-ui/state/app-state'
import { Heading } from '@radix-ui/themes'
import { useState } from 'react'
import { Dialog } from '../components/dialog/Dialog'

export default function UpdateMessageModal() {
  const [acknowledged, setAcknowledged] = useState(false)
  const appState = useAppState()

  const newFeatures = appState.new_features_since_update

  return (
    <Dialog.Container
      open={!acknowledged && newFeatures.length > 0}
      onOpenChange={(open) => {
        if (!open) setAcknowledged(true)
      }}
      style={{ maxHeight: '85vh' }}
    >
      <Dialog.Title>OpenHome has been updated!</Dialog.Title>
      <div className="dialog-scroll-container">
        {newFeatures.toReversed().map(({ version, feature_messages }) => (
          <div key={version} style={{ marginTop: 8 }}>
            <Heading size="3">New in {version}:</Heading>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {feature_messages.map((message, i) => (
                <li key={i}>{message}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <Dialog.Actions>
        <Dialog.Close>Ok</Dialog.Close>
      </Dialog.Actions>
    </Dialog.Container>
  )
}
