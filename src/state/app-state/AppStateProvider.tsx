import { Callout, Flex } from '@radix-ui/themes'
import { ReactNode } from 'react'
import { ErrorIcon } from 'src/components/Icons'
import LoadingIndicator from 'src/components/LoadingIndicator'
import { AppStateContext, usePossiblyLoadedAppState } from './appState'

type AppStateProviderProps = {
  children: ReactNode
}

export default function AppStateProvider({ children }: AppStateProviderProps) {
  const { state, loaded, error } = usePossiblyLoadedAppState()

  if (error) {
    return (
      <Flex width="100%" p="2" align="center" justify="center">
        <Callout.Root variant="soft" style={{ width: '100%', fontSize: 24 }}>
          <Callout.Icon>
            <ErrorIcon />
          </Callout.Icon>
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      </Flex>
    )
  }

  if (!loaded) {
    return <LoadingIndicator message="Loading app state..." />
  }

  return <AppStateContext.Provider value={state}> {children}</AppStateContext.Provider>
}
