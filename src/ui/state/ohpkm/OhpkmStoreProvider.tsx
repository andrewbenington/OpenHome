import { displayIndexAdder, isBattleFormeItem } from '@openhome-core/pkm/util'
import { BackendContext } from '@openhome-ui/backend/backendContext'
import { ErrorIcon } from '@openhome-ui/components/Icons'
import LoadingIndicator from '@openhome-ui/components/LoadingIndicator'
import { PokedexUpdate } from '@openhome-ui/util/pokedex'
import { Callout } from '@radix-ui/themes'
import { ReactNode, useCallback, useContext } from 'react'
import { OhpkmStoreContext, OhpkmStoreData } from '.'
import { useRustState } from '../rustState'

export type OhpkmStoreProviderProps = {
  children: ReactNode
}

function useOhpkmStoreTauri(onLoaded?: (data: OhpkmStoreData) => void) {
  return useRustState<OhpkmStoreData>(
    'ohpkm_store',
    (backend) => backend.loadOhpkmStore(),
    (backend, updated) => backend.updateOhpkmStore(updated),
    onLoaded
  )
}

export default function OhpkmStoreProvider({ children }: OhpkmStoreProviderProps) {
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
  const ohpkmStoreState = useOhpkmStoreTauri(updatePokedexFromStored)

  if (ohpkmStoreState.error) {
    return (
      <Callout.Root>
        <Callout.Icon>
          <ErrorIcon />
        </Callout.Icon>
        <Callout.Text>{ohpkmStoreState.error}</Callout.Text>
      </Callout.Root>
    )
  }

  if (!ohpkmStoreState.loaded) {
    return <LoadingIndicator message="Loading OHPKM store..." />
  }

  return (
    <OhpkmStoreContext value={[ohpkmStoreState.state, ohpkmStoreState.updateState]}>
      {children}
    </OhpkmStoreContext>
  )
}
