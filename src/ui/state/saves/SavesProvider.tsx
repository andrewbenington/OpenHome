import {
  getMonFileIdentifier,
  getMonGen12Identifier,
  getMonGen345Identifier,
  OhpkmIdentifier,
} from '@openhome-core/pkm/Lookup'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { HomeData } from '@openhome-core/save/HomeData'
import { filterUndefined } from '@openhome-core/util/sort'
import { LookupMap } from '@openhome-core/util/types'
import { BackendContext } from '@openhome-ui/backend/backendContext'
import { ErrorIcon } from '@openhome-ui/components/Icons'
import LoadingIndicator from '@openhome-ui/components/LoadingIndicator'
import useDisplayError from '@openhome-ui/hooks/displayError'
import { Generation, OriginGames } from '@pkm-rs/pkg'
import { Callout } from '@radix-ui/themes'
import * as A from 'fp-ts/Array'
import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import { ReactNode, useCallback, useContext, useEffect, useReducer } from 'react'
import { Err, Ok, Result } from 'src/core/util/functional'
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

  const saveChanges = useCallback(async (): Promise<Result<null, SaveError[]>> => {
    if (!openSavesState.homeData) return Err([HomeDataNotLoaded])

    const result = await backend.startTransaction()

    if (E.isLeft(result)) {
      displayError('Error Starting Save Transaction', result.left)
      return Err([TransactionStart(result.left)])
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
    const trackedIdentifiersPerSave = allOpenSaves.map(
      (save) => [save.origin, save.getTrackedMonIdentifiers()] as const
    )

    const monErrors: SaveError[] = []

    for (const [saveOrigin, trackedIdentifiers] of trackedIdentifiersPerSave) {
      const { left: missingIdentifiers, right: foundMons } = pipe(
        ohpkmStore.tryLoadFromIds(trackedIdentifiers),
        A.separate
      )

      monErrors.push(
        ...missingIdentifiers.map((missing) => missing.identifier).map(IdentifierNotTracked)
      )

      const generation = OriginGames.generation(saveOrigin)
      if (generation === Generation.G1 || generation === Generation.G2) {
        foundMons.forEach((mon) => {
          const gen12Identifier = getMonGen12Identifier(mon)

          if (gen12Identifier) {
            newGen12Lookup[gen12Identifier] = mon.getHomeIdentifier()
          }
        })
      } else if (
        generation === Generation.G3 ||
        generation === Generation.G4 ||
        generation === Generation.G5
      ) {
        foundMons.forEach((mon) => {
          const gen345Identifier = getMonGen345Identifier(mon)

          if (gen345Identifier) {
            newGen345Lookup[gen345Identifier] = mon.getHomeIdentifier()
          }
        })
      }
    }

    if (monErrors.length) {
      return Err(monErrors)
    }

    const saveWriters = allOpenSaves.map((save) => save.prepareWriter())

    const promises = [
      backend.updateLookups(newGen12Lookup, newGen345Lookup),
      backend.writeAllSaveFiles(saveWriters),
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
        return Err([SaveItemBagData(saveBagResult.left)])
      }
      bagDispatch({ type: 'clear_modified' })
    }

    const results = (await Promise.all(promises)).flat()
    const errors = results.filter(E.isLeft).map((err) => err.left)

    if (errors.length) {
      displayError('Error Saving', errors)
      backend.rollbackTransaction()
      return Err(errors.map(BackendSaveError))
    }
    backend.commitTransaction()
    // backend.rollbackTransaction()

    openSavesDispatch({ type: 'clear_updated_box_slots' })
    openSavesDispatch({ type: 'clear_mons_to_release' })

    ohpkmStore.setSaving()
    return await ohpkmStore.reloadStore().then(
      E.match(
        async (err) => {
          openSavesDispatch({ type: 'set_error', payload: err })
          displayError('Error Loading Lookup Data', err)
          return Err([ReloadLookup(err)])
        },
        async (getMonById) => {
          await loadAllHomeData(getMonById)
          return Ok<null, SaveError[]>(null)
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

const HomeDataNotLoaded = Object.freeze({ _SaveErrorType: 'HomeDataNotLoaded' })

type SaveError =
  | { _SaveErrorType: 'HomeDataNotLoaded' }
  | { _SaveErrorType: 'TransactionStart'; message: string }
  | { _SaveErrorType: 'IdentifierNotTracked'; identifier: OhpkmIdentifier }
  | { _SaveErrorType: 'GenG12Identifier'; mon: OHPKM }
  | { _SaveErrorType: 'GenG345Identifier'; mon: OHPKM }
  | { _SaveErrorType: 'SaveItemBagData'; message: string }
  | { _SaveErrorType: 'BackendSaveError'; message: string }
  | { _SaveErrorType: 'ReloadLookup'; message: string }

const TransactionStart: (message: string) => SaveError = (message: string) => ({
  _SaveErrorType: 'TransactionStart',
  message,
})

export const IdentifierNotTracked: (identifier: OhpkmIdentifier) => SaveError = (
  identifier: OhpkmIdentifier
) => ({
  _SaveErrorType: 'IdentifierNotTracked',
  identifier,
})

const SaveItemBagData: (message: string) => SaveError = (message: string) => ({
  _SaveErrorType: 'SaveItemBagData',
  message,
})

const BackendSaveError: (message: string) => SaveError = (message: string) => ({
  _SaveErrorType: 'BackendSaveError',
  message,
})

const ReloadLookup: (message: string) => SaveError = (message: string) => ({
  _SaveErrorType: 'ReloadLookup',
  message,
})
