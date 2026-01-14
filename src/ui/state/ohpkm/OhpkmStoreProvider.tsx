import { displayIndexAdder, isBattleFormeItem } from '@openhome-core/pkm/util'
import { BackendContext } from '@openhome-ui/backend/backendContext'
import {
  RustStateProvider,
  SharedStateController,
  useSharedState,
} from '@openhome-ui/state/rust-state'
import { PokedexUpdate } from '@openhome-ui/util/pokedex'
import { PropsWithChildren, useCallback, useContext } from 'react'
import { OhpkmStoreContext, OhpkmStoreData } from '.'
import { OHPKM } from '../../../core/pkm/OHPKM'
import { StringToB64 } from '../../backend/tauri/tauriInvoker'

function useOhpkmStoreTauri() {
  return useSharedState(useSharedOhpkmState())
}

export default function OhpkmStoreProvider({ children }: PropsWithChildren) {
  return (
    <RustStateProvider
      useStateManager={useOhpkmStoreTauri}
      StateContext={OhpkmStoreContext}
      stateDescription="OHPKM Store"
    >
      {children}
    </RustStateProvider>
  )
}

function loadOhpkmFromB64(response: StringToB64): OhpkmStoreData {
  console.log(response)
  return Object.fromEntries(
    Object.entries(response).map(([identifier, b64String]) => [
      identifier,
      new OHPKM(Uint8Array.fromBase64(b64String)),
    ])
  )
}

function stateReducer(prev: OhpkmStoreData, updated: OhpkmStoreData): OhpkmStoreData {
  return { ...prev, ...updated }
}

function useSharedOhpkmState(): SharedStateController<OhpkmStoreData, StringToB64> {
  const backend = useContext(BackendContext)

  const stateGetter = backend.loadOhpkmStore
  const stateUpdater = backend.updateOhpkmStore
  const updatePokedexFromStored = useCallback(
    async (data: OhpkmStoreData) => {
      console.log(Object.keys(data).toSorted())
      const pokedexUpdates: PokedexUpdate[] = []

      for (const [identifier, mon] of Object.entries(data)) {
        const hadErrors = mon.fixErrors()

        if (hadErrors) {
          console.warn(`mon had errors: ${mon.nickname} (${identifier})`)
          // backend.writeHomeMon(identifier, new Uint8Array(mon.toBytes()))
        }

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
    onLoaded: updatePokedexFromStored,
    convertRustState: loadOhpkmFromB64,
  }
}

function getPokedexUpdate(mon: OHPKM): PokedexUpdate {
  return {
    dexNumber: mon.dexNum,
    formeNumber: mon.formeNum,
    status: mon.isShiny() ? 'ShinyCaught' : 'Caught',
  }
}

function getPokedexUpdates(mon: OHPKM): PokedexUpdate[] {
  const updates = [getPokedexUpdate(mon)]
  if (isBattleFormeItem(mon.dexNum, mon.heldItemIndex)) {
    updates.push({
      ...getPokedexUpdate(mon),
      formeNumber: displayIndexAdder(mon.heldItemIndex)(mon.formeNum),
    })
  }
  return updates
}
