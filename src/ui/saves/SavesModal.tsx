import { SAVClass } from '@openhome-core/save/util'
import { PathData } from '@openhome-core/save/util/path'
import { CardsIcon, GridIcon } from '@openhome-ui/components/Icons'
import SideTabs from '@openhome-ui/components/side-tabs/SideTabs'
import { AppInfoAction, AppInfoContext } from '@openhome-ui/state/appInfo'
import { SaveError, SaveErrorType, useSaves } from '@openhome-ui/state/saves'
import { Button, Dialog, Flex, Slider, VisuallyHidden } from '@radix-ui/themes'
import { useCallback, useContext, useState } from 'react'
import 'react-data-grid/lib/styles.css'
import { R } from 'src/core/util/functional'
import useDisplayError from '../hooks/displayError'
import useDebounce from '../hooks/useDebounce'
import RecentSaves from './RecentSaves'
import SaveFolders from './SaveFolders'
import SuggestedSaves from './SuggestedSaves'
import { SaveViewMode } from './util'

interface SavesModalProps {
  open?: boolean
  onClose: () => void
}

export type AmbiguousOpenState = {
  possibleSaveTypes: SAVClass[]
  filePath: PathData
  fileBytes: Uint8Array
}

function saveErrorTitle(errorType: SaveErrorType): string {
  switch (errorType) {
    case 'SELECT_FILE':
      return 'Error Selecting File'
    case 'READ_FILE':
      return 'Error Reading File'
    case 'UNRECOGNIZED':
      return 'Error Detecting Save'
    case 'BUILD_SAVE':
      return 'Save File Invalid'
    case 'ALREADY_OPEN':
      return 'Already Open'
  }
}

function saveErrorMessage(error: SaveError): string {
  switch (error.type) {
    case 'SELECT_FILE':
    case 'READ_FILE':
    case 'BUILD_SAVE':
      return error.cause
    case 'UNRECOGNIZED':
      return 'The selected file was not recognized as a supported save file.'
    case 'ALREADY_OPEN':
      return 'The selected save file is already open'
  }
}

const SavesModal = (props: SavesModalProps) => {
  const { open, onClose } = props
  const [{ settings }, dispatchAppInfoState] = useContext(AppInfoContext)
  const { buildAndOpenSave } = useSaves()
  const displayError = useDisplayError()

  // these are kept as a local state to reduce lag
  const [cardSize, setCardSize] = useState(settings.saveCardSize)
  const [viewMode, setViewMode] = useState<SaveViewMode>(settings.saveViewMode)
  const debouncedUpdateCardSize = useDebounce(
    (size: number, dispatch: React.Dispatch<AppInfoAction>) => {
      dispatch({ type: 'set_icon_size', payload: size })
    },
    500
  )

  const openSaveAndCloseModal = useCallback(
    async (filePath?: PathData) => {
      buildAndOpenSave(filePath).then(
        R.match(
          (save) => {
            if (save) onClose?.()
          },
          (err) => displayError(saveErrorTitle(err.type), saveErrorMessage(err))
        )
      )
    },
    [buildAndOpenSave, displayError, onClose]
  )

  return (
    <Dialog.Root open={open} onOpenChange={(open) => !open && onClose?.()}>
      <VisuallyHidden>
        <Dialog.Title>Pokémon Details</Dialog.Title>
        <Dialog.Description>Description</Dialog.Description>
      </VisuallyHidden>
      <Dialog.Content
        maxWidth="95vw"
        style={{
          minWidth: 800,
          height: 'calc(90vh - 32px)',
          overflow: 'hidden',
          padding: 0,
          borderRadius: 4,
        }}
      >
        <SideTabs.Root defaultValue="recents">
          <SideTabs.TabList>
            <Button
              onClick={() => openSaveAndCloseModal()}
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
            <RecentSaves onOpen={openSaveAndCloseModal} view={viewMode} cardSize={cardSize} />
          </SideTabs.Panel>
          <SideTabs.Panel value="suggested">
            <SuggestedSaves onOpen={openSaveAndCloseModal} view={viewMode} cardSize={cardSize} />
          </SideTabs.Panel>
          <SideTabs.Panel value="folders">
            <SaveFolders />
          </SideTabs.Panel>
        </SideTabs.Root>
        {/* <SelectSaveType
          open={!!tentativeSaveData}
          saveTypes={tentativeSaveData?.possibleSaveTypes}
          onSelect={async (selected) => {
            setTentativeSaveData(undefined)
            if (!tentativeSaveData || !selected) return
            const data = tentativeSaveData

            await buildAndOpenSave(selected, data.filePath, data.fileBytes)
          }}
        /> */}
      </Dialog.Content>
    </Dialog.Root>
  )
}

export default SavesModal
