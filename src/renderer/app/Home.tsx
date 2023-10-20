import { FileOpen } from '@mui/icons-material'
import { Dialog, Grid, useTheme } from '@mui/material'
import _ from 'lodash'
import { useCallback, useEffect, useState } from 'react'
import { POKEMON_DATA } from '../../consts'
import OpenHomeButton from '../../renderer/components/OpenHomeButton'
import { loadRecentSaves } from '../../renderer/redux/slices/recentSavesSlice'
import { loadResourcesPath } from '../../renderer/redux/slices/resourcesSlice'
import { OHPKM } from '../../types/PKMTypes'
import { SaveCoordinates } from '../../types/types'
import { bytesToPKM } from '../../util/FileImport'
import { getMonFileIdentifier } from '../../util/Lookup'
import BoxIcons from '../images/BoxIcons.png'
import PokemonDisplay from '../pokemon/PokemonDisplay'
import { useAppDispatch } from '../redux/hooks'
import {
  useDragMon,
  useDragSource,
  useHomeData,
  useMonsToRelease,
  useSaveFunctions,
  useSaves,
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
import HomeBoxDisplay from '../saves/HomeBoxDisplay'
import SaveDisplay from '../saves/SaveDisplay'
import SaveFileSelector from '../saves/SaveFileSelector'
import { initializeDragImage } from '../util/initializeDragImage'
import {
  handleDeleteOHPKMFiles,
  handleMenuResetAndClose,
  handleMenuSave,
} from '../util/ipcFunctions'
import useWindowDimensions from '../util/windowDimensions'
import Themes, { OpenHomeTheme } from './Themes'
import { dropAreaStyle } from './styles'
import { PKM } from '../../types/PKMTypes/PKM'

const Home = () => {
  const { palette } = useTheme()
  const saves = useSaves()
  const homeData = useHomeData()
  const dragMon = useDragMon()
  const dragSource = useDragSource()
  const monsToRelease = useMonsToRelease()
  const [loadingMessage, setLoadingMessage] = useState<string | undefined>('Starting app...')
  const [currentTheme] = useState<OpenHomeTheme>(Themes[0])
  const [selectedMon, setSelectedMon] = useState<PKM>()
  const [tab, setTab] = useState('summary')
  const [openSaveDialog, setOpenSaveDialog] = useState(false)
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
    const processDroppedData = async (file?: File, droppedMon?: PKM) => {
      let mon: PKM | undefined = droppedMon
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

  const saveChanges = useCallback(() => {
    writeAllSaveFiles()
    writeAllHomeData()
    handleDeleteOHPKMFiles(filesToDelete)
    setFilesToDelete([])
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
    <Grid
      container
      height="100%"
      style={{
        backgroundColor: currentTheme.backgroundColor,
      }}
    >
      <Grid
        item
        xs={3.5}
        style={{
          overflowY: 'scroll',
          height: '100%',
        }}
      >
        {_.range(saves.length).map((i) => (
          <SaveDisplay key={`save_display_${i}`} saveIndex={i} setSelectedMon={setSelectedMon} />
        ))}
        <OpenHomeButton
          style={{
            margin: 'auto',
            backgroundColor: palette.primary.main,
            color: palette.text.secondary,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 10,
            marginBottom: 10,
          }}
          onClick={() => setOpenSaveDialog(true)}
        >
          <FileOpen />
          <h2>Open Save</h2>
        </OpenHomeButton>
      </Grid>
      <Grid
        item
        xs={8.5}
        display="flex"
        flexDirection="column"
        alignItems="center"
        style={{ padding: 10 }}
      >
        <div style={{ width: height * 0.75 }}>
          <HomeBoxDisplay setSelectedMon={setSelectedMon} />
        </div>
        <Grid container flex={1}>
          <Grid item xs={6} style={dropAreaStyle}>
            <div
              draggable
              style={{
                height: '100%',
                width: '100%',
                flex: 1,
              }}
              onDragOver={(e) => {
                e.preventDefault()
              }}
              onDrop={(e) => onViewDrop(e, 'as is')}
            >
              Preview
            </div>
          </Grid>
          <Grid item xs={6} style={dropAreaStyle}>
            RELEASE
            <div
              onDragOver={(e) => {
                e.preventDefault()
              }}
              onDrop={(e) => onViewDrop(e, 'release')}
              style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                height: '100%',
                width: '100%',
                position: 'absolute',
                top: 0,
              }}
            >
              {monsToRelease.map((mon, i) => {
                if (mon.isEgg || !POKEMON_DATA[mon.dexNum]) {
                  return '0% 0%'
                }
                const [x, y] = POKEMON_DATA[mon.dexNum].formes[mon.formNum].spriteIndex
                const backgroundPosition = `${(x / 35) * 100}% ${(y / 36) * 100}%`
                return (
                  <div key={`delete_mon_${i}`} style={{ width: '10%', aspectRatio: 1 }}>
                    <div
                      style={{
                        background: `url(${BoxIcons}) no-repeat 0.02777% 0.02777%`,
                        backgroundSize: '3600%',
                        backgroundPosition,
                        imageRendering: 'crisp-edges',
                        aspectRatio: 1,
                      }}
                    />
                  </div>
                )
              })}
            </div>
          </Grid>
        </Grid>
      </Grid>

      <Dialog
        open={!!selectedMon}
        onClose={() => setSelectedMon(undefined)}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { height: 400, maxWidth: 800 } }}
      >
        {selectedMon && <PokemonDisplay mon={selectedMon} tab={tab} setTab={setTab} />}
      </Dialog>
      <Dialog
        open={openSaveDialog}
        onClose={() => setOpenSaveDialog(false)}
        fullWidth
        maxWidth="lg"
        PaperProps={{ sx: { height: 400 } }}
      >
        <SaveFileSelector
          onClose={() => {
            setOpenSaveDialog(false)
          }}
        />
      </Dialog>
    </Grid>
  )
}

export default Home
