import {
  Button,
  DialogContent,
  DialogTitle,
  Modal,
  ModalClose,
  ModalDialog,
  Slider,
  Stack,
  Tab,
  tabClasses,
  TabList,
  TabPanel,
  Tabs,
  ToggleButtonGroup,
  Typography,
} from '@mui/joy'
import { Theme } from '@radix-ui/themes'
import * as E from 'fp-ts/lib/Either'
import { debounce } from 'lodash'
import { useCallback, useContext, useState } from 'react'
import 'react-data-grid/lib/styles.css'
import useIsDarkMode from 'src/hooks/dark-mode'
import { ErrorContext } from 'src/state/error'
import { PathData } from 'src/types/SAVTypes/path'
import { SAVClass } from 'src/types/SAVTypes/util'
import { getMonFileIdentifier } from 'src/util/Lookup'
import { BackendContext } from '../backend/backendContext'
import { CardsIcon, GridIcon } from '../components/Icons'
import { AppInfoAction, AppInfoContext } from '../state/appInfo'
import { LookupContext } from '../state/lookup'
import { OpenSavesContext } from '../state/openSaves'
import { getSaveRef } from '../types/SAVTypes/SAV'
import { buildSaveFile, getSaveTypes } from '../types/SAVTypes/load'
import RecentSaves from './RecentSaves'
import SaveFolders from './SaveFolders'
import SuggestedSaves from './SuggestedSaves'
import { SaveViewMode } from './util'

interface SavesModalProps {
  onClose: () => void
}

type AmbiguousOpenState = {
  possibleSaveTypes: SAVClass[]
  filePath: PathData
  fileBytes: Uint8Array
}

const debouncedUpdateCardSize = debounce(
  (size: number, dispatch: React.Dispatch<AppInfoAction>) => {
    dispatch({ type: 'set_icon_size', payload: size })
  },
  500
)

const SavesModal = (props: SavesModalProps) => {
  const { onClose } = props
  const backend = useContext(BackendContext)
  const [, dispatchOpenSaves] = useContext(OpenSavesContext)
  const [lookupState] = useContext(LookupContext)
  const [, dispatchError] = useContext(ErrorContext)
  const [, , getEnabledSaveTypes] = useContext(AppInfoContext)
  const [{ settings }, dispatchAppInfoState] = useContext(AppInfoContext)
  const [unknownSaveData, setUnknownSaveData] = useState<AmbiguousOpenState>()
  const isDarkMode = useIsDarkMode()

  // these are kept as a local state to reduce lag
  const [cardSize, setCardSize] = useState(settings.saveCardSize)
  const [viewMode, setViewMode] = useState<SaveViewMode>(settings.saveViewMode)

  const buildAndOpenSave = useCallback(
    (saveType: SAVClass, filePath: PathData, fileBytes: Uint8Array) => {
      const result = buildSaveFile(
        filePath,
        fileBytes,
        {
          homeMonMap: lookupState.homeMons,
          gen12LookupMap: lookupState.gen12,
          gen345LookupMap: lookupState.gen345,
        },
        saveType,
        (updatedMon) => {
          const identifier = getMonFileIdentifier(updatedMon)

          if (identifier !== undefined) {
            backend.writeHomeMon(identifier, updatedMon.bytes)
          }
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
    },
    [backend, dispatchError, dispatchOpenSaves, lookupState, onClose]
  )

  const pickSaveFile = useCallback(
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
          ({ path, fileBytes }) => {
            filePath = path
            if (filePath && fileBytes) {
              let saveTypes = getSaveTypes(fileBytes, getEnabledSaveTypes())

              if (saveTypes.length === 1) {
                buildAndOpenSave(saveTypes[0], filePath, fileBytes)
                return
              }

              if (saveTypes.length === 0) {
                dispatchError({
                  type: 'set_message',
                  payload: {
                    title: 'Error Identifying Save',
                    messages: ['Make sure you opened a supported save file.'],
                  },
                })
                return
              }

              setUnknownSaveData({ possibleSaveTypes: saveTypes, filePath, fileBytes })
            }
          }
        )
      )
    },
    [backend, buildAndOpenSave, dispatchError, getEnabledSaveTypes]
  )

  return (
    <>
      <Theme accentColor="red" hasBackground appearance={isDarkMode ? 'dark' : 'light'}>
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
              onClick={() => pickSaveFile()}
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
            {viewMode === 'card' && (
              <label style={{ margin: 4 }}>
                Icon Size
                <Slider
                  value={cardSize}
                  step={20}
                  onChange={(_, newSize) => {
                    setCardSize(newSize as number)
                    debouncedUpdateCardSize(newSize as number, dispatchAppInfoState)
                  }}
                  valueLabelDisplay="auto"
                  min={100}
                  max={350}
                  style={{ paddingTop: 0, paddingBottom: 30 }}
                  variant="soft"
                  color="neutral"
                />
              </label>
            )}
            <ToggleButtonGroup
              value={viewMode}
              onChange={(_, newValue) => {
                if (newValue) {
                  setViewMode(newValue)
                  dispatchAppInfoState({ type: 'set_save_view', payload: newValue as SaveViewMode })
                }
              }}
              color="secondary"
              style={{ width: '95%', marginLeft: 'auto', marginRight: 'auto', marginBottom: 4 }}
            >
              <Button value="card" color="secondary" variant="soft" fullWidth>
                <CardsIcon />
              </Button>
              <Button value="grid" color="secondary" variant="soft" fullWidth>
                <GridIcon />
              </Button>
            </ToggleButtonGroup>
          </TabList>
          <TabPanel value="recents">
            <RecentSaves onOpen={pickSaveFile} view={viewMode} cardSize={cardSize} />
          </TabPanel>
          <TabPanel value="suggested">
            <SuggestedSaves onOpen={pickSaveFile} view={viewMode} cardSize={cardSize} />
          </TabPanel>
          <TabPanel value="folders">
            <SaveFolders />
          </TabPanel>
        </Tabs>
        <SelectSaveType
          open={!!unknownSaveData}
          saveTypes={unknownSaveData?.possibleSaveTypes}
          onSelect={(selected) => {
            setUnknownSaveData(undefined)
            if (!unknownSaveData || !selected) return
            const data = unknownSaveData

            buildAndOpenSave(selected, data.filePath, data.fileBytes)
          }}
        />
      </Theme>
    </>
  )
}

export default SavesModal

interface SelectSaveTypeProps {
  open: boolean
  saveTypes?: SAVClass[]
  onSelect: (saveType?: SAVClass) => void
}

function SelectSaveType({ open, saveTypes, onSelect }: SelectSaveTypeProps) {
  return (
    <Modal open={open} onClose={() => onSelect()}>
      <ModalDialog
        sx={{
          minWidth: 400,
          maxWidth: '80%',
          borderRadius: 'lg',
          padding: 2,
        }}
      >
        <ModalClose />
        <DialogTitle>Ambiguous Save Type</DialogTitle>
        <DialogContent>
          <Typography>Select a save type to proceed:</Typography>
          <Stack spacing={2} mt={2}>
            {saveTypes?.map((saveType) => (
              <Button
                key={saveType.saveTypeID}
                onClick={() => onSelect(saveType)}
                variant="soft"
                color="primary"
              >
                {saveType.saveTypeName}
              </Button>
            ))}
          </Stack>
        </DialogContent>
      </ModalDialog>
    </Modal>
  )
}
