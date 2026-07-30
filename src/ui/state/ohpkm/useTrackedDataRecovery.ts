import { baseEvolutionsMatch } from '@openhome-core/pkm'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { expectExhaustive } from '@openhome-core/util'
import { $R, R, Result } from '@openhome-core/util/functional'
import { usePokemonSearch } from '@openhome-ui/components/search/usePokemonSearch'
import { useState } from 'react'
import { SaveMonLocation, useSaves } from '../saves'
import { useOhpkmStore } from './useOhpkmStore'

type InitialState = { state: 'initial' }
type PendingSelectState = { state: 'pending_ohpkm_select'; saveLocation: SaveMonLocation }
type PendingConfirmState = {
  state: 'pending_confirm'
  saveLocation: SaveMonLocation
  ohpkmId: string
}
export type ReassociationState = InitialState | PendingSelectState | PendingConfirmState

export type RecoveryError = {
  message: string
  data?: object
}

export default function useTrackedDataRecovery() {
  const ohpkmStore = useOhpkmStore()
  const savesManager = useSaves()
  const [state, setState] = useState<ReassociationState>({ state: 'initial' })

  function startRecovery(saveLocation: SaveMonLocation) {
    setState({ state: 'pending_ohpkm_select', saveLocation })
  }

  function selectTrackedData(ohpkmId: string) {
    if (state.state !== 'pending_ohpkm_select') throw Error('BAD STATE')

    setState({ state: 'pending_confirm', ohpkmId, saveLocation: state.saveLocation })
  }

  function confirmRecovery(): Result<null, RecoveryError> {
    if (state.state !== 'pending_confirm')
      return R.Err({ message: 'Invalid state', data: { state } })

    const mon = savesManager.getMonAtLocation(state.saveLocation)
    if (!mon) {
      console.error(state.saveLocation)
      return R.Err({
        message: 'No Pokémon found at location',
        data: { location: state.saveLocation },
      })
    }

    const save = savesManager.saveFromIdentifier(state.saveLocation.saveIdentifier)

    return $R(ohpkmStore.syncOhpkmIfTracked(state.ohpkmId, mon, save)).match(
      (updated) => {
        savesManager.overwriteMonAtLocation(state.saveLocation, updated?.openhomeId)

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
      setState({ state: 'pending_ohpkm_select', saveLocation: state.saveLocation })
    } else if (state.state === 'pending_ohpkm_select') {
      setState({ state: 'initial' })
    } else if (state.state !== 'initial') {
      expectExhaustive(state, `unrecognized state: ${state}`)
    }
  }

  function relevantOhpkmFilter(potentiallyRelevant: OHPKM) {
    if (state.state === 'initial') return true
    const monAtLocation = savesManager.getMonAtLocation(state.saveLocation)
    if (monAtLocation === undefined) return true

    return baseEvolutionsMatch(monAtLocation, potentiallyRelevant)
  }

  const pokemonSearchController = usePokemonSearch(relevantOhpkmFilter)

  return {
    ...state,
    startRecovery,
    selectTrackedData,
    confirmRecovery,
    cancelRecovery,
    goBack,

    pokemonSearchController,
  }
}
