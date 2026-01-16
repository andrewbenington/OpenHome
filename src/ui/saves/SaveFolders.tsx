import { SaveFolder } from '@openhome-core/save/util/storage'
import { R } from '@openhome-core/util/functional'
import { BackendContext } from '@openhome-ui/backend/backendContext'
import { AddFolderIcon, RemoveIcon } from '@openhome-ui/components/Icons'
import useDisplayError from '@openhome-ui/hooks/displayError'
import { Button, Card, Dialog, Flex } from '@radix-ui/themes'
import { useCallback, useContext, useEffect, useState } from 'react'

export default function SaveFolders() {
  const [saveFolders, setSaveFolders] = useState<SaveFolder[]>()
  const [pendingDirPath, setPendingDirPath] = useState<string>()
  const backend = useContext(BackendContext)
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
    refreshFolders()
  }, [error, refreshFolders, saveFolders])

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
            refreshFolders()
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
        <Button onClick={addFolder} variant="solid">
          <AddFolderIcon />
          Add Folder
        </Button>
      </div>
      <Flex overflowY="auto" height="100%" direction="column" gap="1">
        {saveFolders?.map((folder) => (
          <Card key={folder.path}>
            <Flex direction="row" gap="4" align="center">
              <b>{folder.label ?? folder.path}</b>
              <div style={{ color: '#666' }}>{folder.path}</div>
              <button
                style={{
                  padding: 0,
                  display: 'grid',
                  marginLeft: 'auto',
                  marginTop: 'auto',
                  marginBottom: 'auto',
                  backgroundColor: '#aa0000',
                  height: 'fit-content',
                  color: 'white',
                }}
                onClick={() => removeFolder(folder.path)}
              >
                <RemoveIcon />
              </button>
            </Flex>
          </Card>
        ))}
      </Flex>
      <FolderLabelDialog
        open={!!pendingDirPath}
        onClose={() => setPendingDirPath(undefined)}
        submitLabel={(label) => {
          if (pendingDirPath) {
            upsertFolder(pendingDirPath, label).then(() => {
              setPendingDirPath(undefined)
              refreshFolders()
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
  submitLabel: (label: string) => void
}

function FolderLabelDialog(props: FolderLabelDialogProps) {
  const { open, submitLabel, onClose } = props
  const [label, setLabel] = useState('')

  return (
    <Dialog.Root open={open} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Content
        style={{
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
        width="300px"
      >
        <Dialog.Title mt="2" mb="0">
          Set Folder Label
        </Dialog.Title>
        <input placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
        <Flex direction="row" gap="2" justify="end">
          <Button
            variant="outline"
            onClick={() => {
              setLabel('')
              onClose()
            }}
          >
            Cancel
          </Button>
          <Button
            style={{ padding: '0px 16px' }}
            onClick={() => {
              submitLabel(label)
              setLabel('')
            }}
          >
            Save
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  )
}
