import { Button, Card, DialogActions, Modal, ModalDialog, Stack, Typography } from '@mui/joy'
import * as E from 'fp-ts/lib/Either'
import { useCallback, useContext, useEffect, useState } from 'react'
import { MdDelete } from 'react-icons/md'
import { SaveFolder } from 'src/types/storage'
import { BackendContext } from '../backend/backendProvider'
import { AddFolderIcon } from '../components/Icons'

async function upsertFolder(folderPath: string, label: string) {
  await window.electron.ipcRenderer.invoke('upsert-save-folder', folderPath, label)
}

async function invokeRemoveFolder(folderPath: string) {
  await window.electron.ipcRenderer.invoke('remove-save-folder', folderPath)
}

export default function SaveFolders() {
  const [saveFolders, setSaveFolders] = useState<SaveFolder[]>()
  const [pendingDirPath, setPendingDirPath] = useState<string>()
  const backend = useContext(BackendContext)
  const [error, setError] = useState<string>()

  useEffect(() => {
    backend.getSaveFolders().then(
      E.match(
        (err) => setError(err),
        (folders) => setSaveFolders(folders)
      )
    )
  }, [backend])

  const refreshFolders = useCallback(
    () =>
      backend.getSaveFolders().then(
        E.match(
          (err) => setError(err),
          (folders) => setSaveFolders(folders)
        )
      ),
    [backend]
  )

  const addFolder = useCallback(
    () =>
      backend.pickFolder().then(
        E.match(
          (err) => setError(err),
          (dir) => setPendingDirPath(dir)
        )
      ),
    [backend]
  )

  const removeFolder = useCallback(
    (path: string) => invokeRemoveFolder(path).then(() => refreshFolders()),
    [refreshFolders]
  )

  return (
    <div>
      <div
        style={{
          width: '100%',
          display: 'grid',
          justifyContent: 'right',
          marginBottom: 8,
        }}
      >
        <Button
          onClick={addFolder}
          color="secondary"
          variant="solid"
          sx={{ padding: 1, '& svg': { width: 20, height: 20 } }}
        >
          <AddFolderIcon style={{ marginRight: 8 }} /> Add Folder
        </Button>
      </div>
      <Stack style={{ overflowY: 'auto', height: '100%' }}>
        {saveFolders?.map((folder) => (
          <Card key={folder.path} color="primary" variant="soft">
            <Stack direction="row">
              <div>{folder.label ?? folder.path}</div>
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
                }}
                onClick={() => removeFolder(folder.path)}
              >
                <MdDelete />
              </button>
            </Stack>
          </Card>
        ))}
      </Stack>
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
      <Modal open={!!error} onClose={() => setError(undefined)}>
        <ModalDialog>
          <Typography>{error}</Typography>
          <DialogActions>
            <button onClick={() => setError(undefined)}>OK</button>
          </DialogActions>
        </ModalDialog>
      </Modal>
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
    <Modal open={open} onClose={() => onClose()}>
      <ModalDialog>
        <label style={{ margin: 8 }}>
          Folder Label
          <input value={label} onChange={(e) => setLabel(e.target.value)}></input>
        </label>

        <DialogActions>
          <button onClick={() => onClose()}>Cancel</button>
          <button onClick={() => submitLabel(label)}>Save</button>
        </DialogActions>
      </ModalDialog>
    </Modal>
  )
}
