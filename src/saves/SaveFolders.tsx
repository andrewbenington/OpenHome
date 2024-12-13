import {
  Button,
  Card,
  DialogActions,
  DialogTitle,
  Modal,
  ModalDialog,
  Stack,
  Typography,
} from '@mui/joy'
import * as E from 'fp-ts/lib/Either'
import { useCallback, useContext, useEffect, useState } from 'react'
import { SaveFolder } from 'src/types/storage'
import { BackendContext } from '../backend/backendProvider'
import { AddFolderIcon, RemoveIcon } from '../components/Icons'

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
    (path: string) =>
      backend.removeSaveFolder(path).then(
        E.match(
          async (err) => {
            setError(err)
          },
          () => refreshFolders()
        )
      ),
    [backend, refreshFolders]
  )

  const upsertFolder = useCallback(
    (path: string, label: string) =>
      backend.upsertSaveFolder(path, label).then(
        E.match(
          async (err) => {
            setError(err)
          },
          () => {
            setPendingDirPath(undefined)
            refreshFolders()
          }
        )
      ),
    [backend, refreshFolders]
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
                }}
                onClick={() => removeFolder(folder.path)}
              >
                <RemoveIcon />
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
      <ModalDialog style={{ padding: 8 }}>
        <DialogTitle>Set Folder Label</DialogTitle>
        <input placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
        <DialogActions>
          <Button
            color="secondary"
            style={{ padding: '0px 16px' }}
            onClick={() => {
              submitLabel(label)
              setLabel('')
            }}
          >
            Save
          </Button>
          <Button
            style={{ padding: '0px 16px' }}
            variant="outlined"
            color="neutral"
            onClick={() => {
              setLabel('')
              onClose()
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </ModalDialog>
    </Modal>
  )
}
