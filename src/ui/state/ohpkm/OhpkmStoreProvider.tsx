import { displayIndexAdder, isBattleFormeItem } from '@openhome-core/pkm/util'
import { BackendContext } from '@openhome-ui/backend/backendContext'
import { RustStateProvider, useRustState } from '@openhome-ui/state/rust-state'
import { PokedexUpdate } from '@openhome-ui/util/pokedex'
import { PropsWithChildren, useCallback, useContext } from 'react'
import { OhpkmStoreContext, OhpkmStoreData } from '.'

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

  return useRustState<OhpkmStoreData>(
    'ohpkm_store',
    (backend) => backend.loadOhpkmStore(),
    (backend, updated) => backend.updateOhpkmStore(updated),
    updatePokedexFromStored
  )
}

export default function OhpkmStoreProvider({ children }: PropsWithChildren) {
  return (
    <RustStateProvider
      useStateManager={useOhpkmStoreTauri}
      StateContext={OhpkmStoreContext}
      stateDescription="OHPKM Store"
      children={children}
    />
  )
}
