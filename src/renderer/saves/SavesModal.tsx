import {
  Button,
  Slider,
  Tab,
  tabClasses,
  TabList,
  TabPanel,
  Tabs,
  ToggleButtonGroup,
} from '@mui/joy'
import * as E from 'fp-ts/lib/Either'
import { useCallback, useContext, useState } from 'react'
import 'react-data-grid/lib/styles.css'
import { ParsedPath } from 'src/types/SAVTypes/path'
import { getSaveRef } from '../../types/SAVTypes/SAV'
import { buildSaveFile } from '../../types/SAVTypes/load'
import { BackendContext } from '../backend/backendProvider'
import { CardsIcon, GridIcon } from '../components/Icons'
import { AppInfoContext } from '../state/appInfo'
import { LookupContext } from '../state/lookup'
import { OpenSavesContext } from '../state/openSaves'
import RecentSaves from './RecentSaves'
import SaveFolders from './SaveFolders'
import SuggestedSaves from './SuggestedSaves'
import { SaveViewMode } from './util'

interface SavesModalProps {
  onClose: () => void
}

const SavesModal = (props: SavesModalProps) => {
  const { onClose } = props
  const backend = useContext(BackendContext)
  const [, dispatchOpenSaves] = useContext(OpenSavesContext)
  const [lookupState] = useContext(LookupContext)
  const [appInfo] = useContext(AppInfoContext)
  const [viewMode, setViewMode] = useState<SaveViewMode>('cards')
  const [cardSize, setCardSize] = useState<number>(180)

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
              const saveFile = buildSaveFile(
                filePath,
                fileBytes,
                {
                  homeMonMap: lookupState.homeMons,
                  gen12LookupMap: lookupState.gen12,
                  gen345LookupMap: lookupState.gen345,
                  fileCreatedDate: createdDate,
                },
                appInfo.settings.allSaveTypes.filter(
                  (saveType) => appInfo.settings.enabledSaveTypes[saveType.name]
                ),
                (updatedMon) => backend.writeHomeMon(updatedMon.bytes)
              )
              if (!saveFile) {
                onClose()
                return
              }
              onClose()
              backend.addRecentSave(getSaveRef(saveFile))
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
        <div style={{ flex: 1 }} />
        {viewMode === 'cards' && (
          <label>
            Icon Size
            <Slider
              value={cardSize}
              onChange={(_, newSize) => setCardSize(newSize as number)}
              valueLabelDisplay="auto"
              min={100}
              max={500}
              style={{ paddingTop: 0, paddingBottom: 30 }}
            />
          </label>
        )}
        <ToggleButtonGroup
          value={viewMode}
          onChange={(_, newValue) => setViewMode(newValue as SaveViewMode)}
          color="secondary"
          variant="soft"
          style={{ width: '100%' }}
        >
          <Button value="cards" color="secondary" variant="soft" fullWidth>
            <CardsIcon />
          </Button>
          <Button value="grid" color="secondary" variant="soft" fullWidth>
            <GridIcon />
          </Button>
        </ToggleButtonGroup>
      </TabList>
      <TabPanel value="recents">
        <RecentSaves onOpen={openSaveFile} view={viewMode} cardSize={cardSize} />
      </TabPanel>
      <TabPanel value="suggested">
        <SuggestedSaves onOpen={openSaveFile} view={viewMode} cardSize={cardSize} />
      </TabPanel>
      <TabPanel value="folders">
        <SaveFolders />
      </TabPanel>
    </Tabs>
  )
}

export default SavesModal
