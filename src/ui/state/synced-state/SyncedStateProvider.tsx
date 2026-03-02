import { Callout } from '@radix-ui/themes'
import { Context, ReactNode, useMemo } from 'react'
import { Errorable } from '../../../core/util/functional'
import { ErrorIcon } from '../../components/Icons'
import LoadingIndicator from '../../components/LoadingIndicator'
import { RustStateManager } from './useSyncedState'

export type SyncedStateProviderProps<State> = {
  useStateManager: () => RustStateManager<State>
  StateContext: Context<[State, (updated: State) => Promise<Errorable<null>>]>
  stateDescription: string
  children: ReactNode
}

export default function SyncedStateProvider<State>(props: SyncedStateProviderProps<State>) {
  const { useStateManager, StateContext, stateDescription, children } = props
  const stateManager = useStateManager()

  const state = useMemo(() => stateManager.state, [stateManager.state])
  const updateState = useMemo(() => stateManager.updateState, [stateManager.updateState])

  if (stateManager.error) {
    return (
      <Callout.Root>
        <Callout.Icon>
          <ErrorIcon />
        </Callout.Icon>
        <Callout.Text>{stateManager.error}</Callout.Text>
      </Callout.Root>
    )
  }

  if (!stateManager.loaded || !state) {
    return <LoadingIndicator message={`Loading ${stateDescription}`} />
  }

  return <StateContext value={[state, updateState]}>{children}</StateContext>
}
