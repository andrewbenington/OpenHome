import useBackend from '@openhome-core/backend/useBackend'
import { SaveFolder } from '@openhome-core/save/util/storage'
import { R } from '@openhome-core/util/functional'
import { AddFolderIcon } from '@openhome-ui/components/Icons'
import OhoButton from '@openhome-ui/components/OhoButton'
import { useDisplayError } from '@openhome-ui/hooks/displayError'
import { Card, Flex } from '@radix-ui/themes'
import { useCallback, useEffect, useState } from 'react'
import { Dialog } from '../components/dialog/Dialog'

export default function SaveFolders() {
  const [saveFolders, setSaveFolders] = useState<SaveFolder[]>()
  const [pendingDirPath, setPendingDirPath] = useState<string>()
  const backend = useBackend()
  const [error, setError] = useState(false)
  const displayError = useDisplayError()

  const handleError = useCallback(
    (title: string, messages: string | string[]) => {
      setError(true)
      displayError(title, messages)
    },
    [displayError]
  )

  const refreshFolders = useCallback(
    () =>
      backend.getSaveFolders().then(
        R.match(
          (folders) => {
            setError(false)
            setSaveFolders(folders)
          },
          (err) => handleError('Error getting save folders', err)
        )
      ),
    [backend, handleError]
  )

  useEffect(() => {
    if (error || saveFolders) return
    refreshFolders().catch((err) => handleError('Error getting save folders', err))
  }, [error, refreshFolders, saveFolders, handleError])

  const addFolder = useCallback(
    () =>
      backend.pickFolder().then(
        R.match(
          (dir) => setPendingDirPath(dir),
          (err) => handleError('Error picking folder', err)
        )
      ),
    [backend, handleError]
  )

  const removeFolder = useCallback(
    (path: string) =>
      backend.removeSaveFolder(path).then(
        R.match(
          () => refreshFolders(),
          async (err) => handleError('Error removing folder', err)
        )
      ),
    [backend, refreshFolders, handleError]
  )

  const upsertFolder = useCallback(
    (path: string, label: string) =>
      backend.upsertSaveFolder(path, label).then(
        R.match(
          async () => {
            setPendingDirPath(undefined)
            await refreshFolders()
          },
          async (err) => handleError('Error saving folder', err)
        )
      ),
    [backend, refreshFolders, handleError]
  )

  return (
    <div style={{ padding: 8 }}>
      <div
        style={{
          width: '100%',
          display: 'grid',
          justifyContent: 'right',
          marginBottom: 8,
        }}
      >
        <OhoButton onClickAsync={addFolder} variant="solid" color="red">
          <AddFolderIcon />
          Add Folder
        </OhoButton>
      </div>
      <Flex overflowY="auto" height="100%" direction="column" gap="1">
        {saveFolders?.map((folder) => (
          <Card key={folder.path}>
            <Flex direction="row" gap="4" align="center">
              <b>{folder.label ?? folder.path}</b>
              <div style={{ color: '#666' }}>{folder.path}</div>
              <OhoButton
                iconOnly
                variant="solid"
                type="delete"
                onClickAsync={() => removeFolder(folder.path)}
              />
            </Flex>
          </Card>
        ))}
      </Flex>
      <FolderLabelDialog
        open={!!pendingDirPath}
        onClose={() => setPendingDirPath(undefined)}
        submitLabel={async (label) => {
          if (pendingDirPath) {
            await upsertFolder(pendingDirPath, label).then(async () => {
              setPendingDirPath(undefined)
              await refreshFolders()
            })
          }
        }}
      />
    </div>
  )
}

type FolderLabelDialogProps = {
  open: boolean
  onClose: () => void
  submitLabel: (label: string) => Promise<void>
}

function FolderLabelDialog(props: FolderLabelDialogProps) {
  const { open, submitLabel, onClose } = props
  const [label, setLabel] = useState('')

  async function onSave() {
    await submitLabel(label)
    setLabel('')
  }

  return (
    <Dialog.Container open={open} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Title>Set Folder Label</Dialog.Title>
      <input
        placeholder="Label"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        style={{ width: '100%' }}
      />
      <Dialog.Actions>
        <Dialog.Close>Cancel</Dialog.Close>
        <Dialog.Close type="submit" onClickAsync={onSave}>
          Save
        </Dialog.Close>
      </Dialog.Actions>
    </Dialog.Container>
  )
}
