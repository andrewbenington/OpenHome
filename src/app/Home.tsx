import { Box, Modal, ModalDialog, Stack, useTheme } from '@mui/joy'
import * as E from 'fp-ts/lib/Either'
import lodash, { flatten } from 'lodash'
import { bytesToPKMInterface } from 'pokemon-files'
import { GameOfOrigin, isGameBoy, isGen3, isGen4, isGen5 } from 'pokemon-resources'
import { useCallback, useContext, useEffect, useState } from 'react'
import { MdFileOpen } from 'react-icons/md'
import PokemonDetailsModal from 'src/pokemon/PokemonDetailsModal'
import { Errorable } from 'src/types/types'
import { filterUndefined } from 'src/util/Sort'
import { BackendContext } from '../backend/backendContext'
import FilterPanel from '../components/filter/FilterPanel'
import useDisplayError from '../hooks/displayError'
import HomeBoxDisplay from '../saves/boxes/HomeBoxDisplay'
import OpenSaveDisplay from '../saves/boxes/SaveBoxDisplay'
import SavesModal from '../saves/SavesModal'
import { LookupContext } from '../state/lookup'
import { OpenSavesContext } from '../state/openSaves'
import { PKMInterface } from '../types/interfaces'
import { OHPKM } from '../types/pkm/OHPKM'
import { getMonFileIdentifier, getMonGen12Identifier, getMonGen345Identifier } from '../util/Lookup'
import './Home.css'
import ReleaseArea from './home/ReleaseArea'

const Home = () => {
  const [openSavesState, openSavesDispatch, allOpenSaves] = useContext(OpenSavesContext)
  const [lookupState, lookupDispatch] = useContext(LookupContext)
  const backend = useContext(BackendContext)
  const { palette } = useTheme()
  const [selectedMon, setSelectedMon] = useState<PKMInterface>()
  const [openSaveDialog, setOpenSaveDialog] = useState(false)
  const displayError = useDisplayError()

  const previewFile = useCallback(
    async (file: File) => {
      let mon: PKMInterface | undefined

      if (file) {
        const buffer = await file.arrayBuffer()
        const [extension] = file.name.split('.').slice(-1)

        try {
          mon = bytesToPKMInterface(buffer, extension.toUpperCase())
        } catch (e) {
          displayError('Import Error', `Could not read Pokémon file: ${e}`)
        }
      }
      if (!mon) {
        displayError('Import Error', 'Not a valid Pokémon file format')
        return
      }
      setSelectedMon(mon)
    },
    [displayError]
  )

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

    return homeResult
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

    const result = await backend.startTransaction()

    if (E.isLeft(result)) {
      displayError('Error Starting Save Transaction', result.left)
      return
    }

    const { gen12, gen345 } = lookupState
    const saveTypesAndChangedMons = allOpenSaves.map(
      (save) => [save.origin, save.prepareBoxesAndGetModified()] as [GameOfOrigin, OHPKM[]]
    )

    for (const [saveOrigin, changedMons] of saveTypesAndChangedMons) {
      if (isGameBoy(saveOrigin)) {
        changedMons.forEach((mon) => {
          const openHomeIdentifier = getMonFileIdentifier(mon)
          const gen12Identifier = getMonGen12Identifier(mon)

          if (openHomeIdentifier !== undefined && gen12Identifier) {
            gen12[gen12Identifier] = openHomeIdentifier
          }
        })
      } else if (isGen3(saveOrigin) || isGen4(saveOrigin) || isGen5(saveOrigin)) {
        changedMons.forEach((mon) => {
          const openHomeIdentifier = getMonFileIdentifier(mon)
          const gen345Identifier = getMonGen345Identifier(mon)

          if (openHomeIdentifier !== undefined && gen345Identifier) {
            gen345[gen345Identifier] = openHomeIdentifier
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
      backend.deleteHomeMons(
        openSavesState.monsToRelease
          .filter((mon) => mon instanceof OHPKM)
          .map(getMonFileIdentifier)
          .filter(filterUndefined)
      ),
    ]

    const results = flatten(await Promise.all(promises))
    const errors = results.filter(E.isLeft).map((err) => err.left)

    if (errors.length) {
      displayError('Error Saving', errors)
      backend.rollbackTransaction()
      return
    }
    backend.commitTransaction()
    // backend.rollbackTransaction()

    openSavesDispatch({ type: 'clear_updated_box_slots' })
    openSavesDispatch({ type: 'clear_mons_to_release' })

    lookupDispatch({ type: 'clear' })
    await loadAllLookups().then(
      E.match(
        (err) => {
          openSavesDispatch({ type: 'set_error', payload: err })
          displayError('Error Loading Lookup Data', err)
        },
        (homeLookup) => loadAllHomeData(homeLookup)
      )
    )
  }, [
    allOpenSaves,
    backend,
    loadAllHomeData,
    loadAllLookups,
    lookupDispatch,
    lookupState,
    openSavesDispatch,
    openSavesState,
    displayError,
  ])

  useEffect(() => {
    // returns a function to stop listening
    const stopListening = backend.registerListeners({
      onSave: () => saveChanges(),
      onReset: () => {
        openSavesDispatch({ type: 'clear_mons_to_release' })
        if (lookupState.loaded) {
          loadAllHomeData(lookupState.homeMons)
        }
        openSavesDispatch({ type: 'close_all_saves' })
      },
    })

    // the "stop listening" function should be called when the effect returns,
    // otherwise duplicate listeners will exist
    return () => {
      stopListening()
    }
  }, [backend, saveChanges, lookupState, openSavesDispatch, loadAllHomeData])

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

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
      }}
    >
      <Stack className="save-file-column" spacing={1} width={280} minWidth={280}>
        {lodash.range(allOpenSaves.length).map((i) => (
          <OpenSaveDisplay key={`save_display_${i}`} saveIndex={i} />
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
          flex: 1,
          minWidth: 480,
        }}
      >
        <Box
          display="flex"
          flexDirection="row"
          width="100%"
          maxWidth={600}
          minWidth={480}
          alignItems="center"
        >
          <HomeBoxDisplay />
          <Box flex={1} />
        </Box>
      </div>
      <Stack spacing={1} className="right-column" width={300}>
        <FilterPanel />
        <div
          className="drop-area"
          onDrop={(e) => e.dataTransfer.files.length && previewFile(e.dataTransfer.files[0])}
        >
          Preview
        </div>
        <ReleaseArea />
      </Stack>
      <PokemonDetailsModal mon={selectedMon} onClose={() => setSelectedMon(undefined)} />
      <Modal
        open={openSaveDialog}
        onClose={() => setOpenSaveDialog(false)}
        sx={{ height: '100vh' }}
      >
        <ModalDialog
          sx={{
            minWidth: 800,
            width: '80%',
            maxHeight: 'fit-content',
            height: '95vh',
            overflow: 'hidden',
          }}
        >
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
