import { useAppState } from '@openhome-ui/state/app-state'
import { Button, Dialog, Flex, Heading, ScrollArea, Separator } from '@radix-ui/themes'
import { useState } from 'react'

export type UpdateMessageModalProps = {
  version: string
}

export default function UpdateMessageModal() {
  const [acknowledged, setAcknowledged] = useState(false)
  const appState = useAppState()

  return (
    <Dialog.Root
      open={!acknowledged && appState.new_features_since_update.length > 0}
      onOpenChange={(open) => {
        if (!open) setAcknowledged(true)
      }}
    >
      <Dialog.Content
        maxHeight="85vh"
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: 8,
        }}
      >
        <Dialog.Title mt="2" mb="0">
          OpenHome has been updated!
        </Dialog.Title>
        <Separator style={{ width: '100%', marginTop: 8 }} />
        <ScrollArea>
          {appState.new_features_since_update.toReversed().map(({ version, feature_messages }) => (
            <div key={version} style={{ marginTop: 8 }}>
              <Heading size="3">New in {version}:</Heading>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {feature_messages.map((message, i) => (
                  <li key={i}>{message}</li>
                ))}
              </ul>
            </div>
          ))}
        </ScrollArea>
        <Flex justify="center">
          <Dialog.Close>
            <Button style={{ width: 120 }}>Ok</Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  )
}
