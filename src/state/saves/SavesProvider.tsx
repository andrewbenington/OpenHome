import { Generation, OriginGame, OriginGames } from '@pkm-rs-resources/pkg'
import { Callout, Spinner } from '@radix-ui/themes'
import * as E from 'fp-ts/lib/Either'
import { flatten } from 'lodash'
import { ReactNode, useCallback, useContext, useEffect, useReducer } from 'react'
import { BackendContext } from '../../backend/backendContext'
import { ErrorIcon } from '../../components/Icons'
import useDisplayError from '../../hooks/displayError'
import { OHPKM } from '../../types/pkm/OHPKM'
import { displayIndexAdder, isBattleFormeItem } from '../../types/pkm/util'
import { PokedexUpdate } from '../../types/pokedex'
import { HomeData } from '../../types/SAVTypes/HomeData'
import { Errorable, LookupMap } from '../../types/types'
import {
  getMonFileIdentifier,
  getMonGen12Identifier,
  getMonGen345Identifier,
} from '../../util/Lookup'
import { filterUndefined } from '../../util/Sort'
import { ItemBagContext } from '../itemBag'
import { PersistedPkmDataContext } from '../persistedPkmData'
import { openSavesReducer, SavesContext } from './reducer'

export type SavesProviderProps = {
  children: ReactNode
}

export default function SavesProvider({ children }: SavesProviderProps) {
  const backend = useContext(BackendContext)
  const [persistedPkmState, persistedPkmDispatch] = useContext(PersistedPkmDataContext)
  const [itemBagState, bagDispatch] = useContext(ItemBagContext)
  const displayError = useDisplayError()
  const [openSavesState, openSavesDispatch] = useReducer(openSavesReducer, {
    modifiedOHPKMs: {},
    monsToRelease: [],
    openSaves: {},
  })

  const allOpenSaves = Object.values(openSavesState.openSaves)
    .filter((data) => !!data)
    .filter((data) => !(data.save instanceof HomeData))
    .sort((a, b) => a.index - b.index)
    .map((data) => data.save)

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

      if (isBattleFormeItem(mon.dexNum, mon.heldItemIndex)) {
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

    if (itemBagState.modified) {
      const saveBagResult = await backend.saveItemBag(itemBagState.itemCounts)
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
    openSavesState.homeData,
    openSavesState.modifiedOHPKMs,
    openSavesState.monsToRelease,
    persistedPkmState.loaded,
    backend,
    allOpenSaves,
    itemBagState.modified,
    itemBagState.itemCounts,
    openSavesDispatch,
    persistedPkmDispatch,
    loadAllLookups,
    displayError,
    bagDispatch,
    loadAllHomeData,
  ])

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
    if (!itemBagState.loaded && !itemBagState.error) {
      backend.loadItemBag().then(
        E.match(
          (err) => {
            bagDispatch({ type: 'set_error', payload: err })
          },
          (bagObj) => {
            bagDispatch({ type: 'load_item_bag', payload: bagObj })
          }
        )
      )
    }
  }, [backend, itemBagState.loaded, itemBagState.error, bagDispatch])

  useEffect(() => {
    // returns a function to stop listening
    const stopListening = backend.registerListeners({
      onSave: saveChanges,
      onReset: () => {
        openSavesDispatch({ type: 'clear_mons_to_release' })
        if (persistedPkmState.loaded) {
          loadAllHomeData(persistedPkmState.homeMons)
        }
        openSavesDispatch({ type: 'close_all_saves' })
      },
    })

    // the "stop listening" function should be called when the effect returns,
    // otherwise duplicate listeners will exist
    return () => {
      stopListening()
    }
  }, [backend, saveChanges, persistedPkmState, openSavesDispatch, loadAllHomeData, bagDispatch])

  if (openSavesState.error) {
    return (
      <Callout.Root>
        <Callout.Icon>
          <ErrorIcon />
        </Callout.Icon>
        <Callout.Text>{openSavesState.error}</Callout.Text>
      </Callout.Root>
    )
  }

  if (!openSavesState.homeData) {
    return <Spinner />
  }

  return (
    <SavesContext.Provider
      value={[
        openSavesState,
        openSavesDispatch,
        Object.values(openSavesState.openSaves)
          .filter((data) => !!data)
          .filter((data) => !(data.save instanceof HomeData))
          .sort((a, b) => a.index - b.index)
          .map((data) => data.save),
      ]}
    >
      {children}
    </SavesContext.Provider>
  )
}
