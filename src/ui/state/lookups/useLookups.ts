import { StoredLookups } from '@openhome-core/backend/backendInterface'
import { Errorable, R } from '@openhome-core/util/functional'
import { createContext, useContext } from 'react'

export function useLookups() {
  const [lookups, updateLookups] = useContext(LookupsContext)

  return { lookups, updateLookups }
}

export const LookupsContext = createContext<
  [StoredLookups, (updated: StoredLookups) => Promise<Errorable<null>>]
>([{ gen12: {}, gen345: {} }, async () => R.Err('Uninitialized')])
