import useBackend from '@openhome-core/backend/useBackend'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { displayIndexAdder, isBattleFormeItem } from '@openhome-core/pkm/util'
import { StringToB64 } from '@openhome-core/tauri/commands'
import { Option } from '@openhome-core/util/functional'
import { PokedexUpdate } from '@openhome-ui/util/pokedex'
import { PropsWithChildren, useCallback } from 'react'
import { OhpkmStoreContext, OhpkmStoreData } from '.'
import { OhpkmWrapper } from '@openhome-ui/state/convert-strategies/OhpkmWrapper.tsx'

export default function OhpkmStoreProvider({ children }: PropsWithChildren) {
  return (
    <OhpkmWrapper
      description="OHPKM Store"
      useStateManager={{
        identifier: 'lookups',
      }}
      stateContext={undefined}
    >
      {children}
    </OhpkmWrapper>
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

function stateReducer(prev: Option<OhpkmStoreData>, updated: OhpkmStoreData): OhpkmStoreData {
  return { ...prev, ...updated }
}

function getPokedexUpdate(mon: OHPKM): PokedexUpdate {
  return {
    nationalDex: mon.nationalDex,
    formIndex: mon.formIndex,
    status: mon.isShiny() ? 'ShinyCaught' : 'Caught',
  }
}

function getPokedexUpdates(mon: OHPKM): PokedexUpdate[] {
  const updates = [getPokedexUpdate(mon)]
  if (isBattleFormeItem(mon.nationalDex, mon.heldItemIndex)) {
    updates.push({
      ...getPokedexUpdate(mon),
      formIndex: displayIndexAdder(mon.heldItemIndex)(mon.formIndex),
    })
  }
  return updates
}
