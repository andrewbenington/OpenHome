import { Generation, OriginGame, OriginGames } from '@pkm-rs/pkg'
import { PK1, PK2 } from '@pokemon-files/pkm'
import { Callout } from '@radix-ui/themes'
import * as E from 'fp-ts/lib/Either'
import { flatten } from 'lodash'
import { ReactNode, useCallback, useContext, useEffect, useReducer } from 'react'
import { BackendContext } from '../../backend/backendContext'
import { ErrorIcon } from '../../components/Icons'
import LoadingIndicator from '../../components/LoadingIndicator'
import useDisplayError from '../../hooks/displayError'
import { OHPKM } from '../../types/pkm/OHPKM'
import { HomeData } from '../../types/SAVTypes/HomeData'
import { LookupMap } from '../../types/types'
import {
  getMonFileIdentifier,
  getMonGen12Identifier,
  getMonGen345Identifier,
} from '../../util/Lookup'
import { filterUndefined } from '../../util/Sort'
import { ItemBagContext } from '../itemBag'
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
        E.match(
          (err) => {
            displayError('Error Loading OpenHome Data', err)
            openSavesDispatch({ type: 'set_error', payload: err })
          },
          (banks) =>
            openSavesDispatch({
              type: 'load_home_banks',
              payload: { banks, getMonById },
            })
        )
      )
    },
    [backend, displayError, openSavesDispatch, openSavesState.error]
  )

  const saveChanges = useCallback(async () => {
    if (!openSavesState.homeData) return

    const result = await backend.startTransaction()

    if (E.isLeft(result)) {
      displayError('Error Starting Save Transaction', result.left)
      return
    }

    for (const save of allOpenSaves) {
      save.boxes.forEach((box) =>
        box.pokemon.forEach((mon) => {
          if (mon instanceof OHPKM) {
            console.log(`trading ${mon.nickname} to ${save.gameName}`)
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

    ohpkmStore.setSaving()
    await ohpkmStore.reloadStore().then(
      E.match(
        (err) => {
          openSavesDispatch({ type: 'set_error', payload: err })
          displayError('Error Loading Lookup Data', err)
        },
        (getMonById) => loadAllHomeData(getMonById)
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
