import {
  getMonFileIdentifier,
  getMonGen12Identifier,
  getMonGen345Identifier,
} from '@openhome-core/pkm/Lookup'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { HomeData } from '@openhome-core/save/HomeData'
import { R } from '@openhome-core/util/functional'
import { filterUndefined } from '@openhome-core/util/sort'
import { LookupMap } from '@openhome-core/util/types'
import { BackendContext } from '@openhome-ui/backend/backendContext'
import { ErrorIcon } from '@openhome-ui/components/Icons'
import LoadingIndicator from '@openhome-ui/components/LoadingIndicator'
import useDisplayError from '@openhome-ui/hooks/displayError'
import { Generation, OriginGame, OriginGames } from '@pkm-rs/pkg'
import { PK1, PK2 } from '@pokemon-files/pkm'
import { Callout } from '@radix-ui/themes'
import { ReactNode, useCallback, useContext, useEffect, useReducer } from 'react'
import { ItemBagContext } from '../items/reducer'
import { OhpkmLookup, useOhpkmStore } from '../ohpkm/useOhpkmStore'
import { openSavesReducer, SavesContext } from './reducer'

export type SavesProviderProps = {
  children: ReactNode
}

export default function SavesProvider({ children }: SavesProviderProps) {
  const backend = useContext(BackendContext)
  const ohpkmStore = useOhpkmStore()
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

  const loadAllHomeData = useCallback(
    async (getMonById: OhpkmLookup) => {
      if (openSavesState.error) return
      await backend.loadHomeBanks().then(
        R.match(
          (banks) => openSavesDispatch({ type: 'load_home_banks', payload: { banks, getMonById } }),
          (err) => {
            displayError('Error Loading OpenHome Data', err)
            openSavesDispatch({ type: 'set_error', payload: err })
          }
        )
      )
    },
    [backend, displayError, openSavesDispatch, openSavesState.error]
  )

  const saveChanges = useCallback(async () => {
    if (!openSavesState.homeData) return

    const result = await backend.startTransaction()

    if (result.isErr()) {
      displayError('Error Starting Save Transaction', result.err)
      return
    }

    // Write appropriate trainer data to handler fields
    for (const save of allOpenSaves) {
      save.boxes.forEach((box) =>
        box.pokemon.forEach((mon) => {
          if (mon instanceof OHPKM) {
            mon.tradeToSave(save)
          }
        })
      )
    }

    const newGen12Lookup: LookupMap = {}
    const newGen345Lookup: LookupMap = {}
    const saveTypesAndChangedMons = allOpenSaves.map(
      (save) => [save.origin, save.prepareBoxesAndGetModified()] as [OriginGame, OHPKM[]]
    )

    for (const [saveOrigin, changedMons] of saveTypesAndChangedMons) {
      const generation = OriginGames.generation(saveOrigin)
      if (generation === Generation.G1 || generation === Generation.G2) {
        changedMons.forEach((mon: PK1 | PK2 | OHPKM) => {
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
      if (saveBagResult.isErr()) {
        displayError('Error Saving Bag', saveBagResult.err)
        await backend.rollbackTransaction()
        return
      }
      bagDispatch({ type: 'clear_modified' })
    }

    const results = (await Promise.all(promises)).flat()
    const errors = results.filter(R.isErr).map((r) => r.err)

    if (errors.length) {
      displayError('Error Saving', errors)
      backend.rollbackTransaction()
      return
    }
    backend.commitTransaction()
    // backend.rollbackTransaction()

    openSavesDispatch({ type: 'clear_updated_box_slots' })
    openSavesDispatch({ type: 'clear_mons_to_release' })

    ohpkmStore.setSaving()
    await ohpkmStore.reloadStore().then(
      R.match(
        (getMonById) => loadAllHomeData(getMonById),
        async (err) => {
          openSavesDispatch({ type: 'set_error', payload: err })
          displayError('Error Loading Lookup Data', err)
        }
      )
    )
  }, [
    openSavesState.homeData,
    openSavesState.modifiedOHPKMs,
    openSavesState.monsToRelease,
    backend,
    allOpenSaves,
    itemBagState.modified,
    itemBagState.itemCounts,
    ohpkmStore,
    displayError,
    bagDispatch,
    loadAllHomeData,
  ])

  // load bag
  useEffect(() => {
    if (!itemBagState.loaded && !itemBagState.error) {
      backend.loadItemBag().then(
        R.match(
          (bagObj) => {
            bagDispatch({ type: 'load_item_bag', payload: bagObj })
          },
          (err) => {
            bagDispatch({ type: 'set_error', payload: err })
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
        loadAllHomeData(ohpkmStore.getById)
        openSavesDispatch({ type: 'close_all_saves' })
      },
    })

    // the "stop listening" function should be called when the effect returns,
    // otherwise duplicate listeners will exist
    return () => {
      stopListening()
    }
  }, [backend, saveChanges, ohpkmStore, openSavesDispatch, loadAllHomeData, bagDispatch])

  useEffect(() => {
    if (!openSavesState.homeData) {
      loadAllHomeData(ohpkmStore.getById)
    }
  }, [loadAllHomeData, ohpkmStore.getById, openSavesState.homeData])

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
    return <LoadingIndicator message="Loading OpenHome boxes..." />
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
