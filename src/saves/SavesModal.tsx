import { Button, Dialog, Flex, Separator, Slider, VisuallyHidden } from '@radix-ui/themes'
import * as E from 'fp-ts/lib/Either'
import { debounce } from 'lodash'
import { useCallback, useContext, useState } from 'react'
import 'react-data-grid/lib/styles.css'
import { BackendContext } from 'src/backend/backendContext'
import { CardsIcon, GridIcon } from 'src/components/Icons'
import SideTabs from 'src/components/side-tabs/SideTabs'
import useDisplayError from 'src/hooks/displayError'
import { AppInfoAction, AppInfoContext } from 'src/state/appInfo'
import { LookupContext } from 'src/state/lookup'
import { OpenSavesContext } from 'src/state/openSaves'
import { buildSaveFile, getSaveTypes } from 'src/types/SAVTypes/load'
import { PathData } from 'src/types/SAVTypes/path'
import { getSaveRef } from 'src/types/SAVTypes/SAV'
import { SAVClass } from 'src/types/SAVTypes/util'
import { getMonFileIdentifier } from 'src/util/Lookup'
import RecentSaves from './RecentSaves'
import SaveFolders from './SaveFolders'
import SuggestedSaves from './SuggestedSaves'
import { SaveViewMode } from './util'

interface SavesModalProps {
  open?: boolean
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

function useOpenSaveHandler(onClose?: () => void) {
  const [, , getEnabledSaveTypes] = useContext(AppInfoContext)
  const [, dispatchOpenSaves] = useContext(OpenSavesContext)
  const [tentativeSaveData, setTentativeSaveData] = useState<AmbiguousOpenState>()
  const backend = useContext(BackendContext)
  const [lookupState] = useContext(LookupContext)
  const displayError = useDisplayError()

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
        displayError('Error Loading Save', result.left)
        return
      }
      const saveFile = result.right

      if (!saveFile) {
        displayError('Error Identifying Save', 'Make sure you opened a supported save file.')
      } else {
        backend.addRecentSave(getSaveRef(saveFile))
        dispatchOpenSaves({ type: 'add_save', payload: saveFile })
        onClose?.()
      }
    },
    [backend, displayError, dispatchOpenSaves, lookupState, onClose]
  )

  const pickSaveFile = useCallback(
    async (filePath?: PathData) => {
      if (!filePath) {
        const pickedFile = await backend.pickFile()

        if (E.isLeft(pickedFile)) {
          displayError('Error Selecting File', pickedFile.left)
          return
        }
        if (!pickedFile.right) return
        filePath = pickedFile.right
      }
      backend.loadSaveFile(filePath).then(
        E.match(
          (err) => displayError('Error loading save file', err),
          ({ path, fileBytes }) => {
            filePath = path
            if (filePath && fileBytes) {
              let saveTypes = getSaveTypes(fileBytes, getEnabledSaveTypes())

              if (saveTypes.length === 1) {
                buildAndOpenSave(saveTypes[0], filePath, fileBytes)
                return
              }

              if (saveTypes.length === 0) {
                displayError(
                  'Error Identifying Save',
                  'Make sure you opened a supported save file.'
                )
                return
              }

              setTentativeSaveData({ possibleSaveTypes: saveTypes, filePath, fileBytes })
            }
          }
        )
      )
    },
    [backend, buildAndOpenSave, displayError, getEnabledSaveTypes]
  )

  return { pickSaveFile, buildAndOpenSave, tentativeSaveData, setTentativeSaveData }
}

const SavesModal = (props: SavesModalProps) => {
  const { open, onClose } = props
  const [{ settings }, dispatchAppInfoState] = useContext(AppInfoContext)
  const { buildAndOpenSave, pickSaveFile, tentativeSaveData, setTentativeSaveData } =
    useOpenSaveHandler(onClose)

  // these are kept as a local state to reduce lag
  const [cardSize, setCardSize] = useState(settings.saveCardSize)
  const [viewMode, setViewMode] = useState<SaveViewMode>(settings.saveViewMode)

  return (
    <Dialog.Root open={open} onOpenChange={(open) => !open && onClose?.()}>
      <VisuallyHidden>
        <Dialog.Title>Pokémon Details</Dialog.Title>
        <Dialog.Description>Description</Dialog.Description>
      </VisuallyHidden>
      <Dialog.Content
        maxWidth="95%"
        style={{
          minWidth: 800,
          height: 'calc(90vh - 32px)',
          overflow: 'hidden',
        }}
      >
        <SideTabs.Root defaultValue="recents">
          <SideTabs.TabList>
            <Button
              onClick={() => pickSaveFile()}
              style={{ margin: 8, width: 'calc(100% - 16px)' }}
            >
              Open File
            </Button>
            <SideTabs.Tab value="recents">Recents</SideTabs.Tab>
            <SideTabs.Tab value="suggested">Suggested</SideTabs.Tab>
            <SideTabs.Tab value="folders">Save Folders</SideTabs.Tab>
            <div style={{ flex: 1 }} />
            {viewMode === 'card' && (
              <label style={{ margin: 4, color: 'white' }}>
                Icon Size
                <Slider
                  value={[cardSize]}
                  step={20}
                  onValueChange={(newSize) => {
                    setCardSize(newSize[0])
                    debouncedUpdateCardSize(newSize[0], dispatchAppInfoState)
                  }}
                  min={100}
                  max={350}
                  style={{ padding: '4px 0px 8px' }}
                />
              </label>
            )}
            <Flex direction="row" justify="center" width="100%">
              <Button
                value="card"
                onClick={() => {
                  if (viewMode === 'card') return
                  setViewMode('card')
                  dispatchAppInfoState({
                    type: 'set_save_view',
                    payload: 'card',
                  })
                }}
                variant={viewMode === 'card' ? 'solid' : 'soft'}
                style={{
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                }}
              >
                <CardsIcon />
              </Button>
              <Button
                value="grid"
                onClick={() => {
                  if (viewMode === 'grid') return
                  setViewMode('grid')
                  dispatchAppInfoState({
                    type: 'set_save_view',
                    payload: 'grid',
                  })
                }}
                variant={viewMode === 'grid' ? 'solid' : 'soft'}
                style={{
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                }}
              >
                <GridIcon />
              </Button>
            </Flex>
          </SideTabs.TabList>
          <SideTabs.Panel value="recents">
            <RecentSaves onOpen={pickSaveFile} view={viewMode} cardSize={cardSize} />
          </SideTabs.Panel>
          <SideTabs.Panel value="suggested">
            <SuggestedSaves onOpen={pickSaveFile} view={viewMode} cardSize={cardSize} />
          </SideTabs.Panel>
          <SideTabs.Panel value="folders">
            <SaveFolders />
          </SideTabs.Panel>
        </SideTabs.Root>
        <SelectSaveType
          open={!!tentativeSaveData}
          saveTypes={tentativeSaveData?.possibleSaveTypes}
          onSelect={(selected) => {
            setTentativeSaveData(undefined)
            if (!tentativeSaveData || !selected) return
            const data = tentativeSaveData

            buildAndOpenSave(selected, data.filePath, data.fileBytes)
          }}
        />
      </Dialog.Content>
    </Dialog.Root>
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
    <Dialog.Root open={open} onOpenChange={(open) => !open && onSelect()}>
      <Dialog.Content
        width="300px"
        style={{
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <Dialog.Title mt="2" mb="0">
          Ambiguous Save Type
        </Dialog.Title>
        <Separator style={{ width: '100%' }} />
        <Dialog.Description>Select a save type to proceed:</Dialog.Description>
        <Flex gap="1" mt="1" direction="column">
          {saveTypes?.map((saveType) => (
            <Button
              key={saveType.saveTypeID}
              onClick={() => onSelect(saveType)}
              style={{ width: '100%', minHeight: 36, height: 'fit-content' }}
            >
              {saveType.saveTypeName}
            </Button>
          ))}
        </Flex>
        <Dialog.Close>
          <Button variant="outline" color="gray">
            Cancel
          </Button>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Root>
  )
}
