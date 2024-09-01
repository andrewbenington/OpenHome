import { Delete } from '@mui/icons-material'
import { Card, Dialog, DialogActions, Stack, Typography } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { SaveFolder } from 'src/types/storage'

async function loadSaveFolders(): Promise<SaveFolder[]> {
  return await window.electron.ipcRenderer.invoke('read-save-folders')
}

async function pickFolder(): Promise<string | undefined> {
  return await window.electron.ipcRenderer.invoke('pick-save-folder')
}

async function upsertFolder(folderPath: string, label: string) {
  await window.electron.ipcRenderer.invoke('upsert-save-folder', folderPath, label)
}

async function invokeRemoveFolder(folderPath: string) {
  await window.electron.ipcRenderer.invoke('remove-save-folder', folderPath)
}

export default function SaveFolders() {
  const [saveFolders, setSaveFolders] = useState<SaveFolder[]>()
  const [pendingDirPath, setPendingDirPath] = useState<string>()

  useEffect(() => {
    loadSaveFolders().then((folders) => setSaveFolders(folders))
  }, [])

  const refreshFolders = useCallback(
    () => loadSaveFolders().then((folders) => setSaveFolders(folders)),
    []
  )

  const addFolder = useCallback(
    () => pickFolder().then((path) => path && setPendingDirPath(path)),
    []
  )

  const removeFolder = useCallback(
    (path: string) => invokeRemoveFolder(path).then(() => refreshFolders()),
    []
  )

  return (
    <div>
      <Typography>Save Folders</Typography>
      <button onClick={addFolder}>Add Folder</button>
      <Stack>
        {saveFolders?.map((folder) => (
          <Card key={folder.path}>
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
                <Delete />
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
    <Dialog open={open} onClose={() => onClose()}>
      <label style={{ margin: 8 }}>
        Folder Label
        <input value={label} onChange={(e) => setLabel(e.target.value)}></input>
      </label>

      <DialogActions>
        <button onClick={() => onClose()}>Cancel</button>
        <button onClick={() => submitLabel(label)}>Save</button>
      </DialogActions>
    </Dialog>
  )
}
