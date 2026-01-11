import { ErrorIcon } from '@openhome-ui/components/Icons'
import LoadingIndicator from '@openhome-ui/components/LoadingIndicator'
import { Callout } from '@radix-ui/themes'
import { ReactNode } from 'react'
import { StoredLookups } from '../../backend/backendInterface'
import { useRustState } from '../rustState'
import { LookupsContext } from './lookups'

export type LookupsProviderProps = {
  children: ReactNode
}

function useLookupsTauri(onLoaded?: (data: StoredLookups) => void) {
  return useRustState<StoredLookups>(
    'lookups',
    (backend) => backend.loadLookups(),
    (backend, updated) => backend.updateLookups(updated.gen12, updated.gen345),
    onLoaded
  )
}

export default function LookupsProvider({ children }: LookupsProviderProps) {
  const lookupsState = useLookupsTauri()

  if (lookupsState.error) {
    return (
      <Callout.Root>
        <Callout.Icon>
          <ErrorIcon />
        </Callout.Icon>
        <Callout.Text>{lookupsState.error}</Callout.Text>
      </Callout.Root>
    )
  }

  if (!lookupsState.loaded) {
    return <LoadingIndicator message="Loading lookups..." />
  }

  return (
    <LookupsContext value={[lookupsState.state, lookupsState.updateState]}>
      {children}
    </LookupsContext>
  )
}
