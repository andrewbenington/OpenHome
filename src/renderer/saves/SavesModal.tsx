import { Grid, List, ListItemButton } from '@mui/joy'
import * as E from 'fp-ts/lib/Either'
import { useCallback, useContext, useMemo, useState } from 'react'
import 'react-data-grid/lib/styles.css'
import { ParsedPath } from 'src/types/SAVTypes/path'
import { buildSaveFile } from '../../types/SAVTypes/util'
import { BackendContext } from '../backend/backendProvider'
import { LookupContext } from '../state/lookup'
import { OpenSavesContext } from '../state/openSaves'
import RecentSaves from './RecentSaves'
import SaveFolders from './SaveFolders'
import SuggestedSaves from './SuggestedSaves'

interface SavesModalProps {
  onClose: () => void
}

const SavesModal = (props: SavesModalProps) => {
  const { onClose } = props
  const backend = useContext(BackendContext)
  const [, dispatchOpenSaves] = useContext(OpenSavesContext)
  const [lookupState] = useContext(LookupContext)
  const [tab, setTab] = useState('recents')

  const openSaveFile = useCallback(
    async (filePath?: ParsedPath) => {
      backend.loadSaveFile(filePath).then(
        E.match(
          (err) => console.error(err),
          ({ path, fileBytes, createdDate }) => {
            if (!filePath) {
              filePath = path
            }
            if (filePath && fileBytes && lookupState.loaded) {
              const saveFile = buildSaveFile(filePath, fileBytes, {
                homeMonMap: lookupState.homeMons,
                gen12LookupMap: lookupState.gen12,
                gen345LookupMap: lookupState.gen345,
                fileCreatedDate: createdDate,
              })
              if (!saveFile) {
                onClose()
                return
              }
              onClose()
              backend.addRecentSave(saveFile.getSaveRef())
              dispatchOpenSaves({ type: 'add_save', payload: saveFile })
            }
          }
        )
      )
    },
    [backend, dispatchOpenSaves, lookupState, onClose]
  )

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
