import { StoredLookups } from '@openhome-ui/backend/backendInterface'
import { createContext, useContext } from 'react'

import { Errorable } from '@openhome-core/util/functional'
import * as E from 'fp-ts/lib/Either'

export function useLookups() {
  const [lookups, updateLookups] = useContext(LookupsContext)
  return { lookups, updateLookups }
}

export const LookupsContext = createContext<
  [StoredLookups, (updated: StoredLookups) => Promise<Errorable<null>>]
>([{ gen12: {}, gen345: {} }, async () => E.left('Uninitialized')])
