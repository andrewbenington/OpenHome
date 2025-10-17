import { Generation, OriginGame, OriginGames } from '@pkm-rs-resources/pkg'
import { bytesToPKMInterface } from '@pokemon-files/pkm'
import { Button, Flex, Tabs } from '@radix-ui/themes'
import * as E from 'fp-ts/lib/Either'
import lodash, { flatten } from 'lodash'
import { useCallback, useContext, useEffect, useState } from 'react'
import { MdFileOpen } from 'react-icons/md'
import PokemonDetailsModal from 'src/pokemon/PokemonDetailsModal'
import BagBox from 'src/saves/BagBox'
import BankHeader from 'src/saves/BankHeader'
import { BagContext } from 'src/state/bag'
import { displayIndexAdder, isBattleFormeItem } from 'src/types/pkm/util'
import { Errorable, LookupMap } from 'src/types/types'
import { filterUndefined } from 'src/util/Sort'
import { BackendContext } from '../backend/backendContext'
import FilterPanel from '../components/filter/FilterPanel'
import useDisplayError from '../hooks/displayError'
import HomeBoxDisplay from '../saves/boxes/HomeBoxDisplay'
import OpenSaveDisplay from '../saves/boxes/SaveBoxDisplay'
import SavesModal from '../saves/SavesModal'
import { OpenSavesContext } from '../state/openSaves'
import { PersistedPkmDataContext } from '../state/persistedPkmData'
import { PKMInterface } from '../types/interfaces'
import { OHPKM } from '../types/pkm/OHPKM'
import { PokedexUpdate } from '../types/pokedex'
import { getMonFileIdentifier, getMonGen12Identifier, getMonGen345Identifier } from '../util/Lookup'
import './Home.css'
import ReleaseArea from './home/ReleaseArea'

const Home = () => {
  const [openSavesState, openSavesDispatch, allOpenSaves] = useContext(OpenSavesContext)
  const [persistedPkmState, persistedPkmDispatch] = useContext(PersistedPkmDataContext)
  const [bagState, bagDispatch] = useContext(BagContext)
  const backend = useContext(BackendContext)
  const [selectedMon, setSelectedMon] = useState<PKMInterface>()
  const [openSaveDialog, setOpenSaveDialog] = useState(false)
  const displayError = useDisplayError()

  const loadAllLookups = useCallback(async (): Promise<Errorable<Record<string, OHPKM>>> => {
    const onLoadError = (message: string) => {
      console.error(message)
      persistedPkmDispatch({ type: 'set_error', payload: message })
    }
    const homeResult = await backend.loadHomeMonLookup()

    if (E.isLeft(homeResult)) {
      onLoadError(homeResult.left)
      return E.left(homeResult.left)
    }

    const pokedexUpdates: PokedexUpdate[] = []

    for (const [identifier, mon] of Object.entries(homeResult.right)) {
      const hadErrors = mon.fixErrors()

      if (hadErrors) {
        backend.writeHomeMon(identifier, new Uint8Array(mon.toBytes()))
      }

      pokedexUpdates.push({
        dexNumber: mon.dexNum,
        formeNumber: mon.formeNum,
        status: mon.isShiny() ? 'ShinyCaught' : 'Caught',
      })

      if (isBattleFormeItem(mon.heldItemIndex)) {
        pokedexUpdates.push({
          dexNumber: mon.dexNum,
          formeNumber: displayIndexAdder(mon.heldItemIndex)(mon.formeNum),
          status: mon.isShiny() ? 'ShinyCaught' : 'Caught',
        })
      }
    }

    backend.registerInPokedex(pokedexUpdates)

    persistedPkmDispatch({ type: 'load_persisted_pkm_data', payload: homeResult.right })

    return homeResult
  }, [backend, persistedPkmDispatch])

  const loadAllHomeData = useCallback(
    async (homeMonLookup: Record<string, OHPKM>) => {
      if (openSavesState.error) return
      await backend.loadHomeBanks().then(
        E.match(
          (err) => {
            displayError('Error Loading OpenHome Data', err)
            openSavesDispatch({ type: 'set_error', payload: err })
          },
          (banks) =>
            openSavesDispatch({
              type: 'load_home_banks',
              payload: { banks, monLookup: homeMonLookup },
            })
        )
      )
    },
    [backend, displayError, openSavesDispatch, openSavesState.error]
  )

  const saveChanges = useCallback(async () => {
    if (!openSavesState.homeData || !persistedPkmState.loaded) return

    const result = await backend.startTransaction()

    if (E.isLeft(result)) {
      displayError('Error Starting Save Transaction', result.left)
      return
    }

    const newGen12Lookup: LookupMap = {}
    const newGen345Lookup: LookupMap = {}
    const saveTypesAndChangedMons = allOpenSaves.map(
      (save) => [save.origin, save.prepareBoxesAndGetModified()] as [OriginGame, OHPKM[]]
    )

    for (const [saveOrigin, changedMons] of saveTypesAndChangedMons) {
      const generation = OriginGames.generation(saveOrigin)
      if (generation === Generation.G1 || generation === Generation.G2) {
        changedMons.forEach((mon) => {
          const openHomeIdentifier = getMonFileIdentifier(mon)
          const gen12Identifier = getMonGen12Identifier(mon)

          if (openHomeIdentifier !== undefined && gen12Identifier) {
            newGen12Lookup[gen12Identifier] = openHomeIdentifier
          }
        })
      } else if (
        generation === Generation.G3 ||
        generation === Generation.G4 ||
        generation === Generation.G5
      ) {
        changedMons.forEach((mon) => {
          const openHomeIdentifier = getMonFileIdentifier(mon)
          const gen345Identifier = getMonGen345Identifier(mon)

          if (openHomeIdentifier !== undefined && gen345Identifier) {
            newGen345Lookup[gen345Identifier] = openHomeIdentifier
          }
        })
      }
    }

    const promises = [
      backend.updateLookups(newGen12Lookup, newGen345Lookup),
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

    if (bagState.modified) {
      const saveBagResult = await backend.saveBag(bagState.items)
      if (E.isLeft(saveBagResult)) {
        displayError('Error Saving Bag', saveBagResult.left)
        await backend.rollbackTransaction()
        return
      }
      bagDispatch({ type: 'clear_modified' })
    }

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

    persistedPkmDispatch({ type: 'clear' })
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
    persistedPkmDispatch,
    persistedPkmState,
    openSavesDispatch,
    openSavesState,
    displayError,
  ])

  useEffect(() => {
    // returns a function to stop listening
    const stopListening = backend.registerListeners({
      onOpen: () => setOpenSaveDialog(true),
      onSave: saveChanges,
      onReset: () => {
        openSavesDispatch({ type: 'clear_mons_to_release' })
        if (persistedPkmState.loaded) {
          loadAllHomeData(persistedPkmState.homeMons)
        }
        openSavesDispatch({ type: 'close_all_saves' })
      },
    })

    // // reloads bag from file
    // backend.loadBag().then(
    //   E.match(
    //     (err) => bagDispatch({ type: 'set_error', payload: err }),
    //     (bagObj) => bagDispatch({ type: 'load_bag', payload: bagObj })
    //   )
    // )

    // the "stop listening" function should be called when the effect returns,
    // otherwise duplicate listeners will exist
    return () => {
      stopListening()
    }
  }, [backend, saveChanges, persistedPkmState, openSavesDispatch, loadAllHomeData, bagDispatch])

  const previewFile = useCallback(
    async (file: File) => {
      let mon: PKMInterface | undefined

      if (file) {
        const buffer = await file.arrayBuffer()
        const [extension] = file.name.split('.').slice(-1)

        try {
          if (extension.toUpperCase() === 'OHPKM') {
            mon = new OHPKM(new Uint8Array(buffer))
          } else {
            mon = bytesToPKMInterface(buffer, extension.toUpperCase())
          }
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

  useEffect(() => {
    if (persistedPkmState.loaded && !openSavesState.homeData) {
      loadAllHomeData(persistedPkmState.homeMons)
    }
  }, [
    loadAllHomeData,
    persistedPkmState.homeMons,
    persistedPkmState.loaded,
    openSavesState.homeData,
  ])

  // load lookups
  useEffect(() => {
    if (!persistedPkmState.loaded && !persistedPkmState.error) {
      loadAllLookups()
    }
  }, [persistedPkmState.loaded, persistedPkmState.error, loadAllLookups])

  // load bag
  useEffect(() => {
    if (!bagState.loaded && !bagState.error) {
      console.log('[Bag] Loading bag from backend...')
      backend.loadBag().then(
        E.match(
          (err) => {
            console.error('[Bag] Failed to load bag:', err)
            bagDispatch({ type: 'set_error', payload: err })
          },
          (bagObj) => {
            console.log('[Bag] Loaded successfully:', bagObj)
            console.log(`[Bag] Item count: ${Object.keys(bagObj).length}`)
            bagDispatch({ type: 'load_bag', payload: bagObj })
          }
        )
      )
    }
  }, [backend, bagState.loaded, bagState.error, bagDispatch])

  return (
    <Flex direction="row" style={{ height: '100%' }}>
      <Flex className="save-file-column" gap="3">
        {lodash.range(allOpenSaves.length).map((i) => (
          <OpenSaveDisplay key={`save_display_${i}`} saveIndex={i} />
        ))}
        <Button onClick={() => setOpenSaveDialog(true)}>
          <MdFileOpen />
          Open Save
        </Button>
      </Flex>
      <div className="home-box-column">
        <BankHeader />
        <Flex
          direction="row"
          width="100%"
          maxWidth="600px"
          minWidth="480px"
          height="0"
          flexGrow="1"
        >
          <HomeBoxDisplay />
        </Flex>
      </div>
      <Flex gap="2" className="right-column" style={{ flexDirection: 'column' }}>
        <Tabs.Root defaultValue="filter">
          <Tabs.List>
            <Tabs.Trigger value="filter">Filter</Tabs.Trigger>
            <Tabs.Trigger value="bag">Bag</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="filter" style={{ flexGrow: 1 }}>
            <FilterPanel />
          </Tabs.Content>

          <Tabs.Content value="bag" style={{ flexGrow: 1 }}>
            <BagBox />
          </Tabs.Content>
        </Tabs.Root>

        <div
          className="drop-area"
          onDrop={(e) => e.dataTransfer.files.length && previewFile(e.dataTransfer.files[0])}
        >
          <div className="drop-area-text diagonal-clip">Preview</div>
        </div>

        <ReleaseArea />
      </Flex>
      <PokemonDetailsModal mon={selectedMon} onClose={() => setSelectedMon(undefined)} />

      <SavesModal open={openSaveDialog} onClose={() => setOpenSaveDialog(false)} />
    </Flex>
  )
}

export default Home
