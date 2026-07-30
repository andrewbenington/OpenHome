import { baseEvolutionsMatch } from '@openhome-core/pkm'
import { OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { expectExhaustive } from '@openhome-core/util'
import { $R, Option, R, Result } from '@openhome-core/util/functional'
import { usePokemonSearch } from '@openhome-ui/components/search/usePokemonSearch'
import { useState } from 'react'
import { SaveMonLocation, useSaves } from '../saves'
import { useOhpkmStore } from './useOhpkmStore'

type InitialState = { state: 'initial' }
type PendingSelectState = {
  state: 'pending_ohpkm_select'
  monToRecoverLocation: SaveMonLocation
  sourceMonOhpkmId: Option<OhpkmIdentifier>
}
type PendingConfirmState = {
  state: 'pending_confirm'
  monToRecoverLocation: SaveMonLocation
  sourceMonOhpkmId: Option<OhpkmIdentifier>
  recoveredDataOhpkmId: string
}
export type ReassociationState = InitialState | PendingSelectState | PendingConfirmState

export type RecoveryError = {
  message: string
  data?: object
}

// Handles the process of recovering OHPKM data for a given Pokémon at 'saveLocation'.
// This is useful if a Pokémon was not properly re-associated with its tracking data (OHPKM data)
// due to a bug at some point.
export default function useTrackedDataRecovery() {
  const ohpkmStore = useOhpkmStore()
  const savesManager = useSaves()
  const [state, setState] = useState<ReassociationState>({ state: 'initial' })

  function startRecovery(monToRecoverLocation: SaveMonLocation) {
    const monAtLocation = savesManager.getMonAtLocation(monToRecoverLocation)
    if (!monAtLocation)
      return R.Err({ message: 'No Pokémon at source location', data: monToRecoverLocation })

    const sourceMonOhpkmId = ohpkmStore.getIdIfTracked(monAtLocation)
    setState({ state: 'pending_ohpkm_select', monToRecoverLocation, sourceMonOhpkmId })

    return R.Ok(null)
  }

  function selectRecoveredDataId(ohpkmId: string) {
    if (state.state !== 'pending_ohpkm_select') throw Error('BAD STATE')

    setState({
      ...state,
      state: 'pending_confirm',
      recoveredDataOhpkmId: ohpkmId,
    })
  }

  function confirmRecovery(): Result<null, RecoveryError> {
    if (state.state !== 'pending_confirm')
      return R.Err({ message: 'Invalid state', data: { state } })

    const mon = savesManager.getMonAtLocation(state.monToRecoverLocation)
    if (!mon) {
      console.error(state.monToRecoverLocation)
      return R.Err({
        message: 'No Pokémon found at location',
        data: { location: state.monToRecoverLocation },
      })
    }

    const save = savesManager.saveFromIdentifier(state.monToRecoverLocation.saveIdentifier)

    return $R(ohpkmStore.syncOhpkmIfTracked(state.recoveredDataOhpkmId, mon, save)).match(
      (updated) => {
        savesManager.overwriteMonAtLocation(state.monToRecoverLocation, updated?.openhomeId)
        if (state.sourceMonOhpkmId) {
          savesManager.releaseMonsById(state.sourceMonOhpkmId)
        }

        setState({ state: 'initial' })
        return R.Ok(null)
      },
      (err) => R.Err({ message: 'Identifier not found', data: err })
    )
  }

  function cancelRecovery() {
    setState({ state: 'initial' })
  }

  function goBack() {
    if (state.state === 'pending_confirm') {
      setState({
        state: 'pending_ohpkm_select',
        monToRecoverLocation: state.monToRecoverLocation,
        sourceMonOhpkmId: state.sourceMonOhpkmId,
      })
    } else if (state.state === 'pending_ohpkm_select') {
      setState({ state: 'initial' })
    } else if (state.state !== 'initial') {
      expectExhaustive(state, `unrecognized state: ${state}`)
    }
  }

  function relevantOhpkmFilter(potentiallyRelevant: OHPKM) {
    if (state.state === 'initial') return true
    const monAtLocation = savesManager.getMonAtLocation(state.monToRecoverLocation)
    if (monAtLocation === undefined) return true

    return baseEvolutionsMatch(monAtLocation, potentiallyRelevant)
  }

  const pokemonSearchController = usePokemonSearch(relevantOhpkmFilter)

  const sourceMonOhpkmId = 'sourceMonOhpkmId' in state ? state.sourceMonOhpkmId : undefined
  const selectDataPrompt = sourceMonOhpkmId
    ? 'Select the data that this Pokémon will be merged into'
    : 'Select the data that should be associated with this Pokémon'
  const confirmPromptTitle = sourceMonOhpkmId
    ? 'Merge into this data?'
    : 'Associate with this data?'
  const confirmPromptDescription =
    sourceMonOhpkmId && 'recoveredDataOhpkmId' in state
      ? `By merging these Pokémon you will be updating the selected data using the original data, and deleting the original data. Specifically, "${state.recoveredDataOhpkmId}" will be updated using "${sourceMonOhpkmId}", and "${sourceMonOhpkmId}" will be released/deleted when you next save.`
      : 'If these are not the same Pokémon, you will be corrupting the selected Pokémon and deleting the other. Once you save, this action cannot be undone.'

  return {
    startRecovery,
    selectRecoveredDataId,
    confirmRecovery,
    cancelRecovery,
    goBack,

    state: state.state,
    pokemonSearchController,
    selectDataPrompt,
    confirmPromptTitle,
    confirmPromptDescription,
  }
}
