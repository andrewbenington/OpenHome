import { Box, Card, Modal, ModalDialog, Stack, useTheme } from '@mui/joy'
import * as E from 'fp-ts/lib/Either'
import lodash from 'lodash'
import { bytesToPKMInterface } from 'pokemon-files'
import { useCallback, useContext, useEffect, useState } from 'react'
import { MdBook, MdFileOpen, MdSave } from 'react-icons/md'
import { loadRecentSaves } from '../../renderer/redux/slices/recentSavesSlice'
import { loadResourcesPath } from '../../renderer/redux/slices/resourcesSlice'
import { OHPKM } from '../../types/pkm/OHPKM'
import { PKMFile } from '../../types/pkm/util'
import { SaveCoordinates } from '../../types/types'
import { getMonFileIdentifier } from '../../util/Lookup'
import { BackendContext } from '../backend/backendProvider'
import { DevDataDisplay } from '../components/DevDataDisplay'
import FilterPanel from '../components/filter/FilterPanel'
import PokemonIcon from '../components/PokemonIcon'
import PokemonDetailsPanel from '../pokemon/PokemonDetailsPanel'
import { useAppDispatch } from '../redux/hooks'
import {
  useDragMon,
  useDragSource,
  useHomeData,
  useMonsToRelease,
  useSaveFunctions,
} from '../redux/selectors'
import {
  cancelDrag,
  clearAllSaves,
  clearMonsToRelease,
  loadHomeBoxes,
  loadHomeMons,
  setMonToRelease,
} from '../redux/slices/appSlice'
import HomeBoxDisplay from '../saves/boxes/HomeBoxDisplay'
import OpenSaveDisplay from '../saves/boxes/SaveBoxDisplay'
import SavesModal from '../saves/SavesModal'
import { LookupContext } from '../state/lookup'
import { OpenSavesContext } from '../state/saves'
import { initializeDragImage } from '../util/initializeDragImage'
import {
  handleDeleteOHPKMFiles,
  handleMenuResetAndClose,
  handleMenuSave,
} from '../util/ipcFunctions'
import './Home.css'

const Home = () => {
  const [openSavesState, openSavesDispatch, allOpenSaves] = useContext(OpenSavesContext)
  const [lookupState, lookupDispatch] = useContext(LookupContext)
  const backend = useContext(BackendContext)
  const homeData = useHomeData()
  const dragMon = useDragMon()
  const dragSource = useDragSource()
  const monsToRelease = useMonsToRelease()
  const { palette } = useTheme()
  const [selectedMon, setSelectedMon] = useState<PKMFile>()
  const [tab, setTab] = useState('summary')
  const [openSaveDialog, setOpenSaveDialog] = useState(false)
  const [filesToDelete, setFilesToDelete] = useState<string[]>([])
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
      allOpenSaves.every((save) => save.updatedBoxSlots.length === 0)
    backend.setHasChanges(edited)
  }, [allOpenSaves, backend, homeData.updatedBoxSlots])

  const onViewDrop = (e: React.DragEvent<HTMLDivElement>, type: string) => {
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
  }, [dispatch, dispatchClearAllSaves, allOpenSaves, dispatchClearMonsToRelease])

  const loadAllLookups = useCallback(async () => {
    const onLoadError = (message: string) => {
      console.error(message)
      lookupDispatch({ type: 'set_error', payload: message })
    }
    const [homeResult, gen12Result, gen345Result] = await Promise.all([
      backend.loadHomeMonLookup(),
      backend.loadGen12Lookup(),
      backend.loadGen345Lookup(),
    ])
    if (E.isLeft(homeResult)) {
      onLoadError(homeResult.left)
      return
    } else if (E.isLeft(gen12Result)) {
      onLoadError(gen12Result.left)
      return
    } else if (E.isLeft(gen345Result)) {
      onLoadError(gen345Result.left)
      return
    }
    console.log([homeResult, gen12Result, gen345Result])

    lookupDispatch({ type: 'load_home_mons', payload: homeResult.right })
    lookupDispatch({ type: 'load_gen12', payload: gen12Result.right })
    lookupDispatch({ type: 'load_gen345', payload: gen345Result.right })
  }, [backend, lookupDispatch])

  useEffect(() => {
    console.log(lookupState.loaded, openSavesState.homeData)
    if (lookupState.loaded && !openSavesState.homeData) {
      console.log('LOADING HOME')
      backend.loadHomeBoxes().then(
        E.match(
          (err) => openSavesDispatch({ type: 'set_error', payload: err }),
          (boxes) =>
            openSavesDispatch({
              type: 'set_home_boxes',
              payload: { boxes, homeLookup: lookupState.homeMons },
            })
        )
      )
    }
  }, [
    backend,
    lookupState.homeMons,
    lookupState.loaded,
    openSavesDispatch,
    openSavesState.homeData,
  ])

  // load lookups
  useEffect(() => {
    if (!lookupState.loaded && !lookupState.error) {
      loadAllLookups()
    }
  }, [lookupState.loaded, lookupState.error, loadAllLookups])

  // load all data when app starts
  useEffect(() => {
    initializeDragImage()

    Promise.all([
      // dispatch(loadHomeMons()).then(() => dispatch(loadHomeBoxes())),
      // dispatch(loadGen12Lookup()),
      // dispatch(loadGen345Lookup()),
      dispatch(loadRecentSaves()),
      dispatch(loadResourcesPath()),
    ])
  }, [dispatch])

  return (
    <div
      style={{
        background: palette.background.gradient,
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
      }}
    >
      <Stack className="save-file-column" spacing={1} width={280} minWidth={280}>
        {lodash.range(allOpenSaves.length).map((i) => (
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
            backgroundColor: palette.primary.mainChannel,
          }}
        >
          <MdFileOpen />
          Open Save
        </button>
      </Stack>
      <div
        className="home-box-column"
        style={{
          width: 0,
          flex: 1,
          minWidth: 480,
          maxWidth: 600,
        }}
      >
        <Box display="flex" flexDirection="row" width="100%" alignItems="center">
          <HomeBoxDisplay setSelectedMon={setSelectedMon} />
          <Box flex={1}></Box>
        </Box>
        <DevDataDisplay data={openSavesState} icon={MdSave} />
        <DevDataDisplay data={lookupState} icon={MdBook} />
      </div>
      <Stack spacing={1} className="right-column" width={300}>
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
        </div>{' '}
      </Stack>
      <Modal open={!!selectedMon} onClose={() => setSelectedMon(undefined)}>
        <Card style={{ width: 800, height: 400, padding: 0, overflow: 'hidden' }}>
          {selectedMon && <PokemonDetailsPanel mon={selectedMon} tab={tab} setTab={setTab} />}
        </Card>
      </Modal>
      <Modal
        open={openSaveDialog}
        onClose={() => setOpenSaveDialog(false)}
        // fullWidth
        // PaperProps={{ sx: { height: 800 } }}
      >
        <ModalDialog sx={{ minHeight: 400, height: 600, width: 1000 }}>
          <SavesModal
            onClose={() => {
              setOpenSaveDialog(false)
            }}
          />
        </ModalDialog>
      </Modal>
    </div>
  )
}

export default Home
