import { displayIndexAdder, isBattleFormeItem } from '@openhome-core/pkm/util'
import { BackendContext } from '@openhome-ui/backend/backendContext'
import { RustStateProvider, useRustState } from '@openhome-ui/state/rust-state'
import { PokedexUpdate } from '@openhome-ui/util/pokedex'
import { PropsWithChildren, useCallback, useContext } from 'react'
import { OhpkmStoreContext, OhpkmStoreData } from '.'
import { OHPKM } from '../../../core/pkm/OHPKM'
import { StringToB64 } from '../../backend/tauri/tauriInvoker'

function useOhpkmStoreTauri() {
  const backend = useContext(BackendContext)
  const updatePokedexFromStored = useCallback(
    async (data: OhpkmStoreData) => {
      const pokedexUpdates: PokedexUpdate[] = []

      for (const [identifier, mon] of Object.entries(data)) {
        const hadErrors = mon.fixErrors()

        if (hadErrors) {
          backend.writeHomeMon(identifier, new Uint8Array(mon.toBytes()))
        }

        pokedexUpdates.push({
          dexNumber: mon.dexNum,
          formeNumber: mon.formeNum,
          status: mon.isShiny() ? 'ShinyCaught' : 'Caught',
        })

        if (isBattleFormeItem(mon.dexNum, mon.heldItemIndex)) {
          pokedexUpdates.push({
            dexNumber: mon.dexNum,
            formeNumber: displayIndexAdder(mon.heldItemIndex)(mon.formeNum),
            status: mon.isShiny() ? 'ShinyCaught' : 'Caught',
          })
        }
      }

      backend.registerInPokedex(pokedexUpdates)
    },
    [backend]
  )

  return useRustState<OhpkmStoreData, StringToB64>(
    'ohpkm_store',
    (backend) => backend.loadOhpkmStore(),
    (prev, updated) => ({ ...prev, ...updated }),
    (backend, updated) => backend.updateOhpkmStore(updated),
    updatePokedexFromStored,
    transformResponse
  )
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

function transformResponse(response: StringToB64): OhpkmStoreData {
  console.log(response)
  return Object.fromEntries(
    Object.entries(response).map(([identifier, b64String]) => [
      identifier,
      new OHPKM(Uint8Array.fromBase64(b64String)),
    ])
  )
}
