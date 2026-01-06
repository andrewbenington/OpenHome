import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { displayIndexAdder, isBattleFormeItem } from '@openhome-core/pkm/util'
import { Errorable, R } from '@openhome-core/util/functional'
import { BackendContext } from '@openhome-ui/backend/backendContext'
import { ErrorIcon } from '@openhome-ui/components/Icons'
import LoadingIndicator from '@openhome-ui/components/LoadingIndicator'
import { PokedexUpdate } from '@openhome-ui/util/pokedex'
import { Callout } from '@radix-ui/themes'
import { ReactNode, useCallback, useContext, useEffect, useReducer } from 'react'
import { useLookups } from '../lookups'
import { OhpkmStoreContext, ohpkmStoreReducer } from './reducer'

export type OhpkmStoreProviderProps = {
  children: ReactNode
}

export default function OhpkmStoreProvider({ children }: OhpkmStoreProviderProps) {
  const backend = useContext(BackendContext)
  const [ohpkmStore, ohpkmStoreDispatch] = useReducer(ohpkmStoreReducer, {
    loaded: false,
    saving: false,
  })
  const lookups = useLookups()

  const loadStore = useCallback(async (): Promise<Errorable<Record<string, OHPKM>>> => {
    const onLoadError = (message: string) => {
      console.error(message)
      ohpkmStoreDispatch({ type: 'set_error', payload: message })
    }
    const homeResult = await backend.loadHomeMonLookup()

    if (R.isErr(homeResult)) {
      onLoadError(homeResult.err)
      return homeResult
    }

    const pokedexUpdates: PokedexUpdate[] = []

    for (const [identifier, mon] of Object.entries(homeResult.value)) {
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

    ohpkmStoreDispatch({ type: 'load_persisted_pkm_data', payload: homeResult.value })

    return homeResult
  }, [backend, ohpkmStoreDispatch])

  useEffect(() => {
    if (!ohpkmStore.loaded && !ohpkmStore.error) {
      loadStore()
    }
  }, [ohpkmStore.loaded, ohpkmStore.error, loadStore])

  useEffect(() => {
    if (lookups.loaded) {
      ohpkmStoreDispatch({ type: 'load_lookups', payload: lookups.lookups })
    }
  }, [lookups.loaded, lookups.lookups])

  if (ohpkmStore.error) {
    return (
      <Callout.Root>
        <Callout.Icon>
          <ErrorIcon />
        </Callout.Icon>
        <Callout.Text>{ohpkmStore.error}</Callout.Text>
      </Callout.Root>
    )
  }

  if (!ohpkmStore.loaded) {
    return <LoadingIndicator message="Loading OHPKM store..." />
  }

  return (
    <OhpkmStoreContext.Provider value={[ohpkmStore, ohpkmStoreDispatch, loadStore]}>
      {children}
    </OhpkmStoreContext.Provider>
  )
}
