import { FileOpen } from '@mui/icons-material'
import { Box, Button, Card, Dialog, Stack, useTheme } from '@mui/material'
import lodash from 'lodash'
import { bytesToPKMInterface } from 'pokemon-files'
import { useCallback, useEffect, useState } from 'react'
import { loadRecentSaves } from '../../renderer/redux/slices/recentSavesSlice'
import { loadResourcesPath } from '../../renderer/redux/slices/resourcesSlice'
import { bytesToPKM } from '../../types/FileImport'
import { OHPKM } from '../../types/pkm/OHPKM'
import { PKMFile } from '../../types/pkm/util'
import { SaveCoordinates } from '../../types/types'
import { getMonFileIdentifier } from '../../util/Lookup'
import Gen12Lookup from '../components/display/Gen12Lookup'
import FilterPanel from '../components/filter/FilterPanel'
import PokemonIcon from '../components/PokemonIcon'
import PokemonDetailsPanel from '../pokemon/PokemonDetailsPanel'
import { useAppDispatch } from '../redux/hooks'
import {
  useDragMon,
  useDragSource,
  useHomeData,
  useMonsToRelease,
  useOpenSaves,
  useSaveFunctions,
} from '../redux/selectors'
import {
  cancelDrag,
  clearAllSaves,
  clearMonsToRelease,
  loadGen12Lookup,
  loadGen345Lookup,
  loadHomeBoxes,
  loadHomeMons,
  setMonToRelease,
} from '../redux/slices/appSlice'
import HomeBoxDisplay from '../saves/boxes/HomeBoxDisplay'
import OpenSaveDisplay from '../saves/boxes/SaveBoxDisplay'
import SavesModal from '../saves/SavesModal'
import { initializeDragImage } from '../util/initializeDragImage'
import {
  handleDeleteOHPKMFiles,
  handleMenuResetAndClose,
  handleMenuSave,
} from '../util/ipcFunctions'
import useWindowDimensions from '../util/windowDimensions'
import './Home.css'

const Home = () => {
  const saves = useOpenSaves()
  const homeData = useHomeData()
  const dragMon = useDragMon()
  const dragSource = useDragSource()
  const monsToRelease = useMonsToRelease()
  const [loadingMessage, setLoadingMessage] = useState<string | undefined>('Starting app...')
  const { palette } = useTheme()
  const [selectedMon, setSelectedMon] = useState<PKMFile>()
  const [tab, setTab] = useState('summary')
  const [openSaveDialog, setOpenSaveDialog] = useState(false)
  const [lookupDialog, setLookupDialog] = useState<'gen12' | 'gen345' | undefined>()
  const [filesToDelete, setFilesToDelete] = useState<string[]>([])
  const { height } = useWindowDimensions()
  const dispatch = useAppDispatch()
  const dispatchReleaseMon = (saveCoordinates: SaveCoordinates) =>
    dispatch(setMonToRelease(saveCoordinates))
  const dispatchClearMonsToRelease = useCallback(() => dispatch(clearMonsToRelease()), [dispatch])
  const [writeAllSaveFiles, writeAllHomeData] = useSaveFunctions()
  const dispatchClearAllSaves = useCallback(() => dispatch(clearAllSaves()), [dispatch])
  const dispatchCancelDrag = () => dispatch(cancelDrag())

  useEffect(() => {
    const edited =
      homeData.updatedBoxSlots.length > 0 ||
      !saves.every((save) => save.updatedBoxSlots.length === 0)
    window.electron.ipcRenderer.invoke('set-document-edited', edited)
  }, [saves, homeData])

  const onViewDrop = (e: any, type: string) => {
    const processDroppedData = async (file?: File, droppedMon?: PKMFile) => {
      let mon: PKMFile | undefined = droppedMon
      if (file) {
        const bytes = new Uint8Array(await file.arrayBuffer())
        const [extension] = file.name.split('.').slice(-1)
        try {
          mon = bytesToPKM(bytes, extension.toUpperCase())
        } catch (e) {
          console.error(e)
        }
      }
      if (!mon) return
      switch (type) {
        case 'as is':
          setSelectedMon(mon)
          break
      }
    }
    const file = e.dataTransfer.files[0]
    const mon = dragMon
    if (!file && dragSource) {
      if (mon && type === 'release') {
        dispatchReleaseMon(dragSource)
        if (mon instanceof OHPKM) {
          const identifier = getMonFileIdentifier(mon)
          if (identifier) {
            setFilesToDelete([...filesToDelete, identifier])
          }
        }
      }
      dispatchCancelDrag()
      processDroppedData(file, mon)
      e.nativeEvent.preventDefault()
    } else if (file) {
      processDroppedData(file, undefined)
    }
  }

  const onViewDropInterface = (e: React.DragEvent<HTMLDivElement>, type: string) => {
    const processDroppedData = async (file?: File, droppedMon?: PKMFile) => {
      let mon: PKMFile | undefined = droppedMon
      if (file) {
        const buffer = await file.arrayBuffer()
        const [extension] = file.name.split('.').slice(-1)
        try {
          mon = bytesToPKMInterface(buffer, extension.toUpperCase())
        } catch (e) {
          console.error(e)
        }
      }
      if (!mon) return
      switch (type) {
        case 'as is':
          setSelectedMon(mon)
          break
      }
    }
    const file = e.dataTransfer.files[0]
    const mon = dragMon
    if (!file && dragSource) {
      if (mon && type === 'release') {
        dispatchReleaseMon(dragSource)
        if (mon instanceof OHPKM) {
          const identifier = getMonFileIdentifier(mon)
          if (identifier) {
            setFilesToDelete([...filesToDelete, identifier])
          }
        }
      }
      dispatchCancelDrag()
      processDroppedData(file, mon)
      e.nativeEvent.preventDefault()
    } else if (file) {
      processDroppedData(file, undefined)
    }
  }

  const saveChanges = useCallback(() => {
    writeAllSaveFiles()
    writeAllHomeData()
    handleDeleteOHPKMFiles(filesToDelete)
    setFilesToDelete([])
    dispatch(loadHomeMons()).then(() => dispatch(loadHomeBoxes()))
  }, [filesToDelete, writeAllHomeData, writeAllSaveFiles])

  // listener for menu save
  useEffect(() => {
    const callback = handleMenuSave(saveChanges)
    return () => callback()
  }, [saveChanges])

  // listener for menu reset + close
  useEffect(() => {
    const callback = handleMenuResetAndClose(() => {
      dispatchClearMonsToRelease()
      dispatch(loadHomeMons()).then(() => dispatch(loadHomeBoxes()))
    }, dispatchClearAllSaves)
    return () => callback()
  }, [dispatch, dispatchClearAllSaves, saves])

  // load all data when app starts
  useEffect(() => {
    initializeDragImage()
    Promise.all([
      dispatch(loadHomeMons()).then(() => dispatch(loadHomeBoxes())),
      dispatch(loadGen12Lookup()),
      dispatch(loadGen345Lookup()),
      dispatch(loadRecentSaves()),
      dispatch(loadResourcesPath()),
    ]).then(() => setLoadingMessage(undefined))
  }, [dispatch])

  return loadingMessage ? (
    <div>{loadingMessage}</div>
  ) : (
    <Stack style={{ height: '100%', width: '100%', background: palette.background.gradient }}>
      <div
        // container
        style={{
          background: palette.background.gradient,
          flex: 1,
          height: 0,
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        <Stack className="save-file-column" spacing={1}>
          {lodash.range(saves.length).map((i) => (
            <OpenSaveDisplay
              key={`save_display_${i}`}
              saveIndex={i}
              setSelectedMon={setSelectedMon}
            />
          ))}
          <button
            className="card-button"
            onClick={() => setOpenSaveDialog(true)}
            style={{
              backgroundColor: palette.primary.main,
            }}
          >
            <FileOpen />
            Open Save
          </button>
        </Stack>
        <div
          className="home-box-column"
          style={{
            width: '45%',
          }}
        >
          <Box display="flex" flexDirection="row" style={{ width: '100%' }}>
            <Box display="flex" flexDirection="row" style={{ width: height * 0.75 }}>
              <HomeBoxDisplay setSelectedMon={setSelectedMon} />
            </Box>
            <Box flex={1}></Box>
          </Box>
        </div>
        <Stack spacing={1} className="right-column">
          <FilterPanel />
          <div
            className="drop-area"
            draggable
            onDragOver={(e) => {
              e.preventDefault()
            }}
            onDrop={(e) => onViewDrop(e, 'as is')}
          >
            Preview
          </div>
          <div
            className="drop-area"
            draggable
            onDragOver={(e) => {
              e.preventDefault()
            }}
            onDrop={(e) => onViewDropInterface(e, 'as is')}
          >
            Preview Interface
          </div>
          <div
            className="drop-area"
            onDragOver={(e) => {
              e.preventDefault()
            }}
            onDrop={(e) => onViewDrop(e, 'release')}
          >
            Release
            <div className="release-icon-container" style={{ display: 'flex' }}>
              {monsToRelease.map((mon, i) => {
                return (
                  <PokemonIcon
                    key={`delete_mon_${i}`}
                    dexNumber={mon.dexNum}
                    formeNumber={mon.formeNum}
                    style={{ height: 32, width: 32 }}
                  />
                )
              })}
            </div>
          </div>
        </Stack>
      </div>
      <Card style={{ width: 'calc(100% - 16px)', height: 30 }}>
        <Button onClick={() => setLookupDialog('gen12')}>Gen 1/2</Button>
      </Card>
      <Dialog
        open={!!selectedMon}
        onClose={() => setSelectedMon(undefined)}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { height: 400, maxWidth: 800 } }}
      >
        {selectedMon && <PokemonDetailsPanel mon={selectedMon} tab={tab} setTab={setTab} />}
      </Dialog>
      <Dialog
        open={openSaveDialog}
        onClose={() => setOpenSaveDialog(false)}
        fullWidth
        maxWidth="lg"
        PaperProps={{ sx: { height: 800 } }}
      >
        <SavesModal
          onClose={() => {
            setOpenSaveDialog(false)
          }}
        />
      </Dialog>
      <Dialog
        open={lookupDialog === 'gen12'}
        onClose={() => setLookupDialog(undefined)}
        fullWidth
        maxWidth="lg"
        PaperProps={{ sx: { height: 800 } }}
      >
        <Gen12Lookup />
      </Dialog>
    </Stack>
  )
}

export default Home
