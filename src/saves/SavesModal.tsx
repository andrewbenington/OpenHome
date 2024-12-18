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
import { ErrorContext } from 'src/state/error'
import { PathData } from 'src/types/SAVTypes/path'
import { SAVClass } from 'src/types/SAVTypes/util'
import { getMonFileIdentifier } from 'src/util/Lookup'
import { BackendContext } from '../backend/backendProvider'
import { CardsIcon, GridIcon } from '../components/Icons'
import { AppInfoContext } from '../state/appInfo'
import { LookupContext } from '../state/lookup'
import { OpenSavesContext } from '../state/openSaves'
import { getSaveRef } from '../types/SAVTypes/SAV'
import { buildSaveFile, getSaveType } from '../types/SAVTypes/load'
import RecentSaves from './RecentSaves'
import SaveFolders from './SaveFolders'
import SuggestedSaves from './SuggestedSaves'
import { SaveViewMode } from './util'

interface SavesModalProps {
  onClose: () => void
  setSpecifySave: React.Dispatch<
    React.SetStateAction<{
      supportedSaveTypes: SAVClass[]
      plugins: string[]
      onSelect?: (plugin: string) => void
    } | null>
  >
}

function waitForPluginSelection(
  setSpecifySave: React.Dispatch<
    React.SetStateAction<{
      supportedSaveTypes: SAVClass[]
      plugins: string[]
      onSelect?: (plugin: string) => void
    } | null>
  >
): Promise<SAVClass | undefined> {
  return new Promise((resolve) => {
    setSpecifySave((prevState) => {
      if (!prevState) {
        throw new Error('SpecifySave state is unexpectedly null.')
      }

      return {
        ...prevState,
        onSelect: (selectedPlugin: string) => {
          resolve(prevState.supportedSaveTypes.find((item) => item.saveTypeID === selectedPlugin))
          setSpecifySave(null) // Close the modal after selection
        },
      }
    })
  })
}

const SavesModal = (props: SavesModalProps) => {
  const { onClose, setSpecifySave } = props
  const backend = useContext(BackendContext)
  const [, dispatchOpenSaves] = useContext(OpenSavesContext)
  const [lookupState] = useContext(LookupContext)
  const [, dispatchError] = useContext(ErrorContext)
  const [, , getEnabledSaveTypes] = useContext(AppInfoContext)
  const [viewMode, setViewMode] = useState<SaveViewMode>('cards')
  const [cardSize, setCardSize] = useState<number>(180)

  const openSaveFile = useCallback(
    async (filePath?: PathData) => {
      if (!filePath) {
        const pickedFile = await backend.pickFile()

        if (E.isLeft(pickedFile)) {
          dispatchError({
            type: 'set_message',
            payload: { title: 'Error Selecting File', messages: [pickedFile.left] },
          })
          return
        }
        if (!pickedFile.right) return
        filePath = pickedFile.right
      }
      backend.loadSaveFile(filePath).then(
        E.match(
          (err) => console.error(err),
          async ({ path, fileBytes, createdDate }) => {
            if (!filePath) {
              filePath = path
            }
            if (filePath && fileBytes && lookupState.loaded) {
              let saveType = getSaveType(fileBytes, getEnabledSaveTypes())
              const complementaryPlugins = saveType?.getComplementaryPlugins?.() ?? []

              if (complementaryPlugins.length > 0) {
                setSpecifySave({
                  supportedSaveTypes: getEnabledSaveTypes(),
                  plugins: complementaryPlugins,
                })

                // Wait for user selection
                saveType = await waitForPluginSelection(setSpecifySave)
                if (!saveType) {
                  return
                }
              }

              const result = buildSaveFile(
                filePath,
                fileBytes,
                {
                  homeMonMap: lookupState.homeMons,
                  gen12LookupMap: lookupState.gen12,
                  gen345LookupMap: lookupState.gen345,
                  fileCreatedDate: createdDate,
                },
                undefined, // supported saves
                saveType,
                (updatedMon) => {
                  const identifier = getMonFileIdentifier(updatedMon)

                  if (identifier === undefined) {
                    return E.left(`Could not get identifier for mon: ${updatedMon.nickname}`)
                  }
                  backend.writeHomeMon(identifier, updatedMon.bytes)
                }
              )

              if (E.isLeft(result)) {
                dispatchError({
                  type: 'set_message',
                  payload: {
                    title: 'Error Loading Save',
                    messages: [result.left],
                  },
                })
                return
              }
              const saveFile = result.right

              if (!saveFile) {
                dispatchError({
                  type: 'set_message',
                  payload: {
                    title: 'Error Identifying Save',
                    messages: ['Make sure you opened a supported save file.'],
                  },
                })
              } else {
                backend.addRecentSave(getSaveRef(saveFile))
                dispatchOpenSaves({ type: 'add_save', payload: saveFile })
                onClose()
              }
            }
          }
        )
      )
    },
    [
      backend,
      dispatchError,
      dispatchOpenSaves,
      getEnabledSaveTypes,
      lookupState,
      onClose,
      setSpecifySave,
    ]
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
              variant="soft"
              color="neutral"
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
