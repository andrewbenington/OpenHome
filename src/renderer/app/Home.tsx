import { Box, Card, Modal, ModalDialog, Stack, useTheme } from '@mui/joy'
import * as E from 'fp-ts/lib/Either'
import lodash from 'lodash'
import { bytesToPKMInterface } from 'pokemon-files'
import { GameOfOrigin, isGameBoy, isGen3, isGen4, isGen5 } from 'pokemon-resources'
import { useCallback, useContext, useEffect, useState } from 'react'
import { MdFileOpen } from 'react-icons/md'
import { Errorable } from 'src/types/types'
import { OHPKM } from '../../types/pkm/OHPKM'
import { PKMFile } from '../../types/pkm/util'
import {
  getMonFileIdentifier,
  getMonGen12Identifier,
  getMonGen345Identifier,
} from '../../util/Lookup'
import { BackendContext } from '../backend/backendProvider'
import FilterPanel from '../components/filter/FilterPanel'
import PokemonIcon from '../components/PokemonIcon'
import PokemonDetailsPanel from '../pokemon/PokemonDetailsPanel'
import HomeBoxDisplay from '../saves/boxes/HomeBoxDisplay'
import OpenSaveDisplay from '../saves/boxes/SaveBoxDisplay'
import SavesModal from '../saves/SavesModal'
import { AppInfoContext } from '../state/appInfo'
import { LookupContext } from '../state/lookup'
import { MouseContext } from '../state/mouse'
import { OpenSavesContext } from '../state/openSaves'
import { initializeDragImage } from '../util/initializeDragImage'
import { handleMenuResetAndClose, handleMenuSave } from '../util/ipcFunctions'
import './Home.css'

const Home = () => {
  const [openSavesState, openSavesDispatch, allOpenSaves] = useContext(OpenSavesContext)
  const [lookupState, lookupDispatch] = useContext(LookupContext)
  const backend = useContext(BackendContext)
  const [mouseState, mouseDispatch] = useContext(MouseContext)
  const [, appInfoDispatch] = useContext(AppInfoContext)
  const homeData = openSavesState.homeData
  const { palette } = useTheme()
  const [selectedMon, setSelectedMon] = useState<PKMFile>()
  const [tab, setTab] = useState('summary')
  const [openSaveDialog, setOpenSaveDialog] = useState(false)
  const [filesToDelete, setFilesToDelete] = useState<string[]>([])

  useEffect(() => {
    const edited =
      (homeData?.updatedBoxSlots.length ?? 0) > 0 ||
      !allOpenSaves.every((save) => save.updatedBoxSlots.length === 0)
    backend.setHasChanges(edited)
  }, [allOpenSaves, backend, homeData?.updatedBoxSlots])

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
    const mon = mouseState.dragSource?.mon
    if (!file && mouseState.dragSource) {
      if (mon && type === 'release') {
        openSavesDispatch({ type: 'add_mon_to_release', payload: mouseState.dragSource })
        mouseDispatch({ type: 'set_drag_source', payload: undefined })
        if (mon instanceof OHPKM) {
          const identifier = getMonFileIdentifier(mon)
          if (identifier) {
            setFilesToDelete([...filesToDelete, identifier])
          }
        }
      }
      mouseDispatch({ type: 'set_drag_source', payload: undefined })
      processDroppedData(file, mon)
      e.nativeEvent.preventDefault()
    } else if (file) {
      processDroppedData(file, undefined)
    }
  }

  const loadAllLookups = useCallback(async (): Promise<Errorable<Record<string, OHPKM>>> => {
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
      return E.left(homeResult.left)
    } else if (E.isLeft(gen12Result)) {
      onLoadError(gen12Result.left)
      return E.left(gen12Result.left)
    } else if (E.isLeft(gen345Result)) {
      onLoadError(gen345Result.left)
      return E.left(gen345Result.left)
    }

    lookupDispatch({ type: 'load_home_mons', payload: homeResult.right })
    lookupDispatch({ type: 'load_gen12', payload: gen12Result.right })
    lookupDispatch({ type: 'load_gen345', payload: gen345Result.right })

    const homeMons: Record<string, OHPKM> = {}
    for (const [identifier, buffer] of Object.entries(homeResult.right)) {
      homeMons[identifier] = new OHPKM(buffer)
    }

    return E.right(homeMons)
  }, [backend, lookupDispatch])

  const loadAllHomeData = useCallback(
    async (homeMonLookup: Record<string, OHPKM>) => {
      await backend.loadHomeBoxes().then(
        E.match(
          (err) => openSavesDispatch({ type: 'set_error', payload: err }),
          (boxes) =>
            openSavesDispatch({
              type: 'set_home_boxes',
              payload: { boxes, homeLookup: homeMonLookup },
            })
        )
      )
    },
    [backend, openSavesDispatch]
  )

  const saveChanges = useCallback(async () => {
    if (!openSavesState.homeData || !lookupState.loaded) return

    const { gen12, gen345 } = lookupState
    const saveTypesAndChangedMons = allOpenSaves.map(
      (save) => [save.origin, save.prepareBoxesForSaving()] as [GameOfOrigin, OHPKM[]]
    )
    for (const [saveOrigin, changedMons] of saveTypesAndChangedMons) {
      if (isGameBoy(saveOrigin)) {
        changedMons.forEach((mon) => {
          const openHomeIdentifier = getMonFileIdentifier(mon)
          if (openHomeIdentifier !== undefined) {
            gen12[getMonGen12Identifier(mon)] = openHomeIdentifier
          }
        })
      } else if (isGen3(saveOrigin) || isGen4(saveOrigin) || isGen5(saveOrigin)) {
        changedMons.forEach((mon) => {
          const openHomeIdentifier = getMonFileIdentifier(mon)
          if (openHomeIdentifier !== undefined) {
            gen345[getMonGen345Identifier(mon)] = openHomeIdentifier
          }
        })
      }
    }

    const promises = [
      backend.writeGen12Lookup(gen12),
      backend.writeGen345Lookup(gen345),
      backend.writeAllSaveFiles(allOpenSaves),
      backend.writeAllHomeData(
        openSavesState.homeData,
        Object.values(openSavesState.modifiedOHPKMs)
      ),
      backend.deleteHomeMons(filesToDelete),
    ]

    setFilesToDelete([])
    const results = await Promise.all(promises)
    console.log(results)

    openSavesDispatch({ type: 'clear_updated_box_slots' })
    openSavesDispatch({ type: 'clear_mons_to_release' })

    lookupDispatch({ type: 'clear' })
    await loadAllLookups().then(
      E.match(
        (err) => openSavesDispatch({ type: 'set_error', payload: err }),
        (homeLookup) => loadAllHomeData(homeLookup)
      )
    )
  }, [
    allOpenSaves,
    backend,
    filesToDelete,
    loadAllHomeData,
    loadAllLookups,
    lookupDispatch,
    openSavesDispatch,
    openSavesState.homeData,
    openSavesState.modifiedOHPKMs,
  ])

  // listener for menu save
  useEffect(() => {
    const callback = handleMenuSave(saveChanges)
    return () => callback()
  }, [saveChanges])

  // listener for menu reset + close
  useEffect(() => {
    const callback = handleMenuResetAndClose(
      () => {
        openSavesDispatch({ type: 'clear_mons_to_release' })
        if (lookupState.loaded) {
          loadAllHomeData(lookupState.homeMons)
        }
      },
      () => openSavesDispatch({ type: 'close_all_saves' })
    )
    return () => callback()
  }, [openSavesDispatch, loadAllHomeData, lookupState])

  useEffect(() => {
    if (lookupState.loaded && !openSavesState.homeData) {
      loadAllHomeData(lookupState.homeMons)
    }
  }, [loadAllHomeData, lookupState.homeMons, lookupState.loaded, openSavesState.homeData])

  // load lookups
  useEffect(() => {
    if (!lookupState.loaded && !lookupState.error) {
      loadAllLookups()
    }
  }, [lookupState.loaded, lookupState.error, loadAllLookups])

  // load all data when app starts
  useEffect(() => {
    initializeDragImage()
    backend
      .getResourcesPath()
      .then((path) => appInfoDispatch({ type: 'set_resources_path', payload: path }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  console.log('Home render')

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
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => onViewDrop(e, 'release')}
        >
          Release
          <div className="release-icon-container" style={{ display: 'flex' }}>
            {openSavesState.monsToRelease.map((mon, i) => {
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
