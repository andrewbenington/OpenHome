import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { displayIndexAdder, isBattleFormeItem } from '@openhome-core/pkm/util'
import { BackendContext } from '@openhome-ui/backend/backendContext'
import { SyncedStateController, useSyncedState } from '@openhome-ui/state/synced-state'
import { PokedexUpdate } from '@openhome-ui/util/pokedex'
import { PropsWithChildren, useCallback, useContext } from 'react'
import { OhpkmStoreContext, OhpkmStoreData } from '.'
import { StringToB64 } from '../../backend/tauri/commands'
import SyncedStateProvider from '../synced-state/SyncedStateProvider'

function useOhpkmStoreTauri() {
  return useSyncedState(useSyncedOhpkmState())
}

export default function OhpkmStoreProvider({ children }: PropsWithChildren) {
  return (
    <SyncedStateProvider
      useStateManager={useOhpkmStoreTauri}
      StateContext={OhpkmStoreContext}
      stateDescription="OHPKM Store"
    >
      {children}
    </SyncedStateProvider>
  )
}

function loadOhpkmFromB64(response: StringToB64): OhpkmStoreData {
  return Object.fromEntries(
    Object.entries(response).map(([identifier, b64String]) => [
      identifier,
      OHPKM.fromBytes(Uint8Array.fromBase64(b64String).buffer),
    ])
  )
}

function stateReducer(prev: OhpkmStoreData, updated: OhpkmStoreData): OhpkmStoreData {
  return { ...prev, ...updated }
}

function useSyncedOhpkmState(): SyncedStateController<OhpkmStoreData, StringToB64> {
  const backend = useContext(BackendContext)

  const stateGetter = backend.loadOhpkmStore
  const stateUpdater = backend.addToOhpkmStore
  const updatePokedexAndFixOhpkms = useCallback(
    async (data: OhpkmStoreData) => {
      const pokedexUpdates: PokedexUpdate[] = []

      for (const [, mon] of Object.entries(data)) {
        pokedexUpdates.push(...getPokedexUpdates(mon))
      }

      backend.registerInPokedex(pokedexUpdates)
    },
    [backend]
  )

  return {
    identifier: 'ohpkm_store',
    stateGetter,
    stateReducer,
    stateUpdater,
    onLoaded: updatePokedexAndFixOhpkms,
    convertRustState: loadOhpkmFromB64,
  }
}

function getPokedexUpdate(mon: OHPKM): PokedexUpdate {
  return {
    dexNumber: mon.dexNum,
    formIndex: mon.formNum,
    status: mon.isShiny() ? 'ShinyCaught' : 'Caught',
  }
}

function getPokedexUpdates(mon: OHPKM): PokedexUpdate[] {
  const updates = [getPokedexUpdate(mon)]
  if (isBattleFormeItem(mon.dexNum, mon.heldItemIndex)) {
    updates.push({
      ...getPokedexUpdate(mon),
      formIndex: displayIndexAdder(mon.heldItemIndex)(mon.formNum),
    })
  }
  return updates
}
