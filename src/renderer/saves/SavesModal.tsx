import { Grid, List, ListItemButton } from '@mui/joy'
import { useMemo, useState } from 'react'
import 'react-data-grid/lib/styles.css'
import { ParsedPath } from 'src/types/SAVTypes/path'
import { buildSaveFile } from '../../types/SAVTypes/util'
import { useAppDispatch } from '../redux/hooks'
import { useLookupMaps, useRecentSaves } from '../redux/selectors'
import { addSave } from '../redux/slices/appSlice'
import RecentSaves from './RecentSaves'
import SaveFolders from './SaveFolders'
import SuggestedSaves from './SuggestedSaves'

interface SavesModalProps {
  onClose: () => void
}

const SavesModal = (props: SavesModalProps) => {
  const { onClose } = props
  const [, upsertRecentSave] = useRecentSaves()
  const [homeMonMap, gen12LookupMap, gen345LookupMap] = useLookupMaps()
  const dispatch = useAppDispatch()
  const [tab, setTab] = useState('recents')

  const openSaveFile = async (filePath?: ParsedPath) => {
    const { path, fileBytes, createdDate } = await window.electron.ipcRenderer.invoke(
      'read-save-file',
      filePath && [filePath]
    )
    if (!filePath) {
      filePath = path
    }
    if (filePath && fileBytes && homeMonMap) {
      const saveFile = buildSaveFile(filePath, fileBytes, {
        homeMonMap,
        gen12LookupMap,
        gen345LookupMap,
        fileCreatedDate: createdDate,
      })
      if (!saveFile) {
        onClose()
        return
      }
      onClose()
      upsertRecentSave(saveFile)
      dispatch(addSave(saveFile))
    }
  }

  const gridComponent = useMemo(() => {
    switch (tab) {
      case 'suggested':
        return <SuggestedSaves onOpen={openSaveFile} />
      case 'recents':
        return <RecentSaves onOpen={openSaveFile} />
      default:
        return <SaveFolders />
    }
  }, [tab, openSaveFile])

  return (
    <Grid container style={{ height: '100%' }}>
      <Grid xs={2}>
        <List>
          <button onClick={() => openSaveFile()} style={{ margin: 8, width: 'calc(100% - 16px)' }}>
            Open File
          </button>
          <ListItemButton selected={tab === 'recents'} onClick={() => setTab('recents')}>
            Recents
          </ListItemButton>
          <ListItemButton selected={tab === 'suggested'} onClick={() => setTab('suggested')}>
            Suggested
          </ListItemButton>
          <ListItemButton selected={tab === 'save-folders'} onClick={() => setTab('save-folders')}>
            Save Folders
          </ListItemButton>
        </List>
      </Grid>
      <Grid xs={10} style={{ height: '100%' }}>
        <div
          style={{
            height: 'calc(100% - 16px)',
            overflowY: 'scroll',
            paddingTop: 8,
            paddingBottom: 8,
          }}
        >
          {gridComponent}
        </div>
      </Grid>
    </Grid>
  )
}

export default SavesModal
