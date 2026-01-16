import { getMonFileIdentifier, OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { HomeData } from '@openhome-core/save/HomeData'
import { R } from '@openhome-core/util/functional'
import { filterUndefined } from '@openhome-core/util/sort'
import { BackendContext } from '@openhome-ui/backend/backendContext'
import { ErrorIcon } from '@openhome-ui/components/Icons'
import LoadingIndicator from '@openhome-ui/components/LoadingIndicator'
import useDisplayError from '@openhome-ui/hooks/displayError'
import { Callout } from '@radix-ui/themes'
import { ReactNode, useCallback, useContext, useEffect, useReducer } from 'react'
import { Result } from 'src/core/util/functional'
import { ItemBagContext } from '../items/reducer'
import { openSavesReducer, SavesContext } from './reducer'

export type SavesProviderProps = {
  children: ReactNode
}

export default function SavesProvider({ children }: SavesProviderProps) {
  const backend = useContext(BackendContext)
  const [itemBagState, bagDispatch] = useContext(ItemBagContext)
  const displayError = useDisplayError()
  const [openSavesState, openSavesDispatch] = useReducer(openSavesReducer, {
    monsToRelease: [],
    openSaves: {},
  })

  const allOpenSaves = Object.values(openSavesState.openSaves)
    .filter((data) => !!data)
    .filter((data) => !(data.save instanceof HomeData))
    .sort((a, b) => a.index - b.index)
    .map((data) => data.save)

  const loadAllHomeData = useCallback(async () => {
    if (openSavesState.error) return
    await backend.loadHomeBanks().then(
      R.match(
        (banks) => openSavesDispatch({ type: 'load_home_banks', payload: { banks } }),
        (err) => {
          displayError('Error Loading OpenHome Data', err)
          openSavesDispatch({ type: 'set_error', payload: err })
        }
      )
    )
  }, [backend, displayError, openSavesDispatch, openSavesState.error])

  const saveChanges = useCallback(async (): Promise<Result<null, SaveError[]>> => {
    if (!openSavesState.homeData) return R.Err([HomeDataNotLoaded])

    const result = await backend.startTransaction()

    if (R.isErr(result)) {
      displayError('Error Starting Save Transaction', result.err)
      return R.Err([TransactionStart(result.err)])
    }

    // Write appropriate trainer data to handler fields
    for (const save of allOpenSaves) {
      save.boxes.forEach((box) =>
        box.boxSlots.forEach((mon) => {
          if (mon instanceof OHPKM) {
            mon.tradeToSave(save)
          }
        })
      )
    }

    const saveWriters = allOpenSaves.map((save) => save.prepareWriter())

    const promises = [
      backend.writeAllSaveFiles(saveWriters),
      backend.writeHomeBanks({
        banks: openSavesState.homeData.banks,
        current_bank: openSavesState.homeData.currentBankIndex,
      }),
      backend.deleteHomeMons(
        openSavesState.monsToRelease
          .filter((mon) => mon instanceof OHPKM)
          .map(getMonFileIdentifier)
          .filter(filterUndefined)
      ),
    ]

    if (itemBagState.modified) {
      const saveBagResult = await backend.saveItemBag(itemBagState.itemCounts)
      if (R.isErr(saveBagResult)) {
        displayError('Error Saving Bag', saveBagResult.err)
        await backend.rollbackTransaction()
        return R.Err([SaveItemBagData(saveBagResult.err)])
      }
      bagDispatch({ type: 'clear_modified' })
    }

    const results = (await Promise.all(promises)).flat()
    const errors = results.filter(R.isErr).map((r) => r.err)

    if (errors.length) {
      displayError('Error Saving', errors)
      backend.rollbackTransaction()
      return R.Err(errors.map(BackendSaveError))
    }

    const sharedStateResult = await backend.saveSharedState()
    if (R.isErr(sharedStateResult)) {
      displayError('Error Saving', sharedStateResult.err)
      return R.Err([BackendSaveError(sharedStateResult.err)])
    }

    const commitResult = await backend.commitTransaction()
    if (R.isErr(commitResult)) {
      return R.Err([TransactionCommit(commitResult.err)])
    }

    openSavesDispatch({ type: 'clear_updated_box_slots' })
    openSavesDispatch({ type: 'clear_mons_to_release' })

    await loadAllHomeData()

    return R.Ok(null)
  }, [
    openSavesState.homeData,
    openSavesState.monsToRelease,
    backend,
    allOpenSaves,
    itemBagState.modified,
    itemBagState.itemCounts,
    loadAllHomeData,
    displayError,
    bagDispatch,
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
        loadAllHomeData()
        openSavesDispatch({ type: 'close_all_saves' })
      },
    })

    // the "stop listening" function should be called when the effect returns,
    // otherwise duplicate listeners will exist
    return () => {
      stopListening()
    }
  }, [backend, saveChanges, openSavesDispatch, loadAllHomeData, bagDispatch])

  useEffect(() => {
    if (!openSavesState.homeData) {
      loadAllHomeData()
    }
  }, [loadAllHomeData, openSavesState.homeData])

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
  | { _SaveErrorType: 'TransactionCommit'; message: string }
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

const TransactionCommit: (message: string) => SaveError = (message: string) => ({
  _SaveErrorType: 'TransactionCommit',
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
