import { useState } from 'react'
import { SaveMonLocation } from '../saves'

type InitialState = { state: 'initial' }
type PendingSelectState = { state: 'pending_ohpkm_select'; saveLocation: SaveMonLocation }
type PendingConfirmState = {
  state: 'pending_confirm'
  saveLocation: SaveMonLocation
  ohpkmId: string
}
export type ReassociationState = InitialState | PendingSelectState | PendingConfirmState

export default function useTrackedDataRecovery() {
  const [state, setState] = useState<ReassociationState>({ state: 'initial' })

  function startRecovery(saveLocation: SaveMonLocation) {
    setState({ state: 'pending_ohpkm_select', saveLocation })
  }

  function selectTrackedData(ohpkmId: string) {
    if (state.state !== 'pending_ohpkm_select') return

    setState({ state: 'pending_confirm', ohpkmId, saveLocation: state.saveLocation })
  }

  function confirmRecovery() {
    if (state.state !== 'pending_confirm') return

    console.log(
      `Now I will reassociate ${state.ohpkmId} with the Pokémon at location ${state.saveLocation}`
    )
  }

  function cancelRecovery() {
    setState({ state: 'initial' })
  }

  return {
    ...state,
    startRecovery,
    selectTrackedData,
    confirmRecovery,
    cancelRecovery,
  }
}
