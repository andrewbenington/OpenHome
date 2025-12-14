import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { displayIndexAdder, isBattleFormeItem } from '@openhome-core/pkm/util'
import { BackendContext } from '@openhome-ui/backend/backendContext'
import { ErrorIcon } from '@openhome-ui/components/Icons'
import LoadingIndicator from '@openhome-ui/components/LoadingIndicator'
import { Callout } from '@radix-ui/themes'
import * as E from 'fp-ts/lib/Either'
import { ReactNode, useCallback, useContext, useEffect, useReducer } from 'react'
import { PokedexUpdate } from 'src/types/pokedex'
import { Errorable } from 'src/types/types'
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

  const loadStore = useCallback(async (): Promise<Errorable<Record<string, OHPKM>>> => {
    const onLoadError = (message: string) => {
      console.error(message)
      ohpkmStoreDispatch({ type: 'set_error', payload: message })
    }
    const homeResult = await backend.loadHomeMonLookup()

    if (E.isLeft(homeResult)) {
      onLoadError(homeResult.left)
      return E.left(homeResult.left)
    }

    const pokedexUpdates: PokedexUpdate[] = []

    for (const [identifier, mon] of Object.entries(homeResult.right)) {
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

    ohpkmStoreDispatch({ type: 'load_persisted_pkm_data', payload: homeResult.right })

    return homeResult
  }, [backend, ohpkmStoreDispatch])

  useEffect(() => {
    if (!ohpkmStore.loaded && !ohpkmStore.error) {
      loadStore()
    }
  }, [ohpkmStore.loaded, ohpkmStore.error, loadStore])

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
