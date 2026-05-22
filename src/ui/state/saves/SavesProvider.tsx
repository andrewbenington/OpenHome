import { OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { Option, R, range } from '@openhome-core/util/functional'
import { BackendContext } from '@openhome-ui/backend/backendContext'
import { ErrorIcon } from '@openhome-ui/components/Icons'
import useDisplayError from '@openhome-ui/hooks/displayError'
import { Button, Callout, Flex } from '@radix-ui/themes'
import { ReactNode, useCallback, useContext, useEffect, useReducer, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { SAVClass } from 'src/core/save/util'
import { Result } from 'src/core/util/functional'
import { Dialog } from 'src/ui/components/dialog/Dialog'
import PromptDialog from 'src/ui/components/dialog/PromptDialog'
import { useBanksAndBoxes } from '../../state-zustand/banks-and-boxes/store'
import { useConvertStrategies } from '../convert-strategies'
import { ItemBagContext } from '../items/reducer'
import { useOhpkmStore } from '../ohpkm'
import { openSavesReducer, SavesContext } from './reducer'

export type SavesProviderProps = {
  children: ReactNode
}

type SaveTypeCallback = (saveType?: SAVClass | PromiseLike<SAVClass>) => void

export default function SavesProvider({ children }: SavesProviderProps) {
  const backend = useContext(BackendContext)
  const [itemBagState, bagDispatch] = useContext(ItemBagContext)
  const [releaseWarningDisplayed, setReleaseWarningDisplayed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [changesSavedDisplayed, setChangesSavedDisplayed] = useState(false)
  const displayError = useDisplayError()
  const [openSavesState, openSavesDispatch] = useReducer(openSavesReducer, {
    monsToRelease: [],
    openSaves: {},
  })
  const { defaultConvertStrategy } = useConvertStrategies()
  const disambiguationResolver = useRef<Option<SaveTypeCallback>>(undefined)
  const [disambiguationSaveTypes, setDisambiguationSaveTypes] = useState<Option<SAVClass[]>>()
  const navigate = useNavigate()
  const ohpkmStore = useOhpkmStore()
  const { reloadBankStore } = useBanksAndBoxes()

  const promptDisambiguation = useCallback(async (possibleSaveTypes: SAVClass[]) => {
    setDisambiguationSaveTypes(possibleSaveTypes)

    return new Promise<Option<SAVClass>>((resolve) => {
      disambiguationResolver.current = resolve
    })
  }, [])

  const allOpenSaves = Object.values(openSavesState.openSaves)
    .sort((a, b) => a.index - b.index)
    .map((data) => data.save)

  const saveChanges = useCallback(
    async (releaseWarningAccepted: boolean): Promise<Result<null, SaveError[]>> => {
      if (saving) return R.Ok(null)

      const shouldReleasePokemon = openSavesState.monsToRelease.length > 0
      if (shouldReleasePokemon && !releaseWarningAccepted) {
        setReleaseWarningDisplayed(true)
        return R.Ok(null)
      }

      setSaving(true)
      const result = await backend.startTransaction()

      if (R.isErr(result)) {
        displayError('Error Starting Save Transaction', result.err)
        setSaving(false)
        return R.Err([TransactionStart(result.err)])
      }

      // Write appropriate trainer data to handler fields
      for (const save of allOpenSaves) {
        for (const boxNum of range(save.getBoxCount())) {
          for (const boxSlot of range(save.boxSlotCount)) {
            const data = save.getMonAt(boxNum, boxSlot)
            if (!data) continue

            const trackedData = ohpkmStore.loadIfTracked(data)
            if (!trackedData) continue

            trackedData.tradeToSave(save)
            save.setMonAt(boxNum, boxSlot, save.convertOhpkm(trackedData, defaultConvertStrategy))
          }
        }
      }

      const saveWriters = allOpenSaves.map((save) => save.prepareWriter())

      const promises = [
        backend.writeAllSaveFiles(saveWriters),
        backend.deleteHomeMons(
          openSavesState.monsToRelease.filter(
            (monOrIdentifier) => typeof monOrIdentifier === 'string'
          )
        ),
      ]

      if (itemBagState.modified) {
        const saveBagResult = await backend.saveItemBag(itemBagState.itemCounts)
        if (R.isErr(saveBagResult)) {
          displayError('Error Saving Bag', saveBagResult.err)
          await backend.rollbackTransaction()
          setSaving(false)
          return R.Err([SaveItemBagData(saveBagResult.err)])
        }
        bagDispatch({ type: 'clear_modified' })
      }

      const results = (await Promise.all(promises)).flat()
      const errors = results.filter(R.isErr).map((r) => r.err)

      if (errors.length) {
        displayError('Error Saving', errors)
        backend.rollbackTransaction()
        setSaving(false)
        return R.Err(errors.map(BackendSaveError))
      }

      const syncedStateResult = await backend.saveSyncedState()
      if (R.isErr(syncedStateResult)) {
        displayError('Error Saving', syncedStateResult.err)
        setSaving(false)
        return R.Err([BackendSaveError(syncedStateResult.err)])
      }

      const commitResult = await backend.commitTransaction()
      if (R.isErr(commitResult)) {
        setSaving(false)
        return R.Err([TransactionCommit(commitResult.err)])
      }

      openSavesDispatch({ type: 'clear_updated_box_slots' })
      openSavesDispatch({ type: 'clear_mons_to_release' })

      setChangesSavedDisplayed(true)

      setSaving(false)
      return R.Ok(null)
    },
    [
      saving,
      backend,
      allOpenSaves,
      openSavesState.monsToRelease,
      itemBagState.modified,
      itemBagState.itemCounts,
      displayError,
      ohpkmStore,
      defaultConvertStrategy,
      bagDispatch,
    ]
  )

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
      onSave: () => saveChanges(false),
      onReset: () => {
        openSavesDispatch({ type: 'clear_mons_to_release' })
        reloadBankStore()
        openSavesDispatch({ type: 'close_all_saves' })
      },
    })

    // the "stop listening" function should be called when the effect returns,
    // otherwise duplicate listeners will exist
    return () => {
      stopListening()
    }
  }, [backend, saveChanges, openSavesDispatch, bagDispatch, reloadBankStore])

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

  function hideReleaseWarning() {
    setReleaseWarningDisplayed(false)
  }

  async function saveChangesReleaseConfirmed() {
    await saveChanges(true)
    hideReleaseWarning()
  }

  function dismissSavedMessage() {
    setChangesSavedDisplayed(false)
  }

  return (
    <>
      <SavesContext
        value={{
          openSavesState,
          openSavesDispatch,
          allOpenSaves: Object.values(openSavesState.openSaves)
            .filter((data) => !!data)
            .sort((a, b) => a.index - b.index)
            .map((data) => data.save),
          promptDisambiguation,
        }}
      >
        <div />
        {children}
      </SavesContext>
      <SaveDisambiguationDialog
        open={Boolean(disambiguationSaveTypes)}
        saveTypes={disambiguationSaveTypes}
        onSelect={(selected) => {
          setDisambiguationSaveTypes(undefined)
          disambiguationResolver.current?.(selected)
          navigate('/home')
        }}
      />
      <PromptDialog
        title={`Release ${openSavesState.monsToRelease.length} Pokémon`}
        open={releaseWarningDisplayed}
        description={`Are you sure you want to release ${openSavesState.monsToRelease.length} Pokémon? This will permanently delete each Pokémon and its associated tracking data. This action cannot be undone.`}
        actions={[
          { uniqueLabel: 'Cancel', action: hideReleaseWarning, type: 'cancel' },
          {
            uniqueLabel: `Release ${openSavesState.monsToRelease.length} Pokémon`,
            action: saveChangesReleaseConfirmed,
            type: 'destructive',
          },
        ]}
      />
      <PromptDialog
        title={saving ? 'Saving Changes...' : 'Changes Saved'}
        open={changesSavedDisplayed || saving}
        onClose={dismissSavedMessage}
        description={
          saving
            ? 'Saving changes...'
            : 'All changes to boxes, save files, Pokédex, and settings have been saved.'
        }
        actions={[{ uniqueLabel: 'Ok', action: dismissSavedMessage }]}
      />
    </>
  )
}

type SaveError =
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

interface SaveDisambiguationDialogProps {
  open: boolean
  saveTypes?: SAVClass[]
  onSelect?: SaveTypeCallback
}

function SaveDisambiguationDialog({ open, saveTypes, onSelect }: SaveDisambiguationDialogProps) {
  return (
    <Dialog.Container open={open} onOpenChange={(open) => !open && onSelect?.()}>
      <Dialog.Title>Ambiguous Save Type</Dialog.Title>
      <Dialog.Description>Select a save type to proceed:</Dialog.Description>
      <Flex gap="1" mt="1" direction="column">
        {saveTypes?.map((saveType) => (
          <Button
            key={saveType.saveTypeID}
            onClick={() => onSelect?.(saveType)}
            style={{ width: '100%', minHeight: 36, height: 'fit-content' }}
          >
            {saveType.saveTypeName}
          </Button>
        ))}
      </Flex>
      <Dialog.Actions>
        <Dialog.Close>Cancel</Dialog.Close>
      </Dialog.Actions>
    </Dialog.Container>
  )
}
