import { Button, Tab, tabClasses, TabList, TabPanel, Tabs } from '@mui/joy'
import * as E from 'fp-ts/lib/Either'
import { useCallback, useContext } from 'react'
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

  return (
    <Tabs
      defaultValue="recents"
      orientation="vertical"
      sx={{ height: '100%', borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }}
    >
      <TabList
        variant="solid"
        color="primary"
        disableUnderline
        sx={{
          whiteSpace: 'nowrap',
          p: 0.8,
          gap: 0.5,
          [`& .${tabClasses.root}`]: {
            borderRadius: 'lg',
          },
          [`& .${tabClasses.root}[aria-selected="true"]`]: {
            boxShadow: 'sm',
          },
          borderTopLeftRadius: 8,
          borderBottomLeftRadius: 8,
        }}
      >
        <Button
          onClick={() => openSaveFile()}
          style={{ margin: 8, width: 'calc(100% - 16px)' }}
          color="primary"
          variant="soft"
        >
          Open File
        </Button>
        <Tab disableIndicator value={'recents'} variant="solid" color="primary">
          Recents
        </Tab>
        <Tab disableIndicator value={'suggested'} variant="solid" color="primary">
          Suggested
        </Tab>
        <Tab disableIndicator value={'folders'} variant="solid" color="primary">
          Save Folders
        </Tab>
      </TabList>
      <TabPanel value="recents">
        <RecentSaves onOpen={openSaveFile} />
      </TabPanel>
      <TabPanel value="suggested">
        <SuggestedSaves onOpen={openSaveFile} />
      </TabPanel>
      <TabPanel value="folders">
        <SaveFolders />
      </TabPanel>
    </Tabs>
  )
}

export default SavesModal
