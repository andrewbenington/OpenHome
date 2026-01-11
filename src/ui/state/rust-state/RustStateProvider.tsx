import { Callout } from '@radix-ui/themes'
import { Context, ReactNode } from 'react'
import { Errorable } from '../../../core/util/functional'
import { ErrorIcon } from '../../components/Icons'
import LoadingIndicator from '../../components/LoadingIndicator'
import { RustStateManager } from './rustState'

export type RustStateProviderProps<State> = {
  useStateManager: () => RustStateManager<State>
  StateContext: Context<[State, (updated: State) => Promise<Errorable<null>>]>
  stateDescription: string
  children: ReactNode
}

export default function RustStateProvider<State>(props: RustStateProviderProps<State>) {
  const { useStateManager, StateContext, stateDescription, children } = props
  const stateManager = useStateManager()

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

  if (!stateManager.loaded) {
    return <LoadingIndicator message={`Loading ${stateDescription}`} />
  }

  return (
    <StateContext value={[stateManager.state, stateManager.updateState]}>{children}</StateContext>
  )
}
